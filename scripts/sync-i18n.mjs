import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const localSourcePath = path.resolve(
  projectRoot,
  '..',
  'h5-cc-i18n',
  'dist',
  'h5-cc-i18n.min.js',
)
const packageSourcePath = path.resolve(
  projectRoot,
  'node_modules/@silenthill/h5-cc-i18n/dist/h5-cc-i18n.min.js',
)
const targetPath = path.resolve(projectRoot, 'public/h5-cc-i18n.min.js')
const sourcePath = fs.existsSync(localSourcePath) ? localSourcePath : packageSourcePath

if (!fs.existsSync(sourcePath)) {
  console.error(`[sync:i18n] missing i18n runtime: ${sourcePath}`)
  console.error('[sync:i18n] run "pnpm install" or build the sibling h5-cc-i18n package first.')
  process.exit(1)
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true })
fs.copyFileSync(sourcePath, targetPath)
const { size } = fs.statSync(targetPath)
console.log(`[sync:i18n] copied h5-cc-i18n.min.js (${size} bytes) from ${sourcePath} -> ${targetPath}`)
