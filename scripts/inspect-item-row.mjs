/**
 * Inspect the item row's numeric inputs in order, so a fixture can address them
 * by position without guessing.
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
await page.setViewport({ width: 1420, height: 1000 })
await page.goto('http://localhost:5199/', { waitUntil: 'networkidle0' })
await page.evaluate(() => window.localStorage.clear())
await page.reload({ waitUntil: 'networkidle0' })
await page.waitForSelector('.paper')

const info = await page.evaluate(() => {
  const describe = (el) => ({
    tag: el.tagName.toLowerCase(),
    cls: el.className,
    type: el.getAttribute('type'),
    value: el.value,
    placeholder: el.getAttribute('placeholder'),
    index: `${el.closest('td') ? [...el.closest('tr').children].indexOf(el.closest('td')) : -1}`,
  })
  const row = (n) => {
    const tr = document.querySelector(`.paper tbody tr:nth-child(${n})`)
    if (!tr) return null
    return {
      cells: [...tr.children].map((td, i) => ({
        i,
        inputs: [...td.querySelectorAll('input,textarea')].map(describe),
      })),
    }
  }
  return {
    headerRow: [...document.querySelectorAll('.paper thead th, .paper tr:first-child th')].map((th) => th.innerText.trim()),
    row1: row(1),
    row2: row(2),
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
