import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// H5_CC_I18N_DIR даёт локальной сборке словаря приоритет над версией из
// node_modules — иначе pnpm dev откатывает public/ на коммит из lockfile.
const localDir = process.env.H5_CC_I18N_DIR
const envLocalPath = localDir
  ? path.resolve(projectRoot, localDir, 'dist/h5-cc-i18n.min.js')
  : null

const packagePath = path.resolve(
  projectRoot,
  'node_modules/@silenthill/h5-cc-i18n/dist/h5-cc-i18n.min.js',
)

const sourcePath = envLocalPath && fs.existsSync(envLocalPath) ? envLocalPath : packagePath
const targetPath = path.resolve(projectRoot, 'public/h5-cc-i18n.min.js')

// If the bundle is already committed in public/, use it as-is.
if (!fs.existsSync(sourcePath)) {
  if (fs.existsSync(targetPath)) {
    console.log(`[sync:i18n] using committed h5-cc-i18n.min.js from public/ (package not installed)`)
    process.exit(0)
  }
  console.error(`[sync:i18n] missing i18n runtime: ${sourcePath}`)
  console.error('[sync:i18n] run "pnpm install" or point H5_CC_I18N_DIR at a built h5-cc-i18n checkout.')
  process.exit(1)
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true })
fs.copyFileSync(sourcePath, targetPath)
const { size } = fs.statSync(targetPath)
console.log(`[sync:i18n] copied h5-cc-i18n.min.js (${size} bytes) from ${sourcePath} -> ${targetPath}`)
