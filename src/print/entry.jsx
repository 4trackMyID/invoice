/**
 * Server-side renderer for the exported PDF.
 *
 * Renders the *same* sheet components the editor mounts, to a standalone HTML
 * document with the stylesheet inlined, so Chrome's print engine can lay it out
 * as an A4 page. Nothing here reads the DOM or the browser storage: the payload
 * the client POSTs is the only input.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import sheetCss from '../index.css?inline'
import printCss from './print.css?inline'
import { PrintDocument } from './PrintDocument.jsx'

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  )

export function renderInvoiceHtml(payload) {
  const title = `INVOICE ${payload.invoice_number || ''}`.trim()
  const body = renderToStaticMarkup(<PrintDocument payload={payload} />)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${sheetCss}</style>
<style>${printCss}</style>
</head>
<body>
<div id="invoice">${body}</div>
</body>
</html>
`
}
