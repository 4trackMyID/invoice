/**
 * End-to-end check with a real browser (headless Chrome for Testing).
 *
 *   node scripts/e2e.mjs            # expects `npm run dev` to be running
 *
 * Drives the UI the way a user does and asserts what a unit test cannot:
 *   1. the sheet renders with the classic template
 *   2. typing updates the derived totals and the amount-in-words row
 *   3. Save and Send writes a record and shows it in the sidebar (CREATE + READ)
 *   4. editing and saving again updates in place (UPDATE), keeping the number
 *   5. Duplicate issues a copy with the next number (CREATE again)
 *   6. Delete removes exactly one record (DELETE)
 *   7. records survive a reload (localStorage persistence)
 *   8. Download PDF returns a real PDF over /api
 */
import { mkdir, readFile, rm } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const APP_URL = process.env.APP_URL || 'http://localhost:5199/'
const DOWNLOAD_DIR = join(ROOT, 'tmp', 'downloads')

function readdirSafe(dir) {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

/**
 * Wait for a downloaded file to appear. The PDF now goes through Chrome, whose
 * first render of a session costs ~1s and far more under CPU contention, so a
 * fixed sleep here made this test flaky. Poll instead, with a generous ceiling.
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

/** Locate a usable Chrome build. */
function findChrome() {
  const candidates = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean)
  for (const c of candidates) if (existsSync(c)) return c
  const cache = join(process.env.HOME, '.cache', 'puppeteer', 'chrome')
  if (existsSync(cache)) {
    const builds = readdirSafe(cache)
      .filter((d) => d.startsWith('mac_arm-'))
      .sort()
    for (const build of builds.reverse()) {
      const p = join(cache, build, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
      if (existsSync(p)) return p
    }
  }
  return null
}

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures += 1
}

const chromePath = findChrome()
if (!chromePath) {
  console.error('No Chrome build found. Set CHROME_PATH and re-run.')
  process.exit(2)
}
console.log('chrome:', chromePath)

