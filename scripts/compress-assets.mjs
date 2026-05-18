import { promises as fs } from 'node:fs'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import sharp from 'sharp'
import { optimize } from 'svgo'

const ROOT = process.cwd()
const TARGET_DIRS = ['src/assets/icons', 'src/assets/images']
const MIN_SIZE = 20 * 1024

const MAX_SIZE_BY_EXT = {
  svg: 20 * 1024,
  png: 100 * 1024,
  jpg: 200 * 1024,
  jpeg: 200 * 1024,
  webp: 150 * 1024,
  avif: 150 * 1024,
}

const SUPPORTED_EXTS = new Set(Object.keys(MAX_SIZE_BY_EXT))

const QUALITY_STEPS = {
  png: [85, 75, 65, 55, 45, 35, 25, 15],
  jpg: [84, 78, 72, 66, 60, 54, 48],
  jpeg: [84, 78, 72, 66, 60, 54, 48],
  webp: [84, 78, 72, 66, 60, 54, 48],
  avif: [50, 45, 40, 35, 30, 25],
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
    } else {
      files.push(fullPath)
    }
  }
  return files
}

function getExt(filePath) {
  return path.extname(filePath).slice(1).toLowerCase()
}

async function compressSvg(filePath, sourceBuffer) {
  let source = sourceBuffer.toString('utf8')

  const dataUriPattern = /data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)/g
  const matches = [...source.matchAll(dataUriPattern)]

  for (const match of matches) {
    const mime = match[1].toLowerCase()
    const base64 = match[2]
    const originalDataUri = match[0]

    try {
      const raw = Buffer.from(base64, 'base64')
      let compressed = raw

      // For embedded raster payloads inside SVG, WebP data URI usually provides
      // the best tradeoff between size and visual quality.
      const qualities = mime === 'png' ? [78, 68, 58, 48, 40] : [74, 64, 54, 46]
      for (const quality of qualities) {
        const encoded = await sharp(raw, { animated: false, limitInputPixels: false })
          .webp({ quality, effort: 6, alphaQuality: 90 })
          .toBuffer()

        if (encoded.length < compressed.length) {
          compressed = encoded
        }

        if (encoded.length <= raw.length * 0.65) {
          compressed = encoded
          break
        }
      }

      if (compressed.length < raw.length) {
        const replaced = `data:image/webp;base64,${compressed.toString('base64')}`
        source = source.replace(originalDataUri, replaced)
      }
    } catch {
      // Keep original data URI when decode/re-encode fails.
    }
  }

  const result = optimize(source, {
    path: filePath,
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
          },
        },
      },
      'removeDimensions',
    ],
  })

  if (!result.data) {
    return null
  }

  return Buffer.from(result.data)
}

function buildSharpPipeline(filePath) {
  return sharp(filePath, {
    animated: false,
    limitInputPixels: false,
  }).rotate()
}

async function encodeBuffer(filePath, ext, quality) {
  let pipeline = buildSharpPipeline(filePath)

  if (ext === 'png') {
    pipeline = pipeline.png({
      quality,
      palette: true,
      compressionLevel: 9,
      effort: 10,
      adaptiveFiltering: true,
    })
  } else if (ext === 'jpg' || ext === 'jpeg') {
    pipeline = pipeline.jpeg({
      quality,
      mozjpeg: true,
      progressive: true,
    })
  } else if (ext === 'webp') {
    pipeline = pipeline.webp({
      quality,
      alphaQuality: 90,
      effort: 6,
    })
  } else if (ext === 'avif') {
    pipeline = pipeline.avif({
      quality,
      effort: 8,
    })
  } else {
    return null
  }

  return pipeline.toBuffer()
}

async function compressRaster(filePath, ext, sourceBuffer, maxSize) {
  const qualities = QUALITY_STEPS[ext] || []
  if (qualities.length === 0) {
    return null
  }

  let best = sourceBuffer

  for (const quality of qualities) {
    const encoded = await encodeBuffer(filePath, ext, quality)
    if (!encoded) continue

    if (encoded.length < best.length) {
      best = encoded
    }

    if (encoded.length <= maxSize) {
      best = encoded
      break
    }
  }

  return best.length < sourceBuffer.length ? best : null
}

function formatRatio(before, after) {
  if (before === 0) return '0.00%'
  const ratio = ((before - after) / before) * 100
  return `${ratio.toFixed(2)}%`
}

async function main() {
  const candidates = []

  for (const targetDir of TARGET_DIRS) {
    const absDir = path.join(ROOT, targetDir)
    const files = await walk(absDir)
    for (const filePath of files) {
      const ext = getExt(filePath)
      if (!SUPPORTED_EXTS.has(ext)) continue

      const stat = await fs.stat(filePath)
      if (stat.size <= MIN_SIZE) continue

      candidates.push({
        filePath,
        ext,
        size: stat.size,
      })
    }
  }

  const report = {
    scanned: candidates.length,
    updated: [],
    skipped: [],
    failed: [],
  }

  for (const item of candidates) {
    const maxSize = MAX_SIZE_BY_EXT[item.ext] || MIN_SIZE

    try {
      const source = await fs.readFile(item.filePath)
      let compressed = null

      if (item.ext === 'svg') {
        compressed = await compressSvg(item.filePath, source)
      } else {
        compressed = await compressRaster(item.filePath, item.ext, source, maxSize)
      }

      if (!compressed || compressed.length >= source.length) {
        report.skipped.push({
          path: item.filePath,
          before: source.length,
          reason: 'no-smaller-result',
        })
        continue
      }

      await fs.writeFile(item.filePath, compressed)

      report.updated.push({
        path: item.filePath,
        before: source.length,
        after: compressed.length,
        ratio: formatRatio(source.length, compressed.length),
        overTarget: compressed.length > maxSize,
        target: maxSize,
      })
    } catch (error) {
      report.failed.push({
        path: item.filePath,
        error: String(error),
      })
    }
  }

  const overTarget = []

  for (const targetDir of TARGET_DIRS) {
    const absDir = path.join(ROOT, targetDir)
    const files = await walk(absDir)
    for (const filePath of files) {
      const ext = getExt(filePath)
      if (!SUPPORTED_EXTS.has(ext)) continue
      const maxSize = MAX_SIZE_BY_EXT[ext]
      const stat = await fs.stat(filePath)
      if (stat.size > maxSize) {
        overTarget.push({
          path: filePath,
          size: stat.size,
          maxSize,
        })
      }
    }
  }

  const output = {
    summary: {
      scanned: report.scanned,
      updated: report.updated.length,
      skipped: report.skipped.length,
      failed: report.failed.length,
      overTarget: overTarget.length,
    },
    updated: report.updated,
    failed: report.failed,
    overTarget,
  }

  const reportPath = path.join(ROOT, 'output_assets_compress.log')
  await fs.writeFile(reportPath, JSON.stringify(output, null, 2), 'utf8')

  console.log(JSON.stringify(output.summary, null, 2))
  console.log(`report: ${reportPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
