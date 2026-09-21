/**
 * Measure whether the toolbar controls clip their own labels (a select renders
 * its chosen option truncated when the box is narrower than the text).
 */
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import puppeteer from 'puppeteer-core'

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
await page.setViewport({ width: 1420, height: 1200 })
await page.goto('http://localhost:5199/', { waitUntil: 'networkidle0' })

const report = await page.evaluate(() => {
  const measure = (text, font) => {
    const el = document.createElement('span')
    el.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${font}`
    el.textContent = text
    document.body.appendChild(el)
    const w = el.getBoundingClientRect().width
    el.remove()
    return w
  }
  const out = []
  for (const sel of document.querySelectorAll('select')) {
    const cs = getComputedStyle(sel)
    const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    const shown = sel.options[sel.selectedIndex]?.textContent || ''
    const inner = sel.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    const textW = measure(shown, font)
    out.push({
      aria: sel.getAttribute('aria-label'),
      shown,
      boxInner: Math.round(inner),
      textWidth: Math.round(textW),
      clipped: textW > inner,
    })
  }
  // longest option in the currency select, worst case
  const currency = [...document.querySelectorAll('select')].find((s) => s.getAttribute('aria-label') === 'Currency')
  if (currency) {
    const cs = getComputedStyle(currency)
    const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    let worst = { label: '', width: 0 }
    const widest = []
    for (const o of currency.options) {
      const w = measure(o.textContent, font)
      if (w > worst.width) worst = { label: o.textContent, width: Math.round(w) }
      widest.push({ label: o.textContent, width: Math.round(w) })
    }
    widest.sort((a, b) => b.width - a.width)
    out.push({
      worstOption: worst,
      boxInner: Math.round(currency.clientWidth - 28),
      widestFive: widest.slice(0, 5),
    })
  }
  return out
})
console.log(JSON.stringify(report, null, 2))
await browser.close()