await rm(DOWNLOAD_DIR, { recursive: true, force: true })
await mkdir(DOWNLOAD_DIR, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

/** Set a controlled React input's value the way typing would. */
async function setValue(page, selector, value) {
  const handle = await page.$(selector)
  if (!handle) throw new Error(`selector not found: ${selector}`)
  await handle.evaluate((el, v) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
    setter.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}

const listRecords = (page) =>
  page.evaluate(() => {
    const raw = JSON.parse(window.localStorage.getItem('invoice-generator:invoices:v1') || '{"records":[]}')
    return raw.records.map((r) => ({
      id: r.id,
      number: r.payload.invoice_number,
      customer: r.payload.customer_name,
      status: r.status,
    }))
  })

/** `expression` is a JS expression over (label, cls); a leading `return` is tolerated. */
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

/** Click inside the open modal/confirm dialog only, never a card button behind it. */
const clickDialogButton = (page, label) =>
  page.evaluate((l) => {
    const overlay = document.querySelector('.fixed.inset-0')
    if (!overlay) return false
    const btn = [...overlay.querySelectorAll('button')].find((b) => b.textContent.trim() === l)
    if (!btn) return false
    btn.click()
    return true
  }, label)

const SHEET = '.paper'

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1360, height: 1100 })
  page.on('pageerror', (e) => check(`no page error (${e.message})`, false))
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('   console.error:', m.text().slice(0, 160))
  })
  // surface the server's own message when a request fails, instead of guessing
  page.on('response', async (res) => {
    if (res.url().includes('/api/invoice/download') && res.status() >= 400) {
      const body = await res.text().catch(() => '')
      console.log(`   download ${res.status()}:`, body.slice(0, 200))
    }
  })

  const client = await page.createCDPSession()
  await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOAD_DIR })

  await page.goto(APP_URL, { waitUntil: 'networkidle0' })
  await page.waitForSelector(SHEET)

  // ---------------------------------------------------------------- 1. renders
  const tpl = await page.$eval('.tpl-classic', (el) => el.className)
  check('classic template renders', tpl.includes('tpl-classic'), tpl)
  const hasHeader = await page.$eval(`${SHEET}`, (el) =>
    [...el.querySelectorAll('input')].some((i) => (i.value || i.placeholder || '').trim().toLowerCase().startsWith('bill to')),
  )
  check('letterhead structure present', hasHeader, 'Bill To block')

  // ------------------------------------------------------ 2. totals derivation
  await setValue(page, `${SHEET} input[placeholder="Your Company"]`, 'Haputra Studio')
  await setValue(page, `${SHEET} input[placeholder="Client name / legal entity"]`, 'Andrew — Railz')
  await setValue(page, `${SHEET} input[placeholder="Project or engagement title"]`, 'Software Audit — Milestone 1')
  await setValue(page, `${SHEET} textarea[placeholder="Description of the item or service"]`, 'Software audit engagement (30% down payment)')

  const itemInputs = await page.$$(`${SHEET} tbody tr:nth-child(1) input.num-input`)
  check('item row exposes qty/rate/tax', itemInputs.length === 3, `${itemInputs.length} inputs`)
  const numSelectors = await page.$$eval(`${SHEET} tbody tr:nth-child(1) input.num-input`, (els) =>
    els.map((el) => el.getAttribute('inputmode') || el.getAttribute('placeholder') || 'unknown'),
  )
  console.log('   num inputs:', numSelectors.join(' | '))
  await itemInputs[1].evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(el, '7500')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await itemInputs[2].evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(el, '11')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })

  await new Promise((r) => setTimeout(r, 400))
  const totalsText = await page.$eval(SHEET, (el) => el.innerText)
  check('subtotal = qty x rate', totalsText.includes('7,500.00'), '7,500.00')
  check('tax row = percent of amount', totalsText.includes('825.00'), '825.00')
  check('total = subtotal + tax', totalsText.includes('8,325.00'), '8,325.00')
  check('amount in words derives from the total', /Eight thousand three hundred and twenty-five/i.test(totalsText), 'in-words')

  // every numeric column must right-align on the same edge (measured, not eyeballed)
  const alignments = await page.$$eval(`${SHEET} tbody tr:nth-child(1) input.num-input`, (els) =>
    els.map((el) => [getComputedStyle(el).textAlign, Math.round(el.getBoundingClientRect().right)]),
  )
  check(
    'numeric inputs all right-aligned',
    alignments.every(([a]) => a === 'right'),
    JSON.stringify(alignments),
  )
  // right-alignment is only observable with a two-digit value in the column
  await itemInputs[0].evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(el, '12')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await new Promise((r) => setTimeout(r, 300))
  const qtyAlign = await page.$eval(`${SHEET} tbody tr:nth-child(1) input.num-input`, (el) => ({
    align: getComputedStyle(el).textAlign,
    value: el.value,
    right: Math.round(el.getBoundingClientRect().right),
  }))
  check('two-digit quantity still right-aligned', qtyAlign.align === 'right' && qtyAlign.value === '12', JSON.stringify(qtyAlign))
  // restore a quantity of 1 so the expected totals below stay valid
  await itemInputs[0].evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(el, '1')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await new Promise((r) => setTimeout(r, 300))
  // the money column and the totals block must share one right edge
  const edges = await page.evaluate((sheetSel) => {
    const sheet = document.querySelector(sheetSel)
    const amountCell = sheet.querySelector('tbody tr:nth-child(1) td:last-child')
    const totalValue = [...sheet.querySelectorAll('span')].find((s) => /^[\$€£]?8,325\.00$/.test(s.textContent.trim()))
    const rect = (el) => (el ? Math.round(el.getBoundingClientRect().right) : null)
    return { amountCell: rect(amountCell), totalValue: rect(totalValue) }
  }, SHEET)
  check(
    'amount column and totals share the right edge',
    edges.amountCell !== null && edges.totalValue !== null && Math.abs(edges.amountCell - edges.totalValue) <= 18,
    JSON.stringify(edges),
  )

  // ------------------------------------------------------------- 3. CREATE
  await clickButton(page, 'return label === "Save and Send"')
  await page.waitForFunction(
    () => {
      const raw = JSON.parse(window.localStorage.getItem('invoice-generator:invoices:v1') || '{"records":[]}')
      return raw.records.length === 1
    },
    { timeout: 10_000 },
  )
  const year = new Date().getFullYear()
  let records = await listRecords(page)
  check('record created', records.length === 1, JSON.stringify(records))
  check('store issued the first number', records[0]?.number === `INV/${year}/001`, records[0]?.number)

  const companyValue = await page.$eval(`${SHEET} input[placeholder="Your Company"]`, (el) => el.value)
  check('letterhead keeps the company after saving', companyValue === 'Haputra Studio', `input value="${companyValue}"`)

  // ------------------------------------------------------------- 4. UPDATE
  await setValue(page, `${SHEET} input[placeholder="Client name / legal entity"]`, 'Railz Fleet Pty Ltd')
  await clickButton(page, 'return label === "Save and Send"')
  await new Promise((r) => setTimeout(r, 900))
  records = await listRecords(page)
  check('update keeps a single record', records.length === 1, `${records.length} record(s)`)
  check('update persists the new client', records[0]?.customer === 'Railz Fleet Pty Ltd', records[0]?.customer)
  check('update keeps the document number', records[0]?.number === `INV/${year}/001`, records[0]?.number)

  // ---------------------------------------------------------- 5. DUPLICATE
  const duplicated = await clickButton(page, 'return label === "Duplicate"')
  check('duplicate button present', duplicated)
  await new Promise((r) => setTimeout(r, 900))
  records = await listRecords(page)
  const numbers = records.map((r) => r.number).sort()
  check('duplicate created a second record', records.length === 2, `${records.length}`)
  check('duplicate issued the next number', numbers[1] === `INV/${year}/002`, JSON.stringify(numbers))

  // ----------------------------------------------- 7. persistence (2 records)
  await page.reload({ waitUntil: 'networkidle0' })
  await page.waitForSelector(`${SHEET} input[placeholder="Your Company"]`)
  const cardsAfterReload = await page.$$eval('aside .rounded-lg.border', (els) => els.length)
  check('records survive a reload', cardsAfterReload === 2, `${cardsAfterReload} card(s)`)
  const draftAfterReload = await page.evaluate(() => ({
    company: document.querySelector('.paper input[placeholder="Your Company"]').value,
    customer: document.querySelector('.paper input[placeholder="Client name / legal entity"]').value,
    number: document.querySelector('.paper input[placeholder="INV/2026/09/001"]').value,
    rate: document.querySelector('.paper tbody tr:nth-child(1) input.num-input:nth-of-type(1)')?.value,
  }))
  check('sheet draft survives a reload', draftAfterReload.company === 'Haputra Studio', JSON.stringify(draftAfterReload))
  check('client survives a reload', draftAfterReload.customer === 'Railz Fleet Pty Ltd', draftAfterReload.customer)
  // after Duplicate the sheet holds the copy, so the number is the copy's
  check('document number survives a reload', draftAfterReload.number === `INV/${year}/002`, draftAfterReload.number)

  // ------------------------------------------------------- 8. download PDF
  await clickButton(page, 'return label.startsWith("Download PDF")')
  const pdfFiles = await waitForDownload(DOWNLOAD_DIR, '.pdf')
  check('download produces a PDF file', pdfFiles.length >= 1, pdfFiles.join(', ') || 'no files')
  if (pdfFiles.length) {
    const buf = await readFile(join(DOWNLOAD_DIR, pdfFiles[0]))
    check('downloaded file is a real PDF', buf.subarray(0, 5).toString('latin1') === '%PDF-', `${buf.byteLength} bytes`)
  } else {
    const apiError = await page.evaluate(async () => {
      const res = await fetch('/api/invoice/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: 'x', customer_name: 'y', line_items: [{ name: 'z', quantity: 1, rate: 1 }] }),
      })
      return `${res.status} ${res.headers.get('content-type')}`
    })
    console.log('   direct API probe:', apiError)
  }

  // ------------------------------------------------------------- 6. DELETE
  const clicked = await clickButton(page, 'return label === "Delete"')
  check('delete button present', clicked)
  await new Promise((r) => setTimeout(r, 400))
  const confirmed = await clickDialogButton(page, 'Delete')
  check('confirm dialog accepted', confirmed)
  await new Promise((r) => setTimeout(r, 900))
  records = await listRecords(page)
  check('delete removed exactly one record', records.length === 1, `${records.length} left`)
} finally {
  await browser.close()
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
