/**
 * Capture a screenshot of the app for review, and export the server-rendered PDF
 * from the very same data.
 *
 *   node scripts/screenshot.mjs      # expects `npm run dev` to be running
 */
import { mkdir } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'tmp', 'shots')
const APP_URL = process.env.APP_URL || 'http://localhost:5199/'

function findChrome() {
  const c = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (existsSync(c)) return c
  const cache = join(process.env.HOME, '.cache', 'puppeteer', 'chrome')
  const builds = readdirSync(cache)
    .filter((d) => d.startsWith('mac_arm-'))
    .sort()
    .reverse()
  for (const b of builds) {
    const p = join(cache, b, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
    if (existsSync(p)) return p
  }
  return null
}

await mkdir(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1420, height: 1200, deviceScaleFactor: 2 })

// start from a clean slate so the shot is deterministic
await page.goto(APP_URL, { waitUntil: 'networkidle0' })
await page.evaluate(() => window.localStorage.clear())
await page.reload({ waitUntil: 'networkidle0' })
await page.waitForSelector('.paper')

// fill a realistic invoice through the UI
await page.evaluate(() => {
  const set = (el, v) => {
    if (!el) return
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const q = (sel) => document.querySelector(sel)
  set(q('.paper input[placeholder="Your Company"]'), 'Haputra')
  set(q('.paper input[placeholder="Tagline or business description"]'), 'Branding & Website Design for SaaS, AI & B2B Growth')
  set(q('.paper input[placeholder="Street address, City, Country"]'), 'Jl. Contoh No. 1, Jakarta, Indonesia')
  set(q('.paper input[placeholder="Tax ID / NPWP / VAT number"]'), 'NPWP 01.234.567.8-901.000')
  set(q('.paper input[placeholder="billing@company.com"]'), 'jonathan@haputra.com')
  set(q('.paper input[placeholder="+62 812 0000 0000"]'), '+62 812 0000 0000')
  set(q('.paper input[placeholder="www.company.com"]'), 'www.haputra.com')
  set(q('.paper input[placeholder="INV/2026/09/001"]'), 'INV/2026/09/001')
  set(q('.paper input[placeholder="Client name / legal entity"]'), 'Andrew — Railz')
  set(q('.paper input[placeholder="Attn: contact person"]'), 'Attn: Andrew')
  set(q('.paper input[placeholder="Billing address"]'), 'Level 5, 100 Example Street')
  set(q('.paper input[placeholder="City, State, Country / Tax ID"]'), 'Sydney NSW 2000, Australia')
  set(q('.paper input[placeholder="billing email"]'), 'billing@railz.example')
  set(q('.paper input[placeholder="Project or engagement title"]'), 'Software Audit — Fleet Management Platform (Railz X Haputra)')
  set(
    q('.paper textarea[placeholder="Scope of work, deliverables and duration"]'),
    'Scope: (a) verification of calculation engine accuracy; (b) independent data consistency checks; (c) system isolation & security testing (cross-council data protection); (d) architectural & developer-stability recommendations. Duration: 35 working days across 5 weeks — target completion 22–25 October 2026.',
  )
  set(q('.paper textarea[placeholder="Description of the item or service"]'), 'Software audit engagement — first milestone (30% of total project value)')
  set(q('.paper textarea[placeholder="e.g. 30% down payment at kickoff, balance on delivery"]'), 'Termin 1 — 30% down payment of total project value, invoiced at project kickoff. Balance milestones per signed engagement scope.')
  const bank = document.querySelectorAll('.paper input[placeholder="—"]')
  const bankValues = ['Bank Central Asia', '1234567890', 'Haputra Studio', 'CENAIDJA', 'Jakarta, Indonesia']
  bank.forEach((el, i) => set(el, bankValues[i] || ''))
  set(q('.paper textarea[placeholder="Notes for the client, payment reference, scope summary…"]'), 'This invoice covers the first milestone (30%) of the software audit engagement. Use the invoice number as the payment reference.')

  // Address item cells by their COLUMN INDEX, not by a class filter.
  // A `:not(.input-num)` selector looks selective but matches every input
  // (the class is `num-input`), which silently overwrote Qty with a string and
  // produced an incoherent PDF. Column layout is documented in
  // scripts/inspect-item-row.mjs: 1=description, 2=milestone, 3=qty, 4=rate, 5=tax.
  const setRow = (rowNo, { name, milestone, qty, rate, tax }) => {
    const tds = document.querySelectorAll(`.paper tbody tr:nth-child(${rowNo}) td`)
    const put = (cellIndex, value) => {
      if (value === undefined || !tds[cellIndex]) return
      set(tds[cellIndex].querySelector('input, textarea'), value)
    }
    put(1, name)
    put(2, milestone)
    put(3, qty)
    put(4, rate)
    put(5, tax)
  }
  setRow(1, { name: 'Software audit engagement — first milestone (30% of total project value)', milestone: 'Termin 1 / 30%', qty: '1', rate: '7500', tax: '11' })
  setRow(2, { name: 'Stakeholder interview workshop', milestone: 'Discovery', qty: '2', rate: '450', tax: '11' })
})
await new Promise((r) => setTimeout(r, 700))

await page.screenshot({ path: join(OUT, 'app-classic.png'), fullPage: true })
console.log('shot:', join(OUT, 'app-classic.png'))

for (const tpl of ['excel', 'compact']) {
  await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === t)
    btn.click()
  }, tpl === 'excel' ? 'Spreadsheet' : 'Compact')
  await new Promise((r) => setTimeout(r, 500))
  await page.screenshot({ path: join(OUT, `app-${tpl}.png`), fullPage: true })
  console.log('shot:', join(OUT, `app-${tpl}.png`))
}

await browser.close()
