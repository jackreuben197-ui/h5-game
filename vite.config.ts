import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { extname } from 'node:path'
import { readFileSync } from 'node:fs'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

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

  return {
    base: './',
    define: {
      // 运行时可读取构建元信息（版本号、依赖、构建时间）。
      __APP_INFO__: JSON.stringify(appInfo),
    },
    plugins: [
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
