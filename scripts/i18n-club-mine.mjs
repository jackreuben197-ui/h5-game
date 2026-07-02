import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const i18nRoot = path.resolve(projectRoot, '../h5-cc-i18n/src/lang')

const LANG_FILES = {
  ZH: path.resolve(i18nRoot, 'USER_ZH.txt'),
  EN: path.resolve(i18nRoot, 'USER_EN.txt'),
  PT: path.resolve(i18nRoot, 'USER_PT.txt'),
  TW: path.resolve(i18nRoot, 'USER_TW.txt'),
}

const TARGET_DIRS = [
  path.resolve(projectRoot, 'src/views/club'),
  path.resolve(projectRoot, 'src/views/mine'),
]

const CHINESE_RE = /[\u4e00-\u9fff]+/g

const PHRASE_MAP = new Map([
  ['俱乐部', 'Club'],
  ['联盟', 'Union'],
  ['成员', 'Member'],
  ['玩家', 'Player'],
  ['代理', 'Agent'],
  ['创始人', 'Founder'],
  ['管理员', 'Admin'],
  ['会长', 'President'],
  ['副会长', 'VicePresident'],
  ['搜索', 'Search'],
  ['请输入', 'PleaseInput'],
  ['请先', 'PleaseFirst'],
  ['确认', 'Confirm'],
  ['取消', 'Cancel'],
  ['确定', 'Confirm'],
  ['加入', 'Join'],
  ['申请', 'Apply'],
  ['提交', 'Submit'],
  ['提交中', 'Submitting'],
  ['申请中', 'Applying'],
  ['成功', 'Success'],
  ['失败', 'Fail'],
  ['异常', 'Error'],
  ['删除', 'Delete'],
  ['编辑', 'Edit'],
  ['复制', 'Copy'],
  ['更新', 'Update'],
  ['加载', 'Load'],
  ['加载中', 'Loading'],
  ['加载更多', 'LoadMore'],
  ['暂无数据', 'NoData'],
  ['暂无', 'No'],
  ['没有更多', 'NoMore'],
  ['进入', 'Enter'],
  ['退出', 'Exit'],
  ['保存', 'Save'],
  ['头像', 'Avatar'],
  ['名称', 'Name'],
  ['简介', 'Description'],
  ['详情', 'Detail'],
  ['记录', 'Record'],
  ['牌局', 'TableGame'],
  ['奖池', 'Jackpot'],
  ['时间', 'Time'],
  ['时区', 'Timezone'],
  ['数据', 'Data'],
  ['收益', 'Income'],
  ['服务费', 'ServiceFee'],
  ['保险', 'Insurance'],
  ['总人数', 'TotalPeople'],
  ['总服务费', 'TotalServiceFee'],
  ['底分', 'Blind'],
  ['买入', 'BuyIn'],
  ['手数', 'Hands'],
  ['人', 'People'],
  ['桌', 'Table'],
  ['功能开发中', 'InDevelopment'],
  ['找不到', 'NotFound'],
  ['未找到', 'NotFound'],
  ['信息异常', 'InfoError'],
  ['获取', 'Fetch'],
  ['图片上传失败', 'UploadImageFail'],
  ['未命名', 'Unnamed'],
  ['名称', 'Name'],
  ['活动管理', 'ActivityManage'],
  ['基金', 'Fund'],
  ['邀请分享', 'InviteShare'],
  ['创建时间', 'CreateTime'],
  ['当前', 'Current'],
  ['等级', 'Level'],
  ['允许', 'Allow'],
  ['其他人', 'Others'],
  ['无需审批', 'NoApproval'],
  ['下线成员', 'DownlineMembers'],
])

const SIMPLE_CHAR_MAP = new Map([
  ['的', 'Of'],
  ['已', 'Done'],
  ['未', 'Not'],
  ['和', 'And'],
  ['或', 'Or'],
  ['再', 'Again'],
  ['可', 'Can'],
  ['无', 'No'],
  ['局', 'Round'],
  ['名', 'Name'],
  ['号', 'No'],
  ['币', 'Coin'],
  ['码', 'Code'],
])

function readLangFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)
  const keyToValue = new Map()
  const valueToKey = new Map()

  for (const line of lines) {
    if (!line || !line.includes('=')) continue
    const idx = line.indexOf('=')
    const key = line.slice(0, idx)
    const value = line.slice(idx + 1)
    if (!key) continue
    keyToValue.set(key, value)
    if (value && !valueToKey.has(value)) {
      valueToKey.set(value, key)
    }
  }

  return { lines, keyToValue, valueToKey }
}

