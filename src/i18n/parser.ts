// 替换多语言中的占位符：
// - 数字占位符 {0} {1}：按位置参数下标取值，例如 t(key, 'a', 'b')
// - 命名占位符 {num} {name}：传单个对象作命名表，例如 t(key, { num: 3 })
// 包 @silenthill/h5-cc-i18n 的 get 不做占位符替换，由这里统一处理。
export type FormatArg = string | number
export type FormatArgs = Record<string, FormatArg>

export function formatTxtMessage(
  template: string,
  args: FormatArg[] | [FormatArgs],
): string {
  const named =
    args.length === 1 && typeof args[0] === 'object' && args[0] !== null
      ? (args[0] as FormatArgs)
      : null
  return template.replace(/\{([^{}]+)\}/g, (match, name: string) => {
    if (named) {
      if (!Object.prototype.hasOwnProperty.call(named, name)) return match
      const value = named[name]
      return value === undefined || value === null ? match : String(value)
    }
    if (!/^\d+$/.test(name)) return match
    const value = (args as FormatArg[])[Number(name)]
    return value === undefined || value === null ? match : String(value)
  })
}
