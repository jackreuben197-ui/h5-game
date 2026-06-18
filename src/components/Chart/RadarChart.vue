<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    top?: number
    right?: number
    bottom?: number
    left?: number
  }>(),
  { top: 0, right: 0, bottom: 0, left: 0 },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const wrapRef = ref<HTMLDivElement | null>(null)
let rafId = 0

function clampRate(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10))
}

function clearRaf(): void {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

function scheduleDraw(): void {
  clearRaf()
  rafId = requestAnimationFrame(draw)
}

function draw(): void {
  const canvas = canvasRef.value
  const wrap = wrapRef.value
  if (!canvas || !wrap) return

  const width = wrap.clientWidth
  const height = wrap.clientHeight
  if (!width || !height) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const centerX = width / 2
  const centerY = height / 2 + 6
  const radius = Math.min(width, height) * 0.26
  const levels = 5

  const pointAt = (
    axis: 'top' | 'right' | 'bottom' | 'left',
    value: number,
  ): [number, number] => {
    const scale = clampRate(value) / 100
    const len = radius * scale
    if (axis === 'top') return [centerX, centerY - len]
    if (axis === 'right') return [centerX + len, centerY]
    if (axis === 'bottom') return [centerX, centerY + len]
    return [centerX - len, centerY]
  }

  ctx.lineCap = 'round'
  for (let level = levels; level >= 1; level -= 1) {
    const ratio = level / levels
    const ring = [
      [centerX, centerY - radius * ratio],
      [centerX + radius * ratio, centerY],
      [centerX, centerY + radius * ratio],
      [centerX - radius * ratio, centerY],
    ]
    ctx.beginPath()
    ctx.moveTo(ring[0][0], ring[0][1])
    for (let i = 1; i < ring.length; i += 1) ctx.lineTo(ring[i][0], ring[i][1])
    ctx.closePath()
    ctx.strokeStyle =
      level === levels ? 'rgba(249, 249, 249, 0.92)' : 'rgba(249, 249, 249, 0.16)'
    ctx.lineWidth = level === levels ? 1.7 : 1
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.moveTo(centerX, centerY - radius)
  ctx.lineTo(centerX, centerY + radius)
  ctx.moveTo(centerX - radius, centerY)
  ctx.lineTo(centerX + radius, centerY)
  ctx.strokeStyle = 'rgba(249, 249, 249, 0.24)'
  ctx.lineWidth = 1
  ctx.stroke()

  const points: Array<[number, number]> = [
    pointAt('top', props.top),
    pointAt('right', props.right),
    pointAt('bottom', props.bottom),
    pointAt('left', props.left),
  ]

  const fill = ctx.createLinearGradient(
    centerX - radius,
    centerY - radius,
    centerX + radius,
    centerY + radius,
  )
  fill.addColorStop(0, 'rgba(249, 249, 249, 0.34)')
  fill.addColorStop(1, 'rgba(249, 249, 249, 0.14)')

  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1])
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.strokeStyle = 'rgba(249, 249, 249, 0.78)'
  ctx.lineWidth = 1.3
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = 'rgba(249, 249, 249, 0.84)'
  for (const [x, y] of points) {
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

watch(
  () => [props.top, props.right, props.bottom, props.left],
  () => void nextTick(scheduleDraw),
)

const onResize = () => scheduleDraw()

onMounted(() => {
  window.addEventListener('resize', onResize)
  void nextTick(scheduleDraw)
})

onBeforeUnmount(() => {
  clearRaf()
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div ref="wrapRef" class="radar-root">
    <canvas ref="canvasRef" class="radar-canvas"></canvas>
  </div>
</template>

<style scoped lang="scss">
.radar-root {
  width: 100%;
  height: 100%;
}

.radar-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
