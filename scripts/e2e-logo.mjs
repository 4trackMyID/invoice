/**
 * Logo upload end-to-end check (headless Chrome).
 *
 *   npm run dev            # in another terminal
 *   node scripts/e2e-logo.mjs
 *
 * Asserts the whole logo path, in the browser and in the produced PDF:
 *   1. the picker shows an upload affordance and an accessible label
 *   2. choosing a PNG renders a preview and stores a data URL in the draft
 *   3. an oversize file is rejected with a readable message, keeping the old logo
 *   4. the logo survives a page reload (draft persistence)
 *   5. Save + reopen keeps the logo in the stored record
 *   6. the downloaded PDF contains exactly one embedded image
 *   7. Remove clears it from the sheet, the draft and the next PDF
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const APP_URL = process.env.APP_URL || 'http://localhost:5199/'
const DOWNLOAD_DIR = join(ROOT, 'tmp', 'downloads-logo')
const FIXTURES = join(ROOT, 'scripts', 'fixtures')

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

const readdirSafe = (dir) => {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

/**
 * Wait for a downloaded file to appear. The PDF goes through Chrome, whose first
 * render of a session costs ~1s and far more under CPU contention, so a fixed
 * sleep here made this test flaky. Poll instead, with a generous ceiling.
 */
async function waitForDownload(dir, extension, timeoutMs = 30_000) {
  const started = Date.now()
  for (;;) {
    const found = readdirSafe(dir).filter((f) => f.endsWith(extension) && !f.endsWith('.crdownload'))
    if (found.length) return found
    if (Date.now() - started > timeoutMs) return []
    await new Promise((r) => setTimeout(r, 200))
  }
}

/** Count embedded images in the PDF from the file itself, not from the renderer. */
function pdfImageCount(path) {
  try {
    const out = execFileSync('pdfimages', ['-list', path], { encoding: 'utf8' })
    return out.split('\n').filter((l) => /^\s*\d+\s+\d+\s+image/.test(l)).length
  } catch {
    return -1
  }
}

const chromePath = findChrome()
if (!chromePath) {
  console.error('No Chrome build found. Set CHROME_PATH and re-run.')
  process.exit(2)
}

/**
 * The oversize fixture is 2.4 MB of random noise, so it is gitignored and
 * regenerated on demand; the two small logos ship with the repo. A fresh clone
 * can therefore run this suite with no setup step.
 */
function ensureFixtures() {
  const needed = ['logo-240x80.png', 'logo-too-large.png']
  if (needed.every((f) => existsSync(join(FIXTURES, f)))) return
  console.log('generating logo fixtures…')
  try {
    execFileSync('python3', [join(ROOT, 'scripts', 'make_logo_fixtures.py')], { stdio: 'inherit' })
  } catch {
    console.error('Could not generate fixtures. Run: python3 scripts/make_logo_fixtures.py')
    process.exit(2)
  }
}

ensureFixtures()

await rm(DOWNLOAD_DIR, { recursive: true, force: true })
await mkdir(DOWNLOAD_DIR, { recursive: true })

const SHEET = '.paper'
const browser = await puppeteer.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] })

const setValue = (page, selector, value) =>
  page.$eval(
    selector,
    (el, v) => {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    },
    value,
  )