function writeLangFile(filePath, lines) {
  fs.writeFileSync(filePath, `${lines.join('\n').replace(/\n+$/, '')}\n`, 'utf8')
}

function listFilesRecursive(dir) {
  const results = []
  if (!fs.existsSync(dir)) return results
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath))
      continue
    }
    if (/\.(vue|ts|js)$/.test(entry.name)) {
      results.push(fullPath)
    }
  }
  return results
}

function pascalCase(input) {
  return input
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function tokenizeChinese(zh) {
  const tokens = []
  let i = 0
  const phrases = [...PHRASE_MAP.keys()].sort((a, b) => b.length - a.length)

  while (i < zh.length) {
    let matched = false
    for (const phrase of phrases) {
      if (zh.startsWith(phrase, i)) {
        tokens.push(PHRASE_MAP.get(phrase))
        i += phrase.length
        matched = true
        break
      }
    }
    if (matched) continue

    const ch = zh[i]
    if (SIMPLE_CHAR_MAP.has(ch)) {
      tokens.push(SIMPLE_CHAR_MAP.get(ch))
    }
    i += 1
  }

  return tokens.filter(Boolean)
}

function buildKeyBase(zh) {
  const tokens = tokenizeChinese(zh)
  if (!tokens.length) return 'UIClub_Text'

  const compact = tokens.map((token) => (token.length > 10 ? token.slice(0, 6) : token))
  const limited = compact.length > 6 ? compact.slice(0, 6) : compact
  const keyName = pascalCase(limited.join(' ')) || 'Text'
  return `UIClub_${keyName}`
}

function escapeSingleQuoted(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function toJsSingleQuoted(str) {
  return `'${escapeSingleQuoted(str)}'`
}

function createContext(zhLang) {
  const existingKeys = new Set(zhLang.keyToValue.keys())
  const valueToKey = new Map(zhLang.valueToKey)
  const newEntries = new Map()

  function ensureKeyFor(zh) {
    const hit = valueToKey.get(zh)
    if (hit) return hit

    if (newEntries.has(zh)) return newEntries.get(zh)

    let base = buildKeyBase(zh)
    let key = base
    let suffix = 2
    while (existingKeys.has(key)) {
      key = `${base}${suffix}`
      suffix += 1
    }

    existingKeys.add(key)
    valueToKey.set(zh, key)
    newEntries.set(zh, key)
    return key
  }

  return { ensureKeyFor, newEntries }
}

function buildExprFromText(text, ensureKeyFor, preferWhole = true, useSingleQuotedText = false) {
  if (!/[\u4e00-\u9fff]/.test(text)) return null

  if (preferWhole) {
    const wholeKey = ensureKeyFor(text)
    if (wholeKey) {
      return { type: 'whole', expr: `t('${escapeSingleQuoted(wholeKey)}')` }
    }
  }

  const parts = []
  let lastIndex = 0
  let match

  CHINESE_RE.lastIndex = 0
  while ((match = CHINESE_RE.exec(text))) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'i18n', value: match[0], key: ensureKeyFor(match[0]) })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }

  const jsParts = parts
    .map((part) => {
      if (part.type === 'i18n') {
        return `t('${escapeSingleQuoted(part.key)}')`
      }
      return useSingleQuotedText ? toJsSingleQuoted(part.value) : JSON.stringify(part.value)
    })
    .filter((part) => part !== '""')

  if (!jsParts.length) return null
  return { type: 'parts', expr: jsParts.join(' + ') }
}

function buildTemplateTextReplacement(text, ensureKeyFor) {
  if (!/[\u4e00-\u9fff]/.test(text)) return text
  return text.replace(CHINESE_RE, (segment) => `{{ t('${ensureKeyFor(segment)}') }}`)
}

function processTemplate(templateCode, ensureKeyFor) {
  let code = templateCode
  let changed = false

  code = code.replace(/\{\{([\s\S]*?)\}\}/g, (full, expr) => {
    const transformed = transformJsLike(expr, ensureKeyFor)
    if (!transformed.changed || transformed.code === expr) {
      return full
    }
    changed = true
    return `{{${transformed.code}}}`
  })

  code = code.replace(
    /(\s)([A-Za-z_][\w-]*?)="([^"]*[\u4e00-\u9fff][^"]*)"/g,
    (full, space, attr, value) => {
      if (attr.startsWith('v-') || attr.startsWith(':') || attr.startsWith('@')) {
        return full
      }

      const exprInfo = buildExprFromText(value, ensureKeyFor, false, true)
      if (!exprInfo) return full
      changed = true
      return `${space}:${attr}="${exprInfo.expr}"`
    },
  )

  code = code.replace(/>([^<]*[\u4e00-\u9fff][^<]*)</g, (full, text) => {
    if (text.includes('{{') || text.includes('}}')) {
      return full
    }
    const replaced = buildTemplateTextReplacement(text, ensureKeyFor)
    if (replaced === text) return full
    changed = true
    return `>${replaced}<`
  })

  return { code, changed }
}

