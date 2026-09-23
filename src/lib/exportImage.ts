import { downloadBlob } from '../simulation/exportCsv'

/**
 * Rasterises an inline <svg> element to a PNG download. Only inline
 * attributes/styles survive serialisation, so the exported figures avoid
 * external CSS. `background` fills the canvas behind the figure.
 */
export async function downloadSvgAsPng(
  svg: SVGSVGElement,
  filename: string,
  { background = '#0a1214', scale = 2, caption }: { background?: string; scale?: number; caption?: string } = {}
) {
  const box = svg.getBoundingClientRect()
  const width = Math.max(Math.round(box.width), 10)
  const height = Math.max(Math.round(box.height), 10)
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  const xml = new XMLSerializer().serializeToString(clone)
  const img = new Image()
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Could not render the figure to an image.'))
      img.src = url
    })
    const captionH = caption ? 34 : 0
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = (height + captionH) * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available in this browser.')
    ctx.scale(scale, scale)
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height + captionH)
    ctx.drawImage(img, 0, 0, width, height)
    if (caption) {
      ctx.fillStyle = '#9fb3b0'
      ctx.font = '12px "IBM Plex Mono", monospace'
      ctx.fillText(caption, 14, height + 21)
    }
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'))
    if (!blob) throw new Error('Image export failed.')
    downloadBlob(filename, blob)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Saves a rendered WebGL frame (already copied to a 2D canvas) as a PNG with a caption strip. */
export async function downloadCanvasAsPng(
  frame: HTMLCanvasElement,
  filename: string,
  { background = '#0a1214', caption }: { background?: string; caption?: string } = {}
) {
  const scale = Math.min(window.devicePixelRatio || 1, 2)
  const captionH = caption ? Math.round(34 * Math.min(scale, 2)) : 0
  const canvas = document.createElement('canvas')
  canvas.width = frame.width
  canvas.height = frame.height + captionH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available in this browser.')
  const g = ctx.createLinearGradient(0, 0, 0, frame.height)
  g.addColorStop(0, '#0b1a1e')
  g.addColorStop(1, '#050c0e')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, frame.width, frame.height)
  ctx.drawImage(frame, 0, 0)
  if (caption) {
    const k = captionH / 34
    ctx.fillStyle = '#9fb3b0'
    ctx.font = `${Math.round(12 * k)}px "IBM Plex Mono", monospace`
    ctx.fillText(caption, 14 * k, frame.height + 21 * k)
  }
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'))
  if (!blob) throw new Error('Image export failed.')
  downloadBlob(filename, blob)
}
