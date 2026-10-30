/** 仅用于 Vite 纯 H5 开发；生产构建始终保留完整的 Cocos / WS 登录约束。 */
export function isH5OnlyDevMode(): boolean {
  return import.meta.env?.DEV === true && import.meta.env?.VITE_H5_ONLY === 'true'
}

/** 代理地址可以是同源路径，自动沿用当前开发服务器的主机和端口。 */
export function resolveWsProxyUrl(proxyUrl: string, pageUrl: string): string {
  const url = new URL(proxyUrl, pageUrl)
  if (url.protocol === 'http:') url.protocol = 'ws:'
  if (url.protocol === 'https:') url.protocol = 'wss:'
  return url.toString()
}
