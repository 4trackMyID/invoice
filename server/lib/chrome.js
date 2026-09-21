/**
 * Chrome used as the PDF engine.
 *
 * The browser is the only renderer that lays out the sheet exactly as the editor
 * showed it, so the export is the same document, not a second drawing of it.
 *
 * Executable resolution, in order: an explicit `CHROME_PATH`, a locally installed
 * Chrome, puppeteer's own download cache, then `@sparticuz/chromium` for
 * serverless hosts (Vercel has no browser in the image; that package ships one).
 */
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import puppeteer from 'puppeteer-core'

const LOCAL_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

/** puppeteer's cache, as populated by `npx puppeteer browsers install chrome`. */
function cachedChrome() {
  const cache = join(homedir(), '.cache', 'puppeteer', 'chrome')
  if (!existsSync(cache)) return null
  const builds = readdirSync(cache).filter((d) => d.startsWith('mac_arm-')).sort().reverse()
  for (const build of builds) {
    const p = join(cache, build, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
    if (existsSync(p)) return p
  }
  return null
}

/**
 * The serverless browser, deliberately not described by its package's version
 * number: `@sparticuz/chromium` ships `chrome-headless-shell`, not full Chrome.
 *
 * Two things have to be right or the function dies on its first export:
 *  - `headless: 'shell'`. Puppeteer emits `--headless=new` for `true`, but the
 *    shell binary only runs in the old headless mode; 'shell' makes puppeteer
 *    emit plain `--headless`, which matches what the package's own flags expect.
 *  - no graphics stack. Printing a document never touches WebGL, and skipping it
 *    also skips inflating swiftshader at cold start — the largest avoidable cost.
 */
async function serverlessChrome() {
  let chromium
  try {
    ;({ default: chromium } = await import('@sparticuz/chromium'))
  } catch {
    // not installed: this host is expected to have a browser of its own
    return null
  }
  // printing never touches WebGL, so the graphics stack stays off
  chromium.setGraphicsMode = false
  // deliberately not caught. If the package is present but its binary cannot be
  // unpacked — the payload missing from the deployed function, say — that error
  // names the cause. Swallowing it would report "no Chrome found" instead, which
  // is precisely the wrong thing to debug at that point.
  return { executablePath: await chromium.executablePath(), args: chromium.args, headless: 'shell' }
}

async function resolveChrome() {
  const explicit = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  if (explicit && existsSync(explicit)) return { executablePath: explicit, args: [] }

  for (const candidate of LOCAL_CANDIDATES) {
    if (existsSync(candidate)) return { executablePath: candidate, args: [] }
  }

  const cached = cachedChrome()
  if (cached) return { executablePath: cached, args: [] }

  const serverless = await serverlessChrome()
  if (serverless) return serverless

  throw new Error(
    'No Chrome found for the PDF export. Install Chrome, or set CHROME_PATH to a browser binary.',
  )
}

let browserPromise = null

/** One browser per process: launching costs ~300ms, printing costs ~50ms. */
function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const { executablePath, args, headless } = await resolveChrome()
      // a Set, because the serverless package already ships several of these
      // (--no-sandbox, --font-render-hinting) and a switch passed twice is at
      // best noise in a command line nobody reads
      const flags = [...new Set([...args, '--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'])]
      const browser = await puppeteer.launch({
        executablePath,
        headless: headless ?? true,
        args: flags,
      })
      // a crashed or reaped browser must not poison every later export
      browser.on('disconnected', () => {
        browserPromise = null
      })
      return browser
    })().catch((error) => {
      browserPromise = null
      throw error
    })
  }
  return browserPromise
}

/**
 * A4 in CSS pixels: at 96dpi, 1mm = 96/25.4px.
 *
 * The sheet keeps its on-screen width (840px) and the whole document is scaled
 * onto the page, rather than the sheet being squeezed to fit the paper — a sheet
 * 6% narrower re-wraps every address and note, which is the drift this export
 * exists to avoid. The scale is computed per document, so an invoice still lands
 * on a single page, and the page margins keep the printed border sane.
 */
const MM_TO_PX = 96 / 25.4
const A4 = { width: 210 * MM_TO_PX, height: 297 * MM_TO_PX }
const PAGE_MARGIN_MM = 6
/** Below this the type would be too small to read: paginate instead. */
const MIN_SCALE = 0.6

/** Scale that fits the document on one page at a physical margin each side. */
async function fitToPage(page) {
  await page.emulateMediaType('print')
  const sheet = await page.evaluate(() => {
    const el = document.querySelector('.sheet')
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  })
  if (!sheet?.width || !sheet?.height) return 1

  const usableWidth = A4.width - 2 * MM_TO_PX * PAGE_MARGIN_MM
  const usableHeight = A4.height - 2 * MM_TO_PX * PAGE_MARGIN_MM
  // never upscale: a short invoice stays at its real size instead of being
  // stretched to fill the paper
  return Math.max(MIN_SCALE, Math.min(1, usableWidth / sheet.width, usableHeight / sheet.height))
}

/** Render a standalone HTML document to PDF bytes. */
export async function htmlToPdf(html) {
  const browser = await getBrowser()
  const page = await browser.newPage()
  try {
    await page.setContent(html, { waitUntil: 'load' })
    // wait for fonts BEFORE measuring: `page.pdf` waits for them itself, but only
    // after this measurement, and a sheet measured with fallback metrics would get
    // the wrong scale. The race keeps a pathological font set from hanging the export.
    await Promise.race([
      page.evaluate(() => document.fonts.ready.then(() => true)),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]).catch(() => {})

    const scale = await fitToPage(page)
    const margin = `${PAGE_MARGIN_MM}mm`
    return await page.pdf({
      format: 'A4',
      scale,
      printBackground: true,
      margin: { top: margin, right: margin, bottom: margin, left: margin },
    })
  } finally {
    await page.close().catch(() => {})
  }
}

/** Shut the shared browser down (test scripts, graceful process exit). */
export async function closeBrowser() {
  const pending = browserPromise
  browserPromise = null
  if (!pending) return
  const browser = await pending.catch(() => null)
  await browser?.close().catch(() => {})
}
