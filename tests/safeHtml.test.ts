import assert from 'node:assert/strict'
import test from 'node:test'
import { cocosColorTextToSafeHtml, escapeHtml, sanitizeRichHtml } from '../src/utils/safeHtml.ts'

test('escapeHtml escapes executable markup and attribute delimiters', () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert('xss')">&`),
    '&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;&amp;',
  )
})

test('Cocos color markup keeps the highlight but escapes dynamic content', () => {
  assert.equal(
    cocosColorTextToSafeHtml(
      '玩家<img src=x onerror=alert(1)><color=#F8C255FF>皇家同花顺<script>x</script></color>',
    ),
    '玩家&lt;img src=x onerror=alert(1)&gt;<span class="replay-highlight">皇家同花顺&lt;script&gt;x&lt;/script&gt;</span>',
  )
})

test('sanitizeRichHtml safely escapes all markup when DOMParser is unavailable', () => {
  assert.equal(
    sanitizeRichHtml('<script>alert(1)</script><b>公告</b>'),
    '&lt;script&gt;alert(1)&lt;/script&gt;&lt;b&gt;公告&lt;/b&gt;',
  )
})
