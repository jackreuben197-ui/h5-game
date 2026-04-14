import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'https://test2.awanptest.com'
  const enableSourceMap = env.VITE_BUILD_SOURCEMAP === 'true'

  return {
    base: './',
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
    },
  }
})
