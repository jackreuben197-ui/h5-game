import { defineConfig, loadEnv, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { extname } from 'node:path'
import { readFileSync } from 'node:fs'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

// 注入 @silenthill/agreement-web 的 UMD bundle (holdem-pb.js) 到 index.html，
// 并在 dev / build 两种模式下从 node_modules 解析文件。
//
// 协议层 import { Code, ServerMessageXxx } from '@silenthill/agreement-web' 走的是
// dist/proxy.js（28 KB，惰性 getter 转去读 window.HoldemPB）；实际 pb 类实现在
// holdem-pb.js（~3.7 MB raw）里，由本插件以独立 <script> 形式加载到 window.HoldemPB。
//
// 设计参考：服务端 README 的「UMD bundle + proxy layer」模式。
function holdemPbInjectPlugin(): Plugin {
  const PKG_FILE = '@silenthill/agreement-web/dist/holdem-pb.js'
  const VIRTUAL_PATH = '/libs/holdem-pb.js'
  const PUBLIC_PATH = './libs/holdem-pb.js'
  let resolvedFile = ''

  return {
    name: 'holdem-pb-inject',
    configResolved() {
      // 用 import.meta.resolve 这种新 API 不通用；直接拼 node_modules 路径稳。
      resolvedFile = fileURLToPath(new URL(`./node_modules/${PKG_FILE}`, import.meta.url))
    },
    // dev：拦截 /libs/holdem-pb.js，直接从 node_modules 流回
    configureServer(server) {
      server.middlewares.use(VIRTUAL_PATH, (_req, res) => {
        try {
          const buf = readFileSync(resolvedFile)
          res.setHeader('Content-Type', 'application/javascript')
          res.setHeader('Cache-Control', 'public, max-age=3600')
          res.end(buf)
        } catch (e) {
          res.statusCode = 500
          res.end(`/* holdem-pb-inject: cannot read ${resolvedFile}: ${String(e)} */`)
        }
      })
    },
    // build：把 holdem-pb.js 当 asset 发出去
    generateBundle() {
      const source = readFileSync(resolvedFile)
      this.emitFile({
        type: 'asset',
        fileName: 'libs/holdem-pb.js',
        source,
      })
    },
    // dev + build：把 <script> 插到 index.html 的 <head> 末尾，保证早于 type=module 主入口
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const tag = `<script src="${PUBLIC_PATH}" charset="utf-8"></script>`
        // 已经手动插过就不重复加
        if (html.includes(PUBLIC_PATH)) return html
        return html.replace('</head>', `    ${tag}\n  </head>`)
      },
    },
  }
}

interface WebpackLikeStatsModule {
  id: string
  identifier: string
  name: string
  size: number
  chunks: string[]
  depth: number
}

interface WebpackLikeStatsChunk {
  id: string
  modules: WebpackLikeStatsModule[]
}

interface WebpackLikeStatsAsset {
  name: string
  size: number
  chunks: string[]
  type: 'asset'
  info: {
    javascriptModule: boolean
  }
}

// 为 webpack-bundle-analyzer 生成兼容的 stats.json。
// 该插件只收集 JS chunk 与其模块大小映射，满足体积可视化所需最小字段。
function webpackBundleStatsPlugin(): Plugin {
  return {
    name: 'webpack-bundle-stats',
    apply: 'build',
    generateBundle(_, bundle) {
      const chunks: WebpackLikeStatsChunk[] = []
      const assets: WebpackLikeStatsAsset[] = []
      const entrypointAssets = new Set<string>()

      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') {
          continue
        }

        const chunkId = output.fileName
        const chunkModules: WebpackLikeStatsModule[] = Object.entries(output.modules).map(
          ([moduleId, renderedModule]) => ({
            id: moduleId,
            identifier: moduleId,
            name: moduleId,
            size: renderedModule.renderedLength || 0,
            chunks: [chunkId],
            depth: 1,
          }),
        )

        chunks.push({
          id: chunkId,
          modules: chunkModules,
        })

        assets.push({
          name: output.fileName,
          size: Buffer.byteLength(output.code || '', 'utf-8'),
          chunks: [chunkId],
          type: 'asset',
          info: {
            javascriptModule: true,
          },
        })

        if (output.isEntry) {
          entrypointAssets.add(output.fileName)
        }
      }

      const entrypointNames = entrypointAssets.size > 0 ? [...entrypointAssets] : assets.map((a) => a.name)

      const stats = {
        assets,
        chunks,
        entrypoints: {
          app: {
            name: 'app',
            assets: entrypointNames.map((name) => ({ name })),
          },
        },
      }

      this.emitFile({
        type: 'asset',
        fileName: 'stats.json',
        source: JSON.stringify(stats, null, 2),
      })
    },
  }
}

