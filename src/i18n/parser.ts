// 替换多语言中的序号占位符，例如 "Recharge {0} UV cost {1} yuan"。
// 包 @silenthill/h5-cc-i18n 的 get 不做占位符替换，由这里统一处理。
export function formatTxtMessage(template: string, args: Array<string | number>): string {
  return template.replace(/\{(\d+)\}/g, (match, indexText: string) => {
    const index = Number(indexText)
    const value = args[index]
    return value === undefined || value === null ? match : String(value)
  })
}
