import { defineConfig, loadEnv, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { extname, join } from 'node:path'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

// 将 pb 目录下 protoc-gen-js 生成的 CommonJS 文件在 Vite ESM 环境中正确运行。
// 策略：保留原始 .js 不修改（与 Cocos/Unity 同源），在 transform 阶段注入 ESM 兼容头。
function pbCjsToEsmPlugin(): Plugin {
  return {
    name: 'pb-cjs-to-esm',
    transform(code: string, id: string) {
      if (!id.includes('/bridge/ws/pb/') || !id.endsWith('.js')) return null

      const isDefine = id.endsWith('/define_pb.js')

      // 从 goog.exportSymbol 调用中提取顶层导出符号名（Def.Action 这类嵌套只取 Def）
      const symbols = [
        ...new Set(
          [...code.matchAll(/goog\.exportSymbol\('proto\.holdem\.pb\.(\w+)'/g)].map((m) => m[1]),
        ),
      ]

      // ESM 前置：用 import 替代 require，保留 goog/global 变量名不变
      const preamble = [
        `import jspb from 'google-protobuf';`,
        `var goog = jspb;`,
        `var global = Function('return this')();`,
        ...(isDefine ? [] : [`import * as protobuf_holdem_define_pb from './define_pb.js';`]),
        '',
      ].join('\n')

      // 剥离 CJS 头部（require 语句已被 preamble 中的 import 取代）
      let body = code
        .replace(/^var jspb = require\('google-protobuf'\);\r?\n/m, '')
        .replace(/^var goog = jspb;\r?\n/m, '')
        .replace(/^var global = Function\('return this'\)\(\);\r?\n/m, '')
        .replace(/^goog\.object\.extend\(exports, proto\.holdem\.pb\);\r?\n?/m, '')

      if (!isDefine) {
        body = body.replace(
          /^var protobuf_holdem_define_pb = require\('\.\.\/\.\.\/protobuf\/holdem\/define_pb\.js'\);\r?\n/m,
          '',
        )
      }

      // 模块代码执行完毕后，从 global.proto.holdem.pb 上捕获类并导出为具名 ESM export
      const footer = [
        '',
        ...symbols.map((sym) => `var _e_${sym} = proto.holdem.pb.${sym};`),
        `export { ${symbols.map((sym) => `_e_${sym} as ${sym}`).join(', ')} };`,
      ].join('\n')

      return { code: preamble + body + footer, map: null }
    },
  }
}

// 监听 public/assets/resources/config 下的 txt 文件变化，触发整页刷新。
function i18nHotReloadPlugin(): Plugin {
  return {
    name: 'i18n-hot-reload',
    configureServer(server) {
      server.watcher.add('public/assets/resources/config/*.txt')
      server.watcher.on('change', (file) => {
        if (file.includes('resources/config') && file.endsWith('.txt')) {
          server.ws.send({ type: 'full-reload' })
        }
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

// 计算 i18n txt 文件的内容 hash（8 位），供运行时拼接 ?v= 做缓存破除。
function computeI18nVersions(): Record<string, string> {
  const files = ['USER_ZH.txt', 'USER_TW.txt', 'USER_EN.txt', 'USER_PT.txt']
  const dir = fileURLToPath(new URL('./public/assets/resources/config', import.meta.url))
  const versions: Record<string, string> = {}
  for (const file of files) {
    try {
      const content = readFileSync(join(dir, file))
      versions[file] = createHash('md5').update(content).digest('hex').slice(0, 8)
    } catch {
      versions[file] = '0'
    }
  }
  return versions
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
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'https://test2.awanptest.com'
  const enableSourceMap = env.VITE_BUILD_SOURCEMAP === 'true'
  const enableDropConsole = toBoolean(env.VITE_DROP_CONSOLE)
  const isBuild = command === 'build'
  const appPkgInfo = readAppPkgInfo()
  const appInfo = {
    pkg: appPkgInfo,
    lastBuildTime: new Date().toISOString(),
  }
  const i18nVersions = computeI18nVersions()

  return {
    base: './',
    define: {
      // 运行时可读取构建元信息（版本号、依赖、构建时间）。
      __APP_INFO__: JSON.stringify(appInfo),
      // i18n txt 文件的内容 hash，运行时拼接 ?v= 做缓存破除。
      __I18N_VERSIONS__: JSON.stringify(i18nVersions),
    },
    plugins: [
      pbCjsToEsmPlugin(),
      vue(),
      i18nHotReloadPlugin(),
      Components({
        dts: true,
        resolvers: [VantResolver()],
      }),
      legacy({
        // Keep compatibility for older Android/iOS WebView environments.
        targets: ['defaults', 'Android >= 7', 'iOS >= 12'],
        modernPolyfills: true,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
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
      rollupOptions: {
        output: {
          // 三方依赖采用稳定分组，避免按包名切分造成过多小文件请求。
          manualChunks: (id) => {
            const normalizedId = id.replace(/\\/g, '/')

            // pb 生成文件单独成 chunk：体积大（define_pb ~1MB），且通过动态 import
            // 懒加载，不应进入主 bundle。
            if (normalizedId.includes('/bridge/ws/pb/')) {
              return 'pb-holdem'
            }

            if (!normalizedId.includes('/node_modules/')) {
              return
            }

            if (
              normalizedId.includes('/vue/') ||
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
