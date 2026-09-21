/**
 * HTML for the exported invoice: the editor's own sheet components rendered on
 * the server, with the stylesheet inlined so the PDF is one self-contained page.
 *
 * Two sources, chosen by environment rather than by what happens to exist on disk
 * — a stale build silently answering a dev request is worse than a slow first hit:
 *   - dev   → Vite transforms the source on demand, so an edit shows up in the
 *             very next export
 *   - prod  → the prebuilt dist-ssr bundle (see vite.print.config.js)
 */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BUILT_ENTRY = join(ROOT, 'dist-ssr', 'entry.js')
const isProduction = () => process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)

let rendererPromise = null
let viteServer = null

async function devRenderer() {
  const { createServer } = await import('vite')
  // the app's own config, so the same plugins (React, Tailwind) produce the CSS
  viteServer = await createServer({
    configFile: join(ROOT, 'vite.config.js'),
    // no HMR socket and no watcher: this server only transforms modules for the
    // PDF. Both must be off — `hmr: false` alone still opens the websocket, and
    // its port collides with the dev server the office already has running.
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    appType: 'custom',
    logLevel: 'warn',
  })
  return viteServer.ssrLoadModule('/src/print/entry.jsx')
}

async function builtRenderer() {
  if (!existsSync(BUILT_ENTRY)) {
    throw new Error('dist-ssr/entry.js is missing — run `npm run build` before starting the server')
  }
  return import(pathToFileURL(BUILT_ENTRY).href)
}

function loadRenderer() {
  if (!rendererPromise) {
    rendererPromise = (isProduction() ? builtRenderer() : devRenderer()).catch((error) => {
      rendererPromise = null
      throw error
    })
  }
  return rendererPromise
}

/** @returns {Promise<string>} a complete HTML document, A4 print styles included */
export async function renderInvoiceHtml(payload) {
  const { renderInvoiceHtml: render } = await loadRenderer()
  return render(payload)
}

/** Release what a renderer holds open: Vite's server, module watchers, sockets. */
export async function closeRenderer() {
  const pending = rendererPromise
  rendererPromise = null
  await pending?.catch(() => {})
  const server = viteServer
  viteServer = null
  await server?.close()
}
