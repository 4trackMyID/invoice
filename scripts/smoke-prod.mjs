/**
 * Production-path check: the deployed Vercel function loads the prebuilt
 * dist-ssr bundle instead of asking Vite to transform source. This proves that
 * branch actually renders and prints, which dev-mode tests never touch.
 *
 *   npm run build && node scripts/smoke-prod.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { closeBrowser, htmlToPdf } from '../server/lib/chrome.js'
import { closeRenderer, renderInvoiceHtml } from '../server/lib/sheet-html.js'
import { app } from '../server/app.js'

const payload = {
  template_type: 'classic',
  theme: 'teal',
  company_name: 'Haputra',
  company_tagline: 'Branding & Website Design',
  company_address_1: 'Jakarta, Indonesia',
  customer_name: 'Andrew — Railz',
  customer_billing_address_1: 'Sydney NSW 2000, Australia',
  project_title: 'Software Audit — Fleet Management Platform',
  invoice_number: 'INV/2026/09/001',
  invoice_date: '2026-09-21',
  due_date: '2026-10-05',
  item_table_header: { name: 'Description', milestone: 'Milestone', quantity: 'Qty', rate: 'Rate', tax1_name: 'Tax', amount: 'Amount' },
  line_items: [{ name: 'Audit milestone 1', milestone: 'Termin 1 / 30%', quantity: '1', rate: '7500', tax1: '11' }],
  show_milestone: true,
  tax_label: 'VAT',
  show_tax_summary: true,
  show_amount_in_words: true,
  currency_code: 'USD',
  currency_symbol: '$',
  sub_total_label: 'Subtotal',
  total_label: 'TOTAL DUE',
  notes: 'Use the invoice number as the payment reference.',
}

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures += 1
}

check('NODE_ENV is production', process.env.NODE_ENV === 'production', process.env.NODE_ENV || '(unset)')

const html = await renderInvoiceHtml(payload)
check('prod renderer emits a document', html.startsWith('<!doctype html>'))
check('prod renderer inlines the sheet stylesheet', html.includes('.sheet-input'))
check('prod renderer inlines the print stylesheet', html.includes('@media print'))
check('prod renderer renders the sheet markup', html.includes('sheet-summary'))
// the print branch must be the static one: no editable controls on the document
check('document contains no form controls', !/<(input|textarea)\b/i.test(html))

// A heading with nothing under it prints as an unfinished invoice, so optional
// sections must disappear from the document when their body is blank.
// Two things to get right when testing this:
//   - the payload above sets notes and project_title, so those blocks SHOULD
//     print there; blanks are asserted on a payload that really is blank
//   - match the full heading text: a bare /TERMS/ also matches "Payment Terms"
check('filled notes section is printed', />\s*Notes\s*</i.test(html))
check('filled project block is printed', /Project\b/i.test(html))

{
  const blank = await renderInvoiceHtml({
    template_type: 'classic',
    company_name: 'A',
    customer_name: 'B',
    // due_date, terms, bank details, notes and project all left empty on purpose
    line_items: [{ name: 'x', quantity: '1', rate: '1' }],
    payment_terms: '',
  })
  check('blank terms section is not printed', !/Terms &amp; Conditions|Terms & Conditions/i.test(blank))
  check('blank payment details are not printed', !/SWIFT/i.test(blank) && !/Account Number/i.test(blank))
  check('blank notes section is not printed', !/>\s*Notes\s*</i.test(blank))
  check('blank payment terms are not printed', !/Payment Terms/i.test(blank))
  check('blank project block is not printed', !/Project\b/i.test(blank))
}

// ...and the same document DOES print them once the user fills them in
{
  const filled = await renderInvoiceHtml({
    ...payload,
    terms_and_conditions: 'Payment is due within 14 days of the invoice date.',
    notes: 'Use the invoice number as the payment reference.',
    payment_terms: 'Net 14 days',
    bank_name: 'Bank Central Asia',
    bank_swift: 'CENAIDJA',
  })
  check('filled terms section appears', /Terms &amp; Conditions|Terms & Conditions/i.test(filled))
  check('filled notes section appears', />\s*Notes\s*</i.test(filled))
  check('filled payment terms appear', /Payment Terms/i.test(filled))
  check('filled payment details appear', /SWIFT/i.test(filled) && /CENAIDJA/.test(filled))
}

// and the route itself answers over HTTP with the same app object Vercel mounts
const res = await app.request('/api/invoice/download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
const bytes = new Uint8Array(await res.arrayBuffer())
check(
  'POST /api/invoice/download renders a PDF',
  res.status === 200 && String.fromCharCode(...bytes.subarray(0, 5)) === '%PDF-',
  `${res.status} ${bytes.byteLength} bytes`,
)

await mkdir('tmp/pdf', { recursive: true })
await writeFile('tmp/pdf/invoice-prod.pdf', bytes)
console.log('-> tmp/pdf/invoice-prod.pdf')

await closeRenderer()
await closeBrowser()
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
