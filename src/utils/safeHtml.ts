const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const RICH_TEXT_TAGS = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'DIV',
  'EM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'I',
  'IMG',
  'LI',
  'OL',
  'P',
  'SPAN',
  'STRONG',
  'U',
  'UL',
])

const SAFE_STYLE_PROPERTIES = new Set([
  'color',
  'background-color',
  'font-size',
  'font-style',
  'font-weight',
  'line-height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'text-align',
  'text-decoration',
  'white-space',
])

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character] ?? character)
}

function isSafeUrl(value: string, allowImageData = false): boolean {
  const normalized = value.trim()
  if (!normalized) return false
  if (allowImageData && /^data:image\/(?:png|gif|jpe?g|webp);base64,/i.test(normalized)) {
    return true
  }
  if (/^(?:https?:|mailto:|tel:)/i.test(normalized)) return true
  return /^(?:[./]|#)/.test(normalized) && !/^\/\//.test(normalized)
}

function sanitizeStyle(source: string): string {
  return source
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .flatMap((declaration) => {
      const separator = declaration.indexOf(':')
      if (separator <= 0) return []
      const property = declaration.slice(0, separator).trim().toLowerCase()
      const value = declaration.slice(separator + 1).trim()
      if (!SAFE_STYLE_PROPERTIES.has(property)) return []
      if (!value || /(?:url|expression|@import|javascript:|behavior\s*:)/i.test(value)) return []
      return [`${property}: ${value}`]
    })
    .join('; ')
}

function sanitizeElement(element: Element): void {
  if (!RICH_TEXT_TAGS.has(element.tagName)) {
    element.replaceWith(...Array.from(element.childNodes))
    return
  }

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase()
    const value = attribute.value
    const keep =
      (name === 'class' && element.tagName === 'SPAN') ||
      (name === 'style' && sanitizeStyle(value)) ||
      (element.tagName === 'A' && name === 'href' && isSafeUrl(value)) ||
      (element.tagName === 'A' && (name === 'title' || name === 'target')) ||
      (element.tagName === 'IMG' && name === 'src' && isSafeUrl(value, true)) ||
      (element.tagName === 'IMG' && (name === 'alt' || name === 'title'))

    if (!keep) {
      element.removeAttribute(attribute.name)
      continue
    }
    if (name === 'style') {
      const style = sanitizeStyle(value)
      if (style) element.setAttribute('style', style)
      else element.removeAttribute('style')
    }
  }

  if (element.tagName === 'A') {
    element.setAttribute('rel', 'noopener noreferrer')
    if (element.getAttribute('target') !== '_blank') element.removeAttribute('target')
  }
}

/** 清洗接口返回的公告富文本；服务端 HTML 必须经过此函数后才能传给 v-html。 */
export function sanitizeRichHtml(source: unknown): string {
  const html = String(source ?? '')
  if (!html || typeof DOMParser === 'undefined') return escapeHtml(html)

  const document = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = document.body.firstElementChild
  if (!root) return ''

  for (const blocked of Array.from(root.querySelectorAll('script,style,iframe,object,embed,svg,math'))) {
    blocked.remove()
  }
  for (const element of Array.from(root.querySelectorAll('*'))) {
    sanitizeElement(element)
  }
  return root.innerHTML
}

/** 将 Cocos 的 <color> 描述转换为只含受控 span 的安全 HTML。 */
export function cocosColorTextToSafeHtml(source: unknown): string {
  const text = String(source ?? '').replace(/\n/g, '')
  const colorPattern = /<color=#[A-Fa-f0-9]{6,8}>([\s\S]*?)<\/color>/g
  let result = ''
  let cursor = 0

  for (let match = colorPattern.exec(text); match; match = colorPattern.exec(text)) {
    result += escapeHtml(text.slice(cursor, match.index))
    result += `<span class="replay-highlight">${escapeHtml(match[1])}</span>`
    cursor = colorPattern.lastIndex
  }
  result += escapeHtml(text.slice(cursor))
  return result
}
