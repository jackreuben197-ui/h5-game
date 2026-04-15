export type TxtLanguageMap = Record<string, string>

// 解析 key=value 的 txt 文本，支持注释行和常见转义字符。
export function parseTxtLanguage(raw: string): TxtLanguageMap {
  const map: TxtLanguageMap = {}
  const lines = raw.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith(';')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    if (!key) {
      continue
    }

    const value = line.slice(separatorIndex + 1).trim()
    map[key] = decodeEscapedChars(value)
  }

  return map
}

// 替换多语言中的序号占位符，例如 "Recharge {0} UV cost {1} yuan"。
export function formatTxtMessage(template: string, args: Array<string | number>): string {
  return template.replace(/\{(\d+)\}/g, (match, indexText: string) => {
    const index = Number(indexText)
    const value = args[index]
    return value === undefined || value === null ? match : String(value)
  })
}

function decodeEscapedChars(value: string): string {
  return value.replace(/\\r/g, '\r').replace(/\\n/g, '\n').replace(/\\t/g, '\t')
}
