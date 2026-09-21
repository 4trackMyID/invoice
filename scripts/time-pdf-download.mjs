/**
 * Time the PDF download as the browser experiences it, so the e2e waits can be
 * based on a measurement instead of a guess.
 *
 *   node scripts/time-pdf-download.mjs
 */
import { existsSync, readdirSync } from 'node:fs'
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

const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1360, height: 1000 })
await page.goto('http://localhost:5199/', { waitUntil: 'networkidle0' })
await page.evaluate(() => window.localStorage.clear())
await page.reload({ waitUntil: 'networkidle0' })
await page.waitForSelector('.paper')

await page.evaluate(() => {
  const set = (el, v) => {
    if (!el) return
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  set(document.querySelector('.paper input[placeholder="Your Company"]'), 'Haputra Studio')
  set(document.querySelector('.paper input[placeholder="Client name / legal entity"]'), 'Railz Pty Ltd')
  set(document.querySelector('.paper textarea[placeholder="Description of the item or service"]'), 'Audit milestone 1')
  const nums = document.querySelectorAll('.paper tbody tr:nth-child(1) input.num-input')
  set(nums[1], '7500')
})
await new Promise((r) => setTimeout(r, 600))

// 1. how long does the endpoint take, measured in-page?
const timing = await page.evaluate(async () => {
  const raw = JSON.parse(window.localStorage.getItem('invoice-generator:draft:v2'))
  const t0 = performance.now()
  const res = await fetch('/api/invoice/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(raw),
  })
  const buf = await res.arrayBuffer()
  return { ms: Math.round(performance.now() - t0), status: res.status, bytes: buf.byteLength }
})
console.log('endpoint timing:', JSON.stringify(timing))

// 2. and the first request of a session pays Chrome's cold start
const warm2 = await page.evaluate(async () => {
  const raw = JSON.parse(window.localStorage.getItem('invoice-generator:draft:v2'))
  const t0 = performance.now()
  const res = await fetch('/api/invoice/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(raw),
  })
  const buf = await res.arrayBuffer()
  return { ms: Math.round(performance.now() - t0), bytes: buf.byteLength }
})
console.log('second request:', JSON.stringify(warm2))

// 3. the actual click-through download, polled rather than slept on
const dir = join(ROOT, 'tmp', 'downloads-timing')
const fs = await import('node:fs/promises')
await fs.rm(dir, { recursive: true, force: true })
await fs.mkdir(dir, { recursive: true })
const client = await page.createCDPSession()
await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dir })

const started = Date.now()
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith('Download PDF'))
  btn.click()
})
let waited = 0
let files = []
while (Date.now() - started < 30000) {
  files = readdirSync(dir).filter((f) => f.endsWith('.pdf'))
  if (files.length) break
  await new Promise((r) => setTimeout(r, 200))
  waited += 200
}
console.log(`click-to-file: ${files.length ? `${Date.now() - started}ms` : 'TIMED OUT after 30s'}`, files.join(', '))

await browser.close()
