import { useRef, useState } from 'react'
import { TEMPLATES, THEMES } from '../lib/invoice.js'
import { CurrencyPicker } from './CurrencyPicker.jsx'
import { formatAmount } from '../lib/format.js'
import { PreviewModal } from './PreviewModal.jsx'

export function Toolbar({ doc, pdf, onSave, onExportCurrent, onImportPayload }) {
  const { invoice, setField, updateSection, totals, isValid, issues, savedAt, recordId, dirty } = doc
  const [openMenu, setOpenMenu] = useState(false)
  const [notice, setNotice] = useState('')
  const [copies, setCopies] = useState(1)
  const [showCopies, setShowCopies] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const fileRef = useRef(null)

  const flash = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3500)
  }

  const themeColor = THEMES.find((t) => t.key === invoice.theme)?.accent || '#408dfb'

  return (
    <div className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md text-[13px] font-black text-white" style={{ background: themeColor }}>
            i
          </span>
          <span className="text-[14px] font-bold tracking-tight text-slate-800">Invoice Generator</span>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              title={t.hint}
              onClick={() => setField('template_type', t.key)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition ${
                invoice.template_type === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[12px] text-slate-500">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={invoice.show_milestone}
              onChange={(e) => setField('show_milestone', e.target.checked)}
            />
            Milestone column
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={invoice.show_tax_summary}
              onChange={(e) => setField('show_tax_summary', e.target.checked)}
            />
            Tax rows
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={invoice.show_amount_in_words}
              onChange={(e) => setField('show_amount_in_words', e.target.checked)}
            />
            In words
          </label>
          <label className="flex items-center gap-2">
            Theme
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[12px]"
              value={invoice.theme}
              onChange={(e) => setField('theme', e.target.value)}
            >
              {THEMES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-[11.5px] text-slate-400 sm:inline">
            {recordId ? `Saved record · ${recordId.slice(0, 8)}` : 'Draft'}
            {dirty ? ' · editing' : savedAt ? ` · autosaved ${savedAt.toLocaleTimeString()}` : ''}
          </span>

          <CurrencyPicker
            code={invoice.currency_code}
            symbol={invoice.currency_symbol}
            onChange={(patch) => Object.entries(patch).forEach(([k, v]) => setField(k, v))}
          />

          <button
            type="button"
            onClick={async () => {
              if (!isValid) {
                flash(Object.values(issues)[0] || 'Please complete the required fields')
                return
              }
              const id = await onSave()
              if (id) flash('Invoice saved to your invoice list')
              else flash(pdf.error || 'Save failed')
            }}
            disabled={pdf.busy}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Save and Send
          </button>

          <div className="relative">
            {/* one split control: primary action plus its menu */}
            <div className="flex items-stretch overflow-hidden rounded-md">
              <button
                type="button"
                onClick={() => pdf.download()}
                disabled={pdf.busy}
                className="px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
                style={{ background: themeColor }}
              >
                {pdf.busy ? 'Working…' : 'Download PDF'}
              </button>
              <button
                type="button"
                aria-label="More download actions"
                aria-haspopup="menu"
                aria-expanded={openMenu}
                onClick={() => setOpenMenu((v) => !v)}
                className="border-l border-white/30 px-2 py-1.5 text-[12.5px] text-white"
                style={{ background: themeColor }}
              >
                ▾
              </button>
            </div>
            {openMenu && (
              <div className="absolute right-0 z-30 mt-1 w-[190px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  className="block w-full rounded px-3 py-2 text-left text-[12.5px] hover:bg-slate-50"
                  onClick={() => {
                    setOpenMenu(false)
                    setShowPreview(true)
                  }}
                >
                  Preview before export
                </button>
                <button
                  type="button"
                  className="block w-full rounded px-3 py-2 text-left text-[12.5px] hover:bg-slate-50"
                  onClick={() => {
                    setOpenMenu(false)
                    pdf.print()
                  }}
                >
                  Print
                </button>
                <button
                  type="button"
                  className="block w-full rounded px-3 py-2 text-left text-[12.5px] hover:bg-slate-50"
                  onClick={() => {
                    setOpenMenu(false)
                    setShowCopies(true)
                  }}
                >
                  Number of copies…
                </button>
                <button
                  type="button"
                  className="block w-full rounded px-3 py-2 text-left text-[12.5px] hover:bg-slate-50"
                  onClick={() => {
                    setOpenMenu(false)
                    onExportCurrent()
                  }}
                >
                  Export this invoice (JSON)
                </button>
                <button
                  type="button"
                  className="block w-full rounded px-3 py-2 text-left text-[12.5px] hover:bg-slate-50"
                  onClick={() => {
                    setOpenMenu(false)
                    fileRef.current?.click()
                  }}
                >
                  Import JSON…
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              try {
                const text = await file.text()
                const parsed = JSON.parse(text)
                const record = Array.isArray(parsed) ? parsed[0] : parsed.records ? parsed.records[0] : parsed
                onImportPayload(record.payload || record)
                flash('Invoice imported')
              } catch {
                flash('That file is not a valid invoice export')
              }
            }}
          />
        </div>
      </div>

      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 pb-2 text-[11.5px] text-slate-400">
        <span>
          {totals.taxes.length === 1 ? '1 tax group' : `${totals.taxes.length} tax groups`} · Total {invoice.currency_symbol}
          {formatAmount(totals.total, invoice.currency_code)}
        </span>
        {pdf.error && <span className="text-rose-600">{pdf.error}</span>}
        {notice && <span className="text-emerald-600">{notice}</span>}
      </div>

      {showCopies && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/30 p-4" onClick={() => setShowCopies(false)}>
          <div className="w-full max-w-[360px] rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-[15px] font-bold text-slate-800">Number of Copies</h4>
            <div className="mt-3 space-y-2 text-[12.5px]">
              {[
                [1, 'One Copy', 'An original copy will be printed.'],
                [2, 'Two Copies', 'A supplier copy and a recipient copy.'],
                [3, 'Three Copies', 'Supplier, transporter and recipient copies.'],
              ].map(([value, label, hint]) => (
                <label key={value} className="flex cursor-pointer gap-2 rounded-lg border border-slate-200 p-2.5">
                  <input type="radio" name="print-option" checked={copies === value} onChange={() => setCopies(value)} />
                  <span>
                    <b>{label}</b>
                    <span className="block text-slate-500">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-md border border-slate-300 px-3 py-1.5 text-[12.5px]" onClick={() => setShowCopies(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-[12.5px] font-semibold text-white"
                style={{ background: themeColor }}
                onClick={async () => {
                  setShowCopies(false)
                  for (let i = 0; i < copies; i += 1) {
                    const built = await pdf.print()
                    // a refused payload produces no file: say why instead of
                    // opening empty tabs
                    if (built.error) return flash(built.error)
                  }
                }}
              >
                Print {copies} {copies === 1 ? 'copy' : 'copies'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PreviewModal open={showPreview} onClose={() => setShowPreview(false)} payload={doc.payload} pdf={pdf} />
    </div>
  )
}
