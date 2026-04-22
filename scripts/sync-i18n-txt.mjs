import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const files = ['USER_ZH.txt', 'USER_TW.txt', 'USER_EN.txt', 'USER_PT.txt']
const targetDir = path.resolve(projectRoot, 'public/assets/resources/config')

ensureDir(targetDir)

let checkedCount = 0
for (const file of files) {
  const targetPath = path.join(targetDir, file)
  if (!fs.existsSync(targetPath)) {
    console.error(`[sync:i18n] missing h5 source file: ${targetPath}`)
    process.exit(1)
  }
  checkedCount += 1
}

console.log(`[sync:i18n] completed: ${checkedCount}/${files.length} files -> ${targetDir}`)

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}