function parseQuotedString(code, startIndex, quote) {
  let i = startIndex + 1
  let content = ''
  while (i < code.length) {
    const ch = code[i]
    if (ch === '\\') {
      if (i + 1 < code.length) {
        content += code.slice(i, i + 2)
        i += 2
        continue
      }
    }
    if (ch === quote) {
      return { end: i, raw: code.slice(startIndex, i + 1), content }
    }
    content += ch
    i += 1
  }
  return null
}

function parseTemplateLiteral(code, startIndex) {
  let i = startIndex + 1
  const quasis = []
  const exprs = []
  let current = ''

  while (i < code.length) {
    const ch = code[i]
    if (ch === '\\') {
      if (i + 1 < code.length) {
        current += code.slice(i, i + 2)
        i += 2
        continue
      }
    }

    if (ch === '`') {
      quasis.push(current)
      return {
        end: i,
        raw: code.slice(startIndex, i + 1),
        quasis,
        exprs,
      }
    }

    if (ch === '$' && code[i + 1] === '{') {
      quasis.push(current)
      current = ''
      i += 2
      let depth = 1
      let exprStart = i
      while (i < code.length && depth > 0) {
        const ec = code[i]
        if (ec === '\\') {
          i += 2
          continue
        }
        if (ec === '{') depth += 1
        if (ec === '}') depth -= 1
        i += 1
      }
      exprs.push(code.slice(exprStart, i - 1))
      continue
    }

    current += ch
    i += 1
  }

  return null
}

function transformJsLike(code, ensureKeyFor) {
  let i = 0
  let out = ''
  let changed = false

  while (i < code.length) {
    const ch = code[i]
    const next = code[i + 1]

    if (ch === '/' && next === '/') {
      const end = code.indexOf('\n', i + 2)
      if (end === -1) {
        out += code.slice(i)
        break
      }
      out += code.slice(i, end + 1)
      i = end + 1
      continue
    }

    if (ch === '/' && next === '*') {
      const end = code.indexOf('*/', i + 2)
      if (end === -1) {
        out += code.slice(i)
        break
      }
      out += code.slice(i, end + 2)
      i = end + 2
      continue
    }

    if (ch === '"' || ch === "'") {
      const parsed = parseQuotedString(code, i, ch)
      if (!parsed) {
        out += ch
        i += 1
        continue
      }

      const literalText = parsed.raw.slice(1, -1)
      if (/[\u4e00-\u9fff]/.test(literalText)) {
        const exprInfo = buildExprFromText(literalText, ensureKeyFor, false)
        if (exprInfo) {
          out += exprInfo.expr
          changed = true
        } else {
          out += parsed.raw
        }
      } else {
        out += parsed.raw
      }
      i = parsed.end + 1
      continue
    }

    if (ch === '`') {
      const parsed = parseTemplateLiteral(code, i)
      if (!parsed) {
        out += ch
        i += 1
        continue
      }

      const hasChinese = parsed.quasis.some((q) => /[\u4e00-\u9fff]/.test(q))
      if (!hasChinese) {
        out += parsed.raw
        i = parsed.end + 1
        continue
      }

      const parts = []
      for (let idx = 0; idx < parsed.quasis.length; idx += 1) {
        const quasi = parsed.quasis[idx]
        if (quasi) {
          const exprInfo = buildExprFromText(quasi, ensureKeyFor, false)
          if (exprInfo) {
            parts.push(exprInfo.expr)
          } else {
            parts.push(JSON.stringify(quasi))
          }
        }
        if (idx < parsed.exprs.length) {
          parts.push(`(${parsed.exprs[idx]})`)
        }
      }

      out += parts.filter((part) => part !== '""').join(' + ') || '""'
      changed = true
      i = parsed.end + 1
      continue
    }

    out += ch
    i += 1
  }

  return { code: out, changed }
}

function hasI18nImport(code) {
  return /import\s*\{[^}]*\bt\b[^}]*\}\s*from\s*['"]@\/i18n['"]/.test(code)
}

