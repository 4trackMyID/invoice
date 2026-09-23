import { useState } from 'react'
import { createPortal } from 'react-dom'
import { PrintDocument } from '../print/PrintDocument.jsx'

/**
 * Pre-export preview: the invoice as a *document*, rendered by the very same
 * component the export renders (`src/print/PrintDocument.jsx`).
 *
 * It deliberately does not frame the returned PDF bytes. Only browsers that
 * ship an inline PDF viewer can draw one — Chromium-family desktop browsers do,
 * but Electron shells and many embedded webviews do not, and there the frame
 * stays blank next to a perfectly good file. Rendering the document works
 * everywhere, because it is only DOM.
 *
 * This is not a second layout: the editor pins the sheet to 840px and
 * `print.css` pins the printed sheet to the same 840px, so the wrapping is
 * identical, and Chrome then scales the whole document onto A4. The preview is
 * those same components in print mode (static text, no edit affordances) at
 * that same width, on a page frame with A4's proportions.
 *
 * Because it needs no network it also renders an unfinished draft — which is
 * exactly when a preview is worth looking at. Validation still runs on
 * Download/Open, where refusing to produce a file is the correct behaviour.
 */
/** A4 at 96dpi (the same 210x297mm `server/lib/chrome.js` prints onto). */
const A4 = { width: 840, height: (840 * 297) / 210 }

export function PreviewModal({ open, onClose, payload, pdf }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const openPdf = async () => {
    // The tab is opened *before* the await: after one, browsers treat
    // window.open as a popup and block it.
    const win = window.open('', '_blank')
    setError('')
    setBusy(true)
    const built = await pdf.build()
    setBusy(false)
    if (!built.url) {
      win?.close()
      setError(built.error || 'Unable to build the PDF')
      return
    }
    if (win) {
      win.location.href = built.url
    } else {
      setError('The browser blocked the new tab — allow pop-ups for this site')
    }
    setTimeout(() => URL.revokeObjectURL(built.url), 60_000)
  }

  const download = async () => {
    setError('')
    setBusy(true)
    const built = await pdf.download()
    setBusy(false)
    if (built.url) onClose()
    else setError(built.error || 'Unable to build the PDF')
  }

  // Portalled to <body> on purpose. The toolbar this button lives in is
  // `sticky` with a backdrop blur, and a blur makes that ancestor the
  // containing block for `position: fixed` descendants — so `inset-0` resolved
  // against the 124px toolbar instead of the viewport, and the sheet was
  // cropped into a sliver with the actions pushed off screen. Rendering into
  // document.body puts the overlay outside every such ancestor.
  return createPortal(
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Invoice preview"
    >
      <div
        className="flex max-h-full w-full max-w-[900px] flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
          <span className="text-[13px] font-bold text-slate-800">
            Preview — the sheet as it will print
          </span>
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-[13px] text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-3">
          {/* A4 is 210x297mm, so a page at this width is this tall: the frame
            shows the proportion Chrome will print, not an arbitrary scroll box.
            Nothing is clipped - a document long enough to paginate still shows
            all of its content here, because the exported PDF, not this frame,
            is the authority on where the page breaks fall. */}
          <div
            className="preview-document mx-auto bg-white shadow-sm [&_.paper]:shadow-none"
            style={{ width: A4.width, minHeight: A4.height }}
          >
            <PrintDocument payload={payload} />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 px-4 py-2.5">
          {error && <span className="mr-auto text-[12px] text-rose-600">{error}</span>}
          <span className="mr-auto text-[11.5px] text-slate-400">
            A4 export: {busy ? 'building…' : 'Chrome scales this page onto one sheet'}
          </span>
          <button type="button" className="rounded-md border border-slate-300 px-3 py-1.5 text-[12.5px]" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-[12.5px] disabled:opacity-50"
            disabled={busy}
            onClick={openPdf}
          >
            Open PDF
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-800 px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
            disabled={busy}
            onClick={download}
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