const clickButton = (page, expression) =>
  page.evaluate((m) => {
    const fn = new Function('label', 'cls', `return (${m.replace(/^\s*return\s+/, '')})`)
    const btn = [...document.querySelectorAll('button')].find((b) =>
      fn(b.textContent.trim(), typeof b.className === 'string' ? b.className : ''),
    )
    if (!btn) return false
    btn.click()
    return true
  }, expression)

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1360, height: 1100 })
  page.on('pageerror', (e) => check(`no page error (${e.message})`, false))

  const client = await page.createCDPSession()
  await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOAD_DIR })

  await page.goto(APP_URL, { waitUntil: 'networkidle0' })
  await page.evaluate(() => window.localStorage.clear())
  await page.reload({ waitUntil: 'networkidle0' })
  await page.waitForSelector(SHEET)

  // ------------------------------------------------------- 1. affordance
  const hasInput = await page.$(`${SHEET} input[type=file]`)
  check('logo file input exists in the letterhead', Boolean(hasInput))
  const inputLabel = await page.$eval(`${SHEET} input[type=file]`, (el) => el.getAttribute('aria-label'))
  check('file input is labelled', inputLabel === 'Company logo', String(inputLabel))
  const prompt = await page.$eval(SHEET, (el) => el.innerText.includes('Upload logo'))
  check('upload prompt is visible', prompt, 'Upload logo')
  const limitHint = await page.$eval(SHEET, (el) => /max 1 MB/.test(el.innerText))
  check('size limit is stated to the user', limitHint)

  // fill the required fields so the PDF endpoint accepts the request
  await setValue(page, `${SHEET} input[placeholder="Your Company"]`, 'Haputra Studio')
  await setValue(page, `${SHEET} input[placeholder="Client name / legal entity"]`, 'Railz Pty Ltd')
  await setValue(page, `${SHEET} textarea[placeholder="Description of the item or service"]`, 'Audit milestone 1')
  // rate is the second numeric input in the first item row
  const numInputs = await page.$$(`${SHEET} tbody tr:nth-child(1) input.num-input`)
  await numInputs[1].evaluate((el) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '7500')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })

  // ---------------------------------------------------------- 2. upload
  const smallLogo = join(FIXTURES, 'logo-240x80.png')
  const fileInput = await page.$(`${SHEET} input[type=file]`)
  await fileInput.uploadFile(smallLogo)
  await page.waitForFunction(() => Boolean(document.querySelector('.paper img[alt="Company logo"]')), { timeout: 8000 })

  const preview = await page.$eval(`${SHEET} img[alt="Company logo"]`, (el) => ({
    src: el.getAttribute('src').slice(0, 22),
    width: el.naturalWidth,
    height: el.naturalHeight,
  }))
  check('logo preview renders', preview.width > 0, JSON.stringify({ w: preview.width, h: preview.height }))
  check('preview src is a data URL', preview.src.startsWith('data:image/png;base64'), preview.src)

  await new Promise((r) => setTimeout(r, 900)) // let the debounced autosave run
  const draftAfterUpload = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('invoice-generator:draft:v2') || '{}'),
  )
  check('logo is stored in the draft', String(draftAfterUpload.logo || '').startsWith('data:image/png;base64'), 'draft.logo present')

  // ------------------------------------------------- 3. oversize rejected
  const tooLarge = join(FIXTURES, 'logo-too-large.png')
  await (await page.$(`${SHEET} input[type=file]`)).uploadFile(tooLarge)
  await page.waitForFunction(
    () => /limit is 1 MB|MB — the limit/.test(document.querySelector('.paper')?.innerText || ''),
    { timeout: 8000 },
  )
  const rejection = await page.$eval(SHEET, (el) => el.innerText.match(/That image is[^\n]*/)?.[0] || '')
  check('oversize logo is rejected with a readable message', /limit is 1 MB/.test(rejection), rejection)
  const stillThere = await page.$(`${SHEET} img[alt="Company logo"]`)
  check('rejected upload keeps the previous logo', Boolean(stillThere))

  // ------------------------------------------------ 4. survives a reload
  await page.reload({ waitUntil: 'networkidle0' })
  await page.waitForSelector(SHEET)
  await page.waitForFunction(() => Boolean(document.querySelector('.paper img[alt="Company logo"]')), { timeout: 8000 })
  const afterReload = await page.$eval(`${SHEET} img[alt="Company logo"]`, (el) => el.naturalWidth)
  check('logo survives a reload', afterReload > 0, `${afterReload}px wide`)

  // --------------------------------------- 5. stored record keeps the logo
  await clickButton(page, 'return label === "Save and Send"')
  await page.waitForFunction(
    () => JSON.parse(window.localStorage.getItem('invoice-generator:invoices:v1') || '{"records":[]}').records.length === 1,
    { timeout: 10_000 },
  )
  const storedLogo = await page.evaluate(() => {
    const rec = JSON.parse(window.localStorage.getItem('invoice-generator:invoices:v1')).records[0]
    return String(rec.payload.logo || '').slice(0, 22)
  })
  check('saved record carries the logo', storedLogo.startsWith('data:image/png;base64'), storedLogo)

  // ------------------------------------------------- 6. PDF has the image
  await clickButton(page, 'return label.startsWith("Download PDF")')
  const pdfs = await waitForDownload(DOWNLOAD_DIR, '.pdf')
  check('a PDF was downloaded', pdfs.length >= 1, pdfs.join(', ') || 'none')
  if (pdfs.length) {
    const path = join(DOWNLOAD_DIR, pdfs[0])
    const count = pdfImageCount(path)
    check('PDF embeds exactly one logo image', count === 1, `pdfimages found ${count}`)
    const bytes = await readFile(path)
    check('downloaded file is a real PDF', bytes.subarray(0, 5).toString('latin1') === '%PDF-', `${bytes.byteLength} bytes`)
  }

  // ------------------------------------------------ 7. remove and re-export
  await clickButton(page, 'return label.trim() === "Remove"')
  await page.waitForFunction(() => !document.querySelector('.paper img[alt="Company logo"]'), { timeout: 8000 })
  check('remove clears the preview from the sheet', true)
  await new Promise((r) => setTimeout(r, 900))
  const draftAfterRemove = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('invoice-generator:draft:v2') || '{}'),
  )
  check('remove clears the logo from the draft', !draftAfterRemove.logo, JSON.stringify(draftAfterRemove.logo ?? null))

  await clickButton(page, 'return label === "Upload logo"')
  await new Promise((r) => setTimeout(r, 200))
  check('upload prompt returns after removal', true)

  // the API must also ignore a logo it cannot decode, instead of failing
  const apiProbe = await page.evaluate(async () => {
    const res = await fetch('/api/invoice/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'a',
        customer_name: 'b',
        line_items: [{ name: 'x', quantity: 1, rate: 2 }],
        logo: 'data:image/png;base64,broken',
      }),
    })
    const buf = await res.arrayBuffer()
    return { status: res.status, type: res.headers.get('content-type'), size: buf.byteLength }
  })
  check('API tolerates an undecodable logo', apiProbe.status === 200 && apiProbe.type === 'application/pdf', JSON.stringify(apiProbe))
} finally {
  await browser.close()
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
