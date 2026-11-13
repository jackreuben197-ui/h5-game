import sharp from 'sharp'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const inputPath = path.resolve(__dirname, '../src/assets/images/add_home_guide.jpg')
const outputPath = path.resolve(__dirname, '../src/assets/images/add_home_guide_en.jpg')

const svgOverlay = Buffer.from(`
<svg width="682" height="1024" viewBox="0 0 682 1024" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font-family: 'Arial Black', 'Segoe UI Black', Arial, sans-serif; font-size: 38px; font-weight: 900; fill: #000000; text-anchor: middle; letter-spacing: -0.5px; }
    .badge { font-family: 'Segoe UI', Arial, sans-serif; font-size: 24px; font-weight: 800; fill: #ffffff; text-anchor: middle; }
    .step-text { font-family: 'Segoe UI', Arial, sans-serif; font-size: 26px; font-weight: 700; fill: #000000; }
    .step3-text { font-family: 'Segoe UI', Arial, sans-serif; font-size: 21px; font-weight: 700; fill: #000000; }
    .inner-text { font-family: -apple-system, 'SF Pro Text', 'Segoe UI', Arial, sans-serif; fill: #000000; font-weight: 500; }
  </style>

  <!-- 1. Cover and replace Main Title -->
  <rect x="100" y="5" width="480" height="62" fill="#fefefe" />
  <text x="341" y="50" class="title">Add to Home Screen</text>

  <!-- 2. Cover and replace Badge Text -->
  <rect x="190" y="76" width="300" height="45" rx="22" fill="#e20109" />
  <text x="341" y="108" class="badge">Follow 4 steps below</text>

  <!-- 3. Cover and replace Step 1 Text -->
  <rect x="105" y="142" width="400" height="42" fill="#fefefe" />
  <text x="108" y="173" class="step-text">Tap「…」at the bottom right</text>

  <!-- 4. Cover and replace Step 2 Text -->
  <rect x="105" y="368" width="400" height="45" fill="#fefefe" />
  <text x="108" y="402" class="step-text">Tap「Share」</text>

  <!-- 5. Cover and replace Step 2 inner Share text -->
  <rect x="275" y="435" width="115" height="36" fill="#fdfdfd" />
  <text x="282" y="461" class="inner-text" font-size="22">Share</text>

  <!-- 6. Cover and replace Step 3 Text -->
  <rect x="105" y="586" width="560" height="48" fill="#fefefe" />
  <text x="106" y="622" class="step3-text">In「Share」, scroll and tap「Add to Home Screen」</text>

  <!-- 7. Cover and replace Step 3 inner Add to Home text -->
  <rect x="228" y="688" width="180" height="32" fill="#f8f8f8" />
  <text x="232" y="711" class="inner-text" font-size="18.5" font-weight="600">Add to Home Screen</text>

  <!-- 8. Cover and replace Step 4 Text -->
  <rect x="105" y="788" width="400" height="45" fill="#fefefe" />
  <text x="108" y="824" class="step-text">Tap「Add」in the top right</text>

  <!-- 9. Cover and replace Step 4 inner center title -->
  <rect x="248" y="850" width="205" height="36" fill="#f0f1f5" />
  <text x="350" y="877" class="inner-text" font-size="18" font-weight="600" text-anchor="middle">Add to Home Screen</text>

  <!-- 10. Cover and replace Step 4 inner blue button Add text -->
  <rect x="495" y="860" width="65" height="28" rx="14" fill="#1f6dd1" />
  <text x="528" y="881" class="inner-text" font-size="17" font-weight="700" fill="#ffffff" text-anchor="middle">Add</text>
</svg>
`)

async function run() {
  await sharp(inputPath)
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(outputPath)
  console.log('Successfully generated add_home_guide_en.jpg')
}

run().catch(console.error)
