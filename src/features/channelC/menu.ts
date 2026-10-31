/** 服务端 H5 菜单枚举：1=B，2=A，3=C；未配置时使用版本 A。 */
export function resolveChannelMenu(club: { h5_menu?: unknown } | null): 1 | 2 | 3 {
  const menu = Number(club?.h5_menu)
  return menu === 1 || menu === 3 ? menu : 2
}
