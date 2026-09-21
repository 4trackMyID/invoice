/**
 * Local development server: the same Hono app plus a tiny on-disk store so the
 * API can be exercised from curl without a browser.
 *
 *   node server/index.js        # http://localhost:3099
 *
 * Record storage lives in the browser (src/lib/storage.js) because the deployed
 * target is Vercel, where the filesystem is ephemeral — the endpoints below are
 * a local convenience only and are intentionally absent from api/index.js.
 */
import { serve } from '@hono/node-server'
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { app, readInvoicePayload } from './app.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '.data', 'invoices')
const PORT = Number(process.env.PORT || 3099)

await mkdir(DATA_DIR, { recursive: true })

function contentTypeFor(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8'
  if (p.endsWith('.js')) return 'text/javascript; charset=utf-8'
  if (p.endsWith('.css')) return 'text/css; charset=utf-8'
  if (p.endsWith('.svg')) return 'image/svg+xml'
  if (p.endsWith('.png')) return 'image/png'
  if (p.endsWith('.json')) return 'application/json'
  return 'application/octet-stream'
}

app.post('/api/invoice/save', async (c) => {
  try {
    const { payload } = await readInvoicePayload(c)
    const fileId = randomUUID()
    const record = { file_id: fileId, saved_at: new Date().toISOString(), payload }
    await writeFile(join(DATA_DIR, `${fileId}.json`), JSON.stringify(record, null, 2), 'utf8')
    return c.json({ status: 'success', data: { file_id: fileId, title: payload.title || 'INVOICE' } })
  } catch (error) {
    return c.json({ status: 'error', message: error.message || 'Unable to save the invoice' }, 500)
  }
})

app.get('/api/invoice/:fileId', async (c) => {
  const fileId = c.req.param('fileId')
  const path = join(DATA_DIR, `${fileId}.json`)
  if (!/^[\w-]+$/.test(fileId) || !existsSync(path)) {
    return c.json({ status: 'error', message: 'Invoice not found' }, 404)
  }
  return c.json({ status: 'success', data: JSON.parse(await readFile(path, 'utf8')) })
})

app.get('/api/invoice', async (c) => {
  const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.json'))
  const records = await Promise.all(
    files.map(async (f) => {
      const r = JSON.parse(await readFile(join(DATA_DIR, f), 'utf8'))
      return {
        file_id: r.file_id,
        saved_at: r.saved_at,
        invoice_number: r.payload?.invoice_number || '',
        customer_name: r.payload?.customer_name || '',
      }
    }),
  )
  records.sort((a, b) => (a.saved_at < b.saved_at ? 1 : -1))
  return c.json({ status: 'success', data: records })
})

// Serve the production build when it exists, so `npm run build && npm start`
// is a single-process preview.
const dist = join(__dirname, '..', 'dist')
if (existsSync(dist)) {
  app.use('*', async (c, next) => {
    if (c.req.path.startsWith('/api')) return next()
    const rel = c.req.path === '/' ? 'index.html' : c.req.path.replace(/^\//, '')
    const filePath = join(dist, rel)
    if (existsSync(filePath)) {
      return new Response(await readFile(filePath), { headers: { 'Content-Type': contentTypeFor(filePath) } })
    }
    return new Response(await readFile(join(dist, 'index.html')), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  })
}

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`invoice-generator api listening on http://localhost:${info.port}`)
})
