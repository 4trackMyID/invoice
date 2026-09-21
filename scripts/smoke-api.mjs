/**
 * API contract test — exercises the endpoints the way the browser and Vercel do.
 *
 *   node scripts/smoke-api.mjs
 *
 * Starts the shared Hono app on a throwaway port and asserts:
 *   1. GET  /api/health                       -> ok
 *   2. POST /api/invoice/download (multipart) -> application/pdf, real PDF bytes
 *   3. POST /api/invoice/download (raw JSON)  -> same
 *   4. POST with no line items                -> 400 with a message
 *   5. POST with no company/client name       -> 400 with a message
 */
import { createServer } from 'node:http'
import { getRequestListener } from '@hono/node-server'
import { app } from '../server/app.js'
import { closeBrowser } from '../server/lib/chrome.js'
import { closeRenderer } from '../server/lib/sheet-html.js'

const payload = {
  title: 'INVOICE',
  template_type: 'classic',
  company_name: 'Haputra',
  company_tagline: 'Branding & Website Design',
  company_address_1: 'Jakarta, Indonesia',
  company_email: 'jonathan@haputra.com',
  bill_to_label: 'Bill To',
  customer_name: 'Andrew — Railz',
  customer_billing_address_1: 'Sydney NSW 2000, Australia',
  project_title: 'Software Audit — Fleet Management Platform',
  invoice_number: 'INV/2026/09/001',
  invoice_date: '2026-09-21',
  due_date: '2026-10-05',
  payment_terms: 'Termin 1 — 30% down payment.',
  item_table_header: { name: 'Description', milestone: 'Milestone', quantity: 'Qty', rate: 'Rate', tax1_name: 'Tax', amount: 'Amount' },
  line_items: [{ name: 'Audit milestone 1', milestone: 'Termin 1 / 30%', quantity: '1', rate: '7500', tax1: '11' }],
  show_milestone: true,
  tax_label: 'VAT',
  show_tax_summary: true,
  currency_code: 'USD',
  currency_symbol: '$',
  sub_total_label: 'Subtotal',
  total_label: 'TOTAL DUE',
  amount_in_words: 'Eight thousand three hundred and twenty-five US dollars only',
  show_amount_in_words: true,
  bank_name: 'BCA',
  bank_account_number: '1234567890',
  notes: 'Use the invoice number as the payment reference.',
}

const listener = getRequestListener(app.fetch)
const server = createServer(listener)
await new Promise((resolve) => server.listen(0, resolve))
const port = server.address().port
const url = `http://127.0.0.1:${port}`

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures += 1
}

// 1. health
{
  const res = await fetch(`${url}/api/health`)
  const json = await res.json()
  check('GET /api/health', res.ok && json.status === 'ok', JSON.stringify(json))
}

// 2. multipart download (the shape the original generator posts)
{
  const form = new FormData()
  form.append('JSONString', JSON.stringify(payload))
  form.append('is_new_template_flow', 'true')
  const res = await fetch(`${url}/api/invoice/download?print=false`, { method: 'POST', body: form })
  const buf = Buffer.from(await res.arrayBuffer())
  const header = buf.subarray(0, 5).toString('latin1')
  check(
    'POST /api/invoice/download (multipart)',
    res.ok && res.headers.get('content-type') === 'application/pdf' && header === '%PDF-',
    `${res.status} ${res.headers.get('content-type')} ${buf.byteLength} bytes, header=${header}`,
  )
  check('Content-Disposition attachment', (res.headers.get('content-disposition') || '').startsWith('attachment'))
}

// 3. raw JSON (used by curl / tests)
{
  const res = await fetch(`${url}/api/invoice/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, template_type: 'excel' }),
  })
  const buf = Buffer.from(await res.arrayBuffer())
  check('POST /api/invoice/download (json)', res.ok && buf.subarray(0, 5).toString('latin1') === '%PDF-', `${buf.byteLength} bytes`)
}

// 4. missing line items
{
  const res = await fetch(`${url}/api/invoice/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, line_items: [] }),
  })
  const json = await res.json()
  check('rejects empty line_items', res.status === 400 && /line item/i.test(json.message), json.message)
}

// 5. missing required names
{
  const res = await fetch(`${url}/api/invoice/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, company_name: '', customer_name: '' }),
  })
  const json = await res.json()
  check('rejects missing names', res.status === 400 && /fill in/i.test(json.message), json.message)
}

// the export path keeps a browser and a module graph alive: release both, or a
// passing run never exits
await closeRenderer()
await closeBrowser()
server.close()
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