function ensureI18nImport(code) {
  if (hasI18nImport(code)) return code

  const i18nImportWithNamed = code.match(
    /import\s*\{([^}]*)\}\s*from\s*['"]@\/i18n['"]/,
  )
  if (i18nImportWithNamed) {
    const named = i18nImportWithNamed[1]
    const tokens = named
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean)
    if (!tokens.includes('t')) {
      tokens.push('t')
    }
    const replacement = `import { ${tokens.join(', ')} } from '@/i18n'`
    return code.replace(i18nImportWithNamed[0], replacement)
  }

  const importMatch = [...code.matchAll(/^import\s.+$/gm)]
  if (importMatch.length) {
    const last = importMatch[importMatch.length - 1]
    const insertPos = last.index + last[0].length
    return `${code.slice(0, insertPos)}\nimport { t } from '@/i18n'${code.slice(insertPos)}`
  }

  return `import { t } from '@/i18n'\n${code}`
}

function processVueFile(content, ensureKeyFor) {
  const templateMatch = content.match(/<template>[\s\S]*?<\/template>/)
  const scriptMatch = content.match(/<script[\s\S]*?<\/script>/)

  let changed = false
  let needsImport = false
  let next = content

  if (templateMatch) {
    const fullTemplate = templateMatch[0]
    const inner = fullTemplate.replace(/^<template>/, '').replace(/<\/template>$/, '')
    const transformed = processTemplate(inner, ensureKeyFor)
    if (transformed.changed) {
      changed = true
      needsImport = true
      const replaced = `<template>${transformed.code}</template>`
      next = next.replace(fullTemplate, replaced)
    }
  }

  if (scriptMatch) {
    const fullScript = scriptMatch[0]
    const openTag = fullScript.match(/^<script[^>]*>/)?.[0] || '<script>'
    const closeTag = '</script>'
    const inner = fullScript.slice(openTag.length, fullScript.length - closeTag.length)
    const transformed = transformJsLike(inner, ensureKeyFor)
    let scriptCode = transformed.code
    if (transformed.changed) {
      changed = true
      needsImport = true
    }

    if (needsImport && !hasI18nImport(scriptCode)) {
      scriptCode = ensureI18nImport(scriptCode)
      changed = true
    }

    const replaced = `${openTag}${scriptCode}${closeTag}`
    next = next.replace(fullScript, replaced)
  }

  return { content: next, changed }
}

function processJsTsFile(content, ensureKeyFor) {
  const transformed = transformJsLike(content, ensureKeyFor)
  let code = transformed.code
  let changed = transformed.changed

  if (changed && !hasI18nImport(code)) {
    code = ensureI18nImport(code)
    changed = true
  }

  return { content: code, changed }
}

function syncLangFiles(langFiles, newEntries) {
  if (!newEntries.size) return 0
  const appended = []
  for (const [zh, key] of newEntries.entries()) {
    appended.push([key, zh])
  }

  for (const lang of Object.values(langFiles)) {
    const content = fs.readFileSync(lang, 'utf8')
    const lines = content.split(/\r?\n/)
    const existing = new Set()
    for (const line of lines) {
      if (!line.includes('=')) continue
      existing.add(line.slice(0, line.indexOf('=')))
    }
    for (const [key, zh] of appended) {
      if (!existing.has(key)) {
        lines.push(`${key}=${zh}`)
      }
    }
    writeLangFile(lang, lines)
  }

  return appended.length
}

function main() {
  const dryRun = process.argv.includes('--dry-run')
  const zhLang = readLangFile(LANG_FILES.ZH)
  const ctx = createContext(zhLang)
  const files = TARGET_DIRS.flatMap((dir) => listFilesRecursive(dir)).sort()

  let touched = 0

  for (const filePath of files) {
    const original = fs.readFileSync(filePath, 'utf8')
    const ext = path.extname(filePath)

    let processed
    if (ext === '.vue') {
      processed = processVueFile(original, ctx.ensureKeyFor)
    } else {
      processed = processJsTsFile(original, ctx.ensureKeyFor)
    }

    if (!processed.changed || processed.content === original) continue

    touched += 1
    if (!dryRun) {
      fs.writeFileSync(filePath, processed.content, 'utf8')
    }
  }

  const added = dryRun ? ctx.newEntries.size : syncLangFiles(LANG_FILES, ctx.newEntries)

  console.log(`[i18n-club-mine] files scanned: ${files.length}`)
  console.log(`[i18n-club-mine] files changed: ${touched}`)
  console.log(`[i18n-club-mine] keys added: ${added}`)

  if (ctx.newEntries.size) {
    const preview = [...ctx.newEntries.entries()].slice(0, 20)
    console.log('[i18n-club-mine] new key preview:')
    for (const [zh, key] of preview) {
      console.log(`  ${key}=${zh}`)
    }
    if (ctx.newEntries.size > preview.length) {
      console.log(`  ... and ${ctx.newEntries.size - preview.length} more`)
    }
  }
}

main()
