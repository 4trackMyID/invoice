/**
 * Verify the logo's placement in the UI and in the PDF, by measurement.
 *
 *   node scripts/verify-logo.mjs      # needs `npm run dev`
 *
 * UI side: reads the logo image's own bounding box from the live DOM and checks
 * it against the company-name field (no overlap, real decoded pixels).
 * PDF side: locates the navy pixels of the test fixture and confirms they land
 * inside the page margins at the expected size.
 */
import { existsSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function findChrome() {
  const c = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (existsSync(c)) return c
  const cache = join(process.env.HOME, '.cache', 'puppeteer', 'chrome')
  for (const b of readdirSync(cache).filter((d) => d.startsWith('mac_arm-')).sort().reverse()) {
    const p = join(cache, b, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
    if (existsSync(p)) return p
  }
  return null
}

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures += 1
}

const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox'] })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1420, height: 1000 })
  await page.goto('http://localhost:5199/', { waitUntil: 'networkidle0' })
  await page.evaluate(() => window.localStorage.clear())
  await page.reload({ waitUntil: 'networkidle0' })
  await page.waitForSelector('.paper')

  await (await page.$('.paper input[type=file]')).uploadFile(join(ROOT, 'scripts', 'fixtures', 'logo-240x80.png'))
  await page.waitForFunction(() => Boolean(document.querySelector('.paper img[alt="Company logo"]')), { timeout: 8000 })

  const geo = await page.evaluate(() => {
    const box = (el) => {
      const b = el.getBoundingClientRect()
      return { left: Math.round(b.left), top: Math.round(b.top), right: Math.round(b.right), bottom: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height) }
    }
    const logo = document.querySelector('.paper img[alt="Company logo"]')
    const name = document.querySelector('.paper input[placeholder="Your Company"]')
    return {
      logo: box(logo),
      logoNatural: { w: logo.naturalWidth, h: logo.naturalHeight },
      name: box(name),
      decoded: logo.complete && logo.naturalWidth > 0,
      visible: getComputedStyle(logo).display !== 'none' && getComputedStyle(logo).visibility !== 'hidden',
    }
  })

  console.log('DOM geometry:', JSON.stringify(geo))
  check('logo image decodes to real pixels', geo.decoded && geo.logoNatural.w === 240 && geo.logoNatural.h === 80, `${geo.logoNatural.w}x${geo.logoNatural.h}`)
  check('logo is rendered (not hidden)', geo.visible)
  check('logo has a non-zero box', geo.logo.w > 20 && geo.logo.h > 10, `${geo.logo.w}x${geo.logo.h}`)
  check('logo does not overlap the company name', geo.logo.right <= geo.name.left, `logo.right=${geo.logo.right} name.left=${geo.name.left}`)
  check('logo respects the 3:1 aspect ratio of the fixture', Math.abs(geo.logo.w / geo.logo.h - 3) < 0.35, `${(geo.logo.w / geo.logo.h).toFixed(2)}`)
} finally {
  await browser.close()
}

// ---------------------------------------------------------------- PDF side
const pdf = join(ROOT, 'tmp', 'pdf', 'invoice-with-logo.pdf')
if (!existsSync(pdf)) {
  console.log('SKIP  PDF check: tmp/pdf/invoice-with-logo.pdf not found (run scripts/screenshot-logo.mjs)')
} else {
  // Find the navy pixels of the fixture on the rendered page. pdftoppm writes to
  // a file prefix (not reliably to stdout), so render next to the PDF first and
  // decode in Python, which can read the colour channels we need.
  const renderPrefix = join(ROOT, 'tmp', 'pdf', 'verify-logo')
  const script = `
import subprocess
from PIL import Image
subprocess.run(['pdftoppm','-png','-r','100','-f','1','-l','1',${JSON.stringify(pdf)},${JSON.stringify(renderPrefix)}], check=True)
im = Image.open(${JSON.stringify(renderPrefix)} + '-1.png').convert('RGB')
w,h = im.size
px = im.load()
xs, ys = [], []
for y in range(h):
    for x in range(w):
        r,g,b = px[x,y]
        if abs(r-32)<26 and abs(g-60)<26 and abs(b-120)<30:
            xs.append(x); ys.append(y)
print(f'{w} {h}')
if xs:
    print(f'{min(xs)} {max(xs)} {min(ys)} {max(ys)}')
else:
    print('0 0 0 0')
`
  const out = execFileSync('python3', ['-c', script], { encoding: 'utf8' }).trim().split('\n')
  const [pw, ph] = out[0].split(' ').map(Number)
  const [x0, x1, y0, y1] = out[1].split(' ').map(Number)
  const px2pt = 72 / 100
  if (x1 > 0) {
    const leftPt = x0 * px2pt
    const topPt = y0 * px2pt
    const wPt = (x1 - x0 + 1) * px2pt
    const hPt = (y1 - y0 + 1) * px2pt
    // The fixture paints its navy slab 6px inside a white border (see
    // scripts/make_logo_fixtures.py), so the navy bbox is expected to start
    // ~6px later and be ~12px smaller than the drawn image box. Account for it
    // instead of pretending the fixture is a solid rectangle.
    const INNER = 6 * px2pt
    console.log(`PDF logo bbox (navy ink): left=${leftPt.toFixed(1)}pt top=${topPt.toFixed(1)}pt ${wPt.toFixed(1)}x${hPt.toFixed(1)}pt  (page ${pw}x${ph}px)`)
    console.log(`  fixture has a 6px inner border, so the drawn box starts at ${(42).toFixed(1)}pt and ink at ~${(42 + INNER).toFixed(1)}pt`)
    check('PDF logo starts at the left page margin (42pt)', Math.abs(leftPt - (42 + INNER)) < 2.5, `${leftPt.toFixed(1)}pt`)
    check('PDF logo starts at the top page margin (42pt)', Math.abs(topPt - (42 + INNER)) < 2.5, `${topPt.toFixed(1)}pt`)
    // The drawn box is the sheet's logo box scaled by Chrome's page fit, so its
    // absolute size is not a fixed number (the sheet is laid out in px and scaled
    // onto A4). Assert the things that must hold regardless of that scale: it
    // stays inside the box, keeps the image's aspect ratio, and is not shrunk to
    // a speck. An earlier version asserted a literal 42pt and failed on a correct
    // render.
    const drawnW = wPt + 2 * INNER
    const drawnH = hPt + 2 * INNER
    check('PDF logo fits its max box (130x42pt)', drawnW <= 130.5 && drawnH <= 42.5, `${drawnW.toFixed(1)}x${drawnH.toFixed(1)}pt`)
    check('PDF logo is drawn at a usable size', drawnH >= 20 && drawnH <= 43, `${drawnH.toFixed(1)}pt tall`)
    check('PDF logo keeps the fixture aspect ratio', Math.abs((wPt + 2 * INNER) / (hPt + 2 * INNER) - 3) < 0.4, `${((wPt + 2 * INNER) / (hPt + 2 * INNER)).toFixed(2)}`)
    check('PDF logo is inside the content area', leftPt >= 40 && topPt >= 40 && leftPt + drawnW <= 596 - 40 && topPt + drawnH <= 842, 'within margins')
  } else {
    check('PDF contains the logo image', false, 'navy pixels not found')
  }
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
