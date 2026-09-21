/**
 * The API surface, shared by every runtime:
 *   - server/index.js  → local Node dev server (@hono/node-server)
 *   - api/index.js     → Vercel serverless function (hono/vercel)
 *
 * Everything here is stateless, which is what makes the Vercel deploy safe:
 * the filesystem on a serverless platform is ephemeral, so records live in the
 * browser through src/lib/storage.js instead of on the server.
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { htmlToPdf } from './lib/chrome.js'
import { renderInvoiceHtml } from './lib/sheet-html.js'

export const app = new Hono()

app.use('*', cors())

/** The original posts FormData with a JSONString field; accept raw JSON too. */
export async function readInvoicePayload(c) {
  const contentType = c.req.header('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const form = await c.req.formData()
    const raw = form.get('JSONString')
    if (!raw) throw new Error('JSONString field is required')
    return { payload: JSON.parse(String(raw)), logo: form.get('org_logo') }
  }
  return { payload: await c.req.json(), logo: null }
}

/** Logo upload → data URL, enforcing the original's 1 MB / png-jpeg limits. */
export async function logoToDataUrl(file) {
  if (!file || typeof file === 'string') return null
  if (typeof file.arrayBuffer !== 'function') return null
  const bytes = Buffer.from(await file.arrayBuffer())
  const mime = file.type || 'image/png'
  if (!/^image\/(png|jpe?g)$/i.test(mime)) return null
  if (bytes.byteLength > 1024 * 1024) return null
  return `data:${mime};base64,${bytes.toString('base64')}`
}

/**
 * A logo the document can actually draw. Anything else (a stray string from an
 * imported JSON file) becomes no logo — a broken image frame on a client's
 * invoice is worse than a plain letterhead.
 */
export function safeLogoSrc(value) {
  return typeof value === 'string' && /^data:image\/(png|jpe?g);base64,[A-Za-z0-9+/=]+$/.test(value)
    ? value
    : null
}

app.get('/api/health', (c) => c.json({ status: 'ok', service: 'invoice-generator' }))

app.post('/api/invoice/download', async (c) => {
  try {
    const { payload, logo } = await readInvoicePayload(c)
    const logoSrc = (await logoToDataUrl(logo)) || safeLogoSrc(payload.logo)
    const wantsPrint = c.req.query('print') === 'true'

    if (!payload.company_name || !payload.customer_name) {
      return c.json(
        { status: 'error', message: "Please fill in your company's name and your client's name" },
        400,
      )
    }
    if (!(payload.line_items || []).length) {
      return c.json({ status: 'error', message: 'Add at least one line item' }, 400)
    }

    // the sheet the user was looking at, printed by Chrome: one renderer for the
    // editor and the PDF, so the export cannot drift from what is on screen
    const html = await renderInvoiceHtml({ ...payload, logo: logoSrc })
    const pdfBytes = await htmlToPdf(html)
    const filename = `Invoice-${payload.invoice_number || 'draft'}.pdf`.replace(/[^\w.\-]+/g, '_')
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${wantsPrint ? 'inline' : 'attachment'}; filename="${filename}"`,
        'Content-Length': String(pdfBytes.byteLength),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return c.json({ status: 'error', message: error.message || 'Unable to build the PDF' }, 500)
  }
})
