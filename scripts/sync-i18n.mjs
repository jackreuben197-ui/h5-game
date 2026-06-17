import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const sourcePath = path.resolve(
  projectRoot,
  'node_modules/@silenthill/h5-cc-i18n/dist/h5-cc-i18n.min.js',
)
const targetPath = path.resolve(projectRoot, 'public/h5-cc-i18n.min.js')

// If the bundle is already committed in public/, use it as-is.
if (!fs.existsSync(sourcePath)) {
  if (fs.existsSync(targetPath)) {
    console.log(`[sync:i18n] using committed h5-cc-i18n.min.js from public/ (package not installed)`)
    process.exit(0)
  }
  console.error(`[sync:i18n] missing package runtime: ${sourcePath}`)
  console.error('[sync:i18n] run "pnpm install" first to fetch @silenthill/h5-cc-i18n.')
  process.exit(1)
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true })
fs.copyFileSync(sourcePath, targetPath)
const { size } = fs.statSync(targetPath)
console.log(`[sync:i18n] copied h5-cc-i18n.min.js (${size} bytes) -> ${targetPath}`)
