/**
 * Logo intake: validate, downscale, and return a data URL.
 *
 * Two reasons the image is resized rather than stored as picked:
 *  - the invoice record (and its JSON export) live in localStorage, so a 900 KB
 *    camera photo would eat the quota after two or three invoices;
 *  - the PDF request carries the logo inline, so a small payload keeps the
 *    download endpoint fast.
 *
 * The original generator's rules are kept: png / jpg / jpeg / bmp, max 1 MB.
 */

export const LOGO_ACCEPT = 'image/png,image/jpg,image/jpeg,image/bmp'
export const LOGO_MAX_BYTES = 1024 * 1024
export const LOGO_MAX_EDGE = 600

const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/x-ms-bmp']

export function validateLogoFile(file) {
  if (!file) return 'Choose an image file'
  if (!ALLOWED.includes(file.type)) return 'Use a PNG, JPG or BMP image'
  if (file.size > LOGO_MAX_BYTES) {
    return `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 1 MB`
  }
  return null
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('That image could not be read'))
    img.src = dataUrl
  })
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('That image could not be read'))
    reader.readAsDataURL(file)
  })
}

/**
 * @returns {Promise<{dataUrl: string, width: number, height: number}>}
 */
export async function fileToLogo(file, { maxEdge = LOGO_MAX_EDGE } = {}) {
  const problem = validateLogoFile(file)
  if (problem) throw new Error(problem)

  const original = await readAsDataUrl(file)
  const img = await loadImage(original)

  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  // already small enough and already a web format: keep the bytes untouched
  if (scale === 1 && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
    return { dataUrl: original, width: img.width, height: img.height }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  // JPEG has no alpha: paint white first so transparent PNGs do not go black
  const keepAlpha = file.type === 'image/png'
  if (!keepAlpha) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(img, 0, 0, width, height)
  const dataUrl = keepAlpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.92)
  return { dataUrl, width, height }
}

/** Rough size of a data URL in bytes, for the UI hint. */
export function dataUrlBytes(dataUrl) {
  if (!dataUrl) return 0
  const base64 = String(dataUrl).split(',')[1] || ''
  return Math.round((base64.length * 3) / 4)
}
