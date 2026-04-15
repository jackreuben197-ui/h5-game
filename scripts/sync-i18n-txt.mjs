import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const files = ['USER_ZH.txt', 'USER_TW.txt', 'USER_EN.txt', 'USER_PT.txt']
const defaultSourceDir = path.resolve(projectRoot, '../pokerqueen/assets/resources/config')
const sourceDir = process.env.COCOS_I18N_SOURCE_DIR
  ? path.resolve(process.cwd(), process.env.COCOS_I18N_SOURCE_DIR)
  : defaultSourceDir
const targetDir = path.resolve(projectRoot, 'public/assets/resources/config')

ensureDir(targetDir)

let copiedCount = 0
for (const file of files) {
  const sourcePath = path.join(sourceDir, file)
  const targetPath = path.join(targetDir, file)

  if (!fs.existsSync(sourcePath)) {
    if (fs.existsSync(targetPath)) {
      console.warn(`[sync:i18n] source not found, keep existing file: ${sourcePath}`)
      continue
    }

    console.error(`[sync:i18n] missing source file: ${sourcePath}`)
    console.error(
      '[sync:i18n] set COCOS_I18N_SOURCE_DIR to your Cocos config directory if project location differs.',
    )
    process.exit(1)
  }

  fs.copyFileSync(sourcePath, targetPath)
  copiedCount += 1
}

console.log(`[sync:i18n] completed: ${copiedCount}/${files.length} files -> ${targetDir}`)

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}
