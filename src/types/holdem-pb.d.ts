// 与 Vite 的运行时别名一致，由包的 exports.types 解析正式声明。
// 避免路径别名直接指向 pnpm 软链接下的 dist，更新协议后编辑器继续缓存旧 CodeMap。
declare module '@holdem-pb' {
  export * from '@silenthill/agreement-web'
}