interface PackageJsonLike {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

// 统一解析布尔环境变量，兼容 true/1/yes/on 等写法。
function toBoolean(value: string | undefined): boolean {
  return ['true', '1', 'yes', 'on'].includes((value || '').toLowerCase())
}

// 读取 package.json 的关键信息，注入给运行时代码做版本/构建信息展示。
function readAppPkgInfo(): Required<PackageJsonLike> {
  const packageJsonPath = fileURLToPath(new URL('./package.json', import.meta.url))
  const packageJsonText = readFileSync(packageJsonPath, 'utf-8')
  const pkg = JSON.parse(packageJsonText) as PackageJsonLike

  return {
    name: pkg.name || 'h5-game',
    version: pkg.version || '0.0.0',
    dependencies: pkg.dependencies || {},
    devDependencies: pkg.devDependencies || {},
  }
}

// https://vite.dev/config/
// bridge 协议来源开关：决定 `@bridge-protocol` 解析到哪份代码。
//   pokerqueen（默认）：本地 src/bridge/protocol/，兼容旧 cocos 项目
//   h5-cc-game        ：@silenthill/h5-cc-bridge npm 包，与 h5-cc-game 共用同一份协议
type BridgeTarget = 'pokerqueen' | 'h5-cc-game'
function resolveBridgeTarget(raw: string | undefined): BridgeTarget {
  return raw === 'h5-cc-game' ? 'h5-cc-game' : 'pokerqueen'
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const bridgeTarget = resolveBridgeTarget(env.VITE_BRIDGE_TARGET)
  const proxyTarget = env.VITE_PROXY_TARGET || 'https://test2.awanptest.com'
  const proxyImTarget = env.VITE_PROXY_IM_TARGET || 'https://test-impubnub.awanptest.com'
  const enableSourceMap = env.VITE_BUILD_SOURCEMAP === 'true'
  const enableDropConsole = toBoolean(env.VITE_DROP_CONSOLE)
  const enableBundleAnalyze = toBoolean(env.VITE_BUNDLE_ANALYZE) || mode === 'analyze'
  const isBuild = command === 'build'
  const appPkgInfo = readAppPkgInfo()
  const appInfo = {
    pkg: appPkgInfo,
    lastBuildTime: new Date().toISOString(),
  }

  return {
    base: './',
    define: {
      // 运行时可读取构建元信息（版本号、依赖、构建时间）。
      __APP_INFO__: JSON.stringify(appInfo),
    },
    plugins: [
      holdemPbInjectPlugin(),
      vue(),
      Components({
        dts: true,
        resolvers: [VantResolver()],
      }),
      legacy({
        // Keep compatibility for older Android/iOS WebView environments.
        targets: ['defaults', 'Android >= 7', 'iOS >= 12'],
        modernPolyfills: true,
      }),
      ...(enableBundleAnalyze ? [webpackBundleStatsPlugin()] : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // bridge 协议来源（受 VITE_BRIDGE_TARGET 控制）：
        //   pokerqueen  → 项目内 src/bridge/protocol，旧 cocos 项目用
        //   h5-cc-game  → npm 包 @silenthill/h5-cc-bridge 的 h5-side 入口（含 envelope 运行时）
        '@bridge-protocol':
          bridgeTarget === 'h5-cc-game'
            ? '@silenthill/h5-cc-bridge/h5-side'
            : fileURLToPath(new URL('./src/bridge/protocol', import.meta.url)),
        // 短别名：业务代码 import { Code, ServerMessageXxx } from '@holdem-pb'
        // 实际指向 @silenthill/agreement-web 的 proxy 层（运行时从 window.HoldemPB 取）。
        // 真正的 UMD bundle 由 holdemPbInjectPlugin 注入 <script>。
        '@holdem-pb': '@silenthill/agreement-web',
      },
    },
    server: {
      allowedHosts: [
        'h5.com',
        '.h5.com',
      ],
      port: 80,
      proxy: {
        '/api/imoss': {
          target: proxyImTarget,
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      // 默认不输出 source map，避免 dist 体积膨胀；需要排查线上问题时再通过环境变量开启。
      sourcemap: enableSourceMap,
      // 仅在生产构建且配置了 VITE_DROP_CONSOLE 时切换到 terser，执行 drop_console。
      // 其他场景保持 Vite 默认压缩器，避免额外依赖要求。
      minify: isBuild && enableDropConsole ? 'terser' : undefined,
      terserOptions: {
        compress: {
          keep_infinity: true,
          drop_console: isBuild && enableDropConsole,
        },
      },
      // 保持 css 拆分，避免所有样式打进一个大文件。
      cssCodeSplit: true,
      // 关掉 CSS minify：@vitejs/plugin-legacy 会把 cssTarget 压到 chrome61 之类
      // 的老目标，esbuild 据此把 backdrop-filter、inset、::before 等现代 CSS
      // 直接降级/删掉（Chromium 不认 -webkit-backdrop-filter，毛玻璃失效）。
      // 试过 config / configResolved 强行覆盖 cssTarget 都没拦住 legacy，
      // 直接关掉 CSS minify 是最稳的兜底——体积影响很小。
      cssMinify: false,
      rollupOptions: {
        output: {
          // 三方依赖采用稳定分组，避免按包名切分造成过多小文件请求。
          manualChunks: (id) => {
            const normalizedId = id.replace(/\\/g, '/')

            // @silenthill/agreement-web 的 proxy.js（~28 KB）单独 chunk；
            // 真正的 pb runtime (holdem-pb.js, ~3.7 MB) 由 holdemPbInjectPlugin
            // 以独立 <script> 加载到 window.HoldemPB，不进 Vite bundle。
            if (normalizedId.includes('/@silenthill/agreement-web/')) {
              return 'pb-holdem-proxy'
            }

            if (!normalizedId.includes('/node_modules/')) {
              return
            }

            if (
              normalizedId.includes('/vue/') ||
              normalizedId.includes('/@vue/') ||
              normalizedId.includes('/vue-router/') ||
              normalizedId.includes('/pinia/')
            ) {
              return 'vendor-vue-core'
            }

            if (normalizedId.includes('/vant/') || normalizedId.includes('/@vant/')) {
              return 'vendor-vant'
            }

            if (
              normalizedId.includes('/axios/') ||
              normalizedId.includes('/dayjs/') ||
              normalizedId.includes('/js-md5/') ||
              normalizedId.includes('/@vueuse/')
            ) {
              return 'vendor-utils'
            }

            // 这些依赖只在少数业务页面使用，必须保持独立分包；否则 catch-all
            // vendor 会让首页也预加载海报导出、二维码和 Iconify runtime。
            if (normalizedId.includes('/html2canvas/')) {
              return 'vendor-html2canvas'
            }

            if (normalizedId.includes('/qrcode/') || normalizedId.includes('/dijkstrajs/')) {
              return 'vendor-qrcode'
            }

            if (normalizedId.includes('/@iconify/')) {
              return 'vendor-iconify'
            }

            return 'vendor-misc'
          },
          // JS 入口文件统一输出到 assets/js。
          entryFileNames: 'assets/js/[name]-[hash].js',
          // JS 动态分包统一输出到 assets/js。
          chunkFileNames: 'assets/js/[name]-[hash].js',
          // 静态资源按类型分类到不同目录，方便定位与排查。
          assetFileNames: (assetInfo) => {
            const fileName = assetInfo.names?.[0] ?? assetInfo.originalFileNames?.[0] ?? ''
            const ext = extname(fileName).toLowerCase()

            if (ext === '.css') {
              return 'assets/css/[name]-[hash][extname]'
            }

            if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.ico'].includes(ext)) {
              return 'assets/images/[name]-[hash][extname]'
            }

            if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) {
              return 'assets/fonts/[name]-[hash][extname]'
            }

            if (['.mp4', '.webm', '.ogg', '.mp3', '.wav', '.flac', '.aac'].includes(ext)) {
              return 'assets/media/[name]-[hash][extname]'
            }

            return 'assets/misc/[name]-[hash][extname]'
          },
        },
      },
    },
  }
})
