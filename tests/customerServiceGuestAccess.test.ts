import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { registerHooks } from 'node:module'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`

test('customer-service requests allow authenticated guest accounts', async () => {
  const httpMockUrl = moduleUrl(`
    export const calls = [];
    export default {
      async post(...args) {
        calls.push(args);
        return { data: { code: 0, data: { list: [] } } };
      },
    };
  `)
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === '@/api/http') return { url: httpMockUrl, shortCircuit: true }
      return nextResolve(specifier, context)
    },
  })

  try {
    const chat = await import('../src/api/chat.ts')
    const cmsext = await import('../src/api/cmsext.ts')
    const imoss = await import('../src/api/imoss.ts')
    const { calls } = await import(httpMockUrl)

    await chat.postChatSupportChannelListApi()
    await chat.postChatSupportMessageListApi()
    await chat.postChatSupportMessageReadApi()
    await chat.postChatSupportMessageSendApi()
    await cmsext.postCmsExtImServiceListApi()
    await imoss.postImossGameClientUploadImageApi()
    await imoss.postImossGameClientUploadAudioApi()

    assert.deepEqual(
      calls.map((call: unknown[]) => call[0]),
      [
        '/chat/support/channel/list',
        '/chat/support/message/list',
        '/chat/support/message/read',
        '/chat/support/message/send',
        '/cmsext/im/service/list',
        '/imoss/game_client/upload/image',
        '/imoss/game_client/upload/audio',
      ],
    )
    calls.forEach((call: unknown[]) => {
      assert.equal((call[2] as { allowGuestAccount?: boolean })?.allowGuestAccount, true)
    })
  } finally {
    hooks.deregister()
  }
})

test('guest sessions mount chat without mounting real-user-only notices', () => {
  const source = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')

  assert.match(source, /hasChatSession[^\n]*sessionToken\.trim\(\)/)
  assert.match(
    source,
    /<Teleport v-if="hasRealUserSession" to="body">\s*<GlobalMessageTodoNotice \/>/,
  )
  assert.match(
    source,
    /<Teleport v-if="hasChatSession" to="body">\s*<GlobalCustomerServiceChat \/>/,
  )
})

test('H5 customer-service buttons do not require a real-user login', () => {
  const paths = [
    '../src/views/home/gameList.vue',
    '../src/views/mtt/mttList.vue',
    '../src/views/club/home/ClubIndexView.vue',
    '../src/components/Club/ChannelClubInfoPanel.vue',
  ]

  paths.forEach((path) => {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8')
    const handler = source.match(
      /function handleOpenCustomerService\([^)]*\)[^{]*\{([\s\S]*?)\n\}/,
    )?.[1]
    assert.ok(handler, `${path} should define handleOpenCustomerService`)
    assert.doesNotMatch(handler, /requireRealUser/)
    assert.match(handler, /openGlobalCustomerServiceChat/)
  })
})

test('table support chat restores H5 visibility and returns to Cocos when closed', () => {
  const tableSource = readFileSync(
    new URL('../../pokerqueen/assets/script/game/UITexas.ts', import.meta.url),
    'utf8',
  )
  const actionSource = readFileSync(
    new URL('../src/components/BridgePanel/actionRegistry.ts', import.meta.url),
    'utf8',
  )
  const chatSource = readFileSync(
    new URL(
      '../src/components/GlobalCustomerServiceChat/GlobalCustomerServiceChat.vue',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(
    tableSource,
    /panelType: 'supportChat',\s*ensureVisible: true,/,
  )
  assert.match(actionSource, /returnToCocosOnClose: payload\.ensureVisible === true/)
  assert.match(
    chatSource,
    /if \(chatContext\.value\.returnToCocosOnClose\)[\s\S]*?setH5Visible\(false\)/,
  )
})
