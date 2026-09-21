import { useRef, useState } from 'react'
import { formatAmount } from '../lib/format.js'

const TABS = [
  { key: 'invoices', label: 'Invoices' },
  { key: 'data', label: 'Data' },
]

/**
 * Saved-invoice panel: the CRUD half of the app. Storage lives behind
 * src/lib/storage.js, so this panel never talks to a database directly.
 */
export function Sidebar({ invoices, doc, onOpen, onDelete, onDuplicate, onNew, onExportAll, onImportAll, onClearAll }) {
  const [tab, setTab] = useState('invoices')
  const [confirm, setConfirm] = useState(null)
  const fileRef = useRef(null)
  const { recordId } = doc
  const count = invoices.records.length

  const exportAllFile = () => {
    const payload = invoices.exportAllData ? invoices.exportAllData() : { records: [] }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
    onExportAll?.()
  }

  return (
    <aside className="no-print w-full shrink-0 lg:w-[330px]">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-md px-3 py-1 text-[12px] font-medium ${
                  tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onNew}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            + New
          </button>
        </div>

        {tab === 'invoices' && (
          <>
            <div className="mb-2 space-y-2">
              <input
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-[12.5px]"
                placeholder="Search number, client, company…"
                value={invoices.search}
                onChange={(e) => invoices.setSearch(e.target.value)}
              />
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[12.5px]"
                value={invoices.status}
                onChange={(e) => invoices.setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {invoices.loading && <p className="py-4 text-center text-[12px] text-slate-400">Loading…</p>}
              {!invoices.loading && !invoices.records.length && (
                <p className="py-4 text-center text-[12px] text-slate-400">
                  No saved invoices yet. Fill the sheet and press <b>Save and Send</b>.
                </p>
              )}
              {invoices.records.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-lg border p-2.5 text-[12px] ${
                    recordId === r.id ? 'border-sky-300 bg-sky-50/60' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button type="button" className="min-w-0 text-left" onClick={() => onOpen(r.id)}>
                      <div className="truncate font-semibold text-slate-800">{r.name}</div>
                      <div className="truncate text-slate-500">
                        {r.invoice_number || 'no number'} · {r.customer_name || 'no client'}
                      </div>
                    </button>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] uppercase text-slate-500">
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="font-semibold tabular-nums text-slate-800">
                      {r.currency_symbol}
                      {formatAmount(r.total, r.currency_code)}
                    </span>
                    <span className="text-[10.5px] text-slate-400">
                      {r.line_count} item(s) · {r.template_type}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <button type="button" className="rounded border border-slate-200 px-2 py-0.5 text-[11px]" onClick={() => onOpen(r.id)}>
                      Edit
                    </button>
                    <button type="button" className="rounded border border-slate-200 px-2 py-0.5 text-[11px]" onClick={() => onDuplicate(r.id)}>
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="ml-auto rounded border border-rose-200 px-2 py-0.5 text-[11px] text-rose-600"
                      onClick={() => setConfirm(r)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 border-t border-slate-100 pt-2 text-[11.5px] text-slate-500">
              {count} {count === 1 ? 'invoice' : 'invoices'} saved in this browser
            </div>
          </>
        )}

        {tab === 'data' && (
          <div className="space-y-3 text-[12px] text-slate-600">
            <p>
              Invoices are kept in this browser, not on a server. That is deliberate: the app runs on Vercel, where the
              filesystem is ephemeral, so a local SQLite file would lose data between invocations.
            </p>
            <p>
              Export a backup before clearing your browser data, and import it on another device or after a reset.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" className="rounded-md border border-slate-300 px-2.5 py-1" onClick={exportAllFile}>
                Export all (JSON)
              </button>
              <button type="button" className="rounded-md border border-slate-300 px-2.5 py-1" onClick={() => fileRef.current?.click()}>
                Import backup
              </button>
              <button
                type="button"
                className="rounded-md border border-rose-200 px-2.5 py-1 text-rose-600"
                onClick={() => setConfirm({ id: '__all__', name: 'ALL invoices' })}
              >
                Clear all
              </button>
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
                  await onImportAll(JSON.parse(await file.text()))
                } catch {
                  /* invalid backup — the panel keeps the previous records */
                }
              }}
            />
          </div>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/30 p-4" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-[340px] rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-[14.5px] font-bold text-slate-800">
              Delete {confirm.id === '__all__' ? 'every stored invoice' : `"${confirm.name}"`}?
            </h4>
            <p className="mt-1 text-[12px] text-slate-500">This removes the record from local storage. It cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-md border border-slate-300 px-3 py-1.5 text-[12.5px]" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-rose-600 px-3 py-1.5 text-[12.5px] font-semibold text-white"
                onClick={async () => {
                  if (confirm.id === '__all__') await onClearAll()
                  else await onDelete(confirm.id)
                  setConfirm(null)
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
