import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClassicSheet } from './components/ClassicSheet.jsx'
import { StandardSheet } from './components/StandardSheet.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { Toolbar } from './components/Toolbar.jsx'
import { useInvoice } from './hooks/useInvoice.js'
import { useInvoices } from './hooks/useInvoices.js'
import { usePdf } from './hooks/usePdf.js'
import { THEMES, fromPayload, toPayload } from './lib/invoice.js'
import { invoiceToFile } from './lib/storage.js'

export default function App() {
  const doc = useInvoice()
  const invoices = useInvoices()
  const pdf = usePdf(doc.payload)

  const { invoice, load, setField, setDirty, setRecordId } = doc

  const themeColor = THEMES.find((t) => t.key === invoice.theme)?.accent || '#408dfb'

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', themeColor)
  }, [themeColor])

  /** CREATE or UPDATE depending on whether the sheet came from a stored record. */
  const onSave = useCallback(async () => {
    if (doc.recordId) {
      const updated = await invoices.update(doc.recordId, invoice)
      // adopt whatever the store kept (e.g. a number that was issued on create)
      if (updated) load(fromPayload(updated.payload), { id: updated.id })
      else setDirty(false)
      return updated?.id || null
    }
    const created = await invoices.create(invoice, invoice.customer.name || invoice.meta.invoice_number)
    if (created) {
      // the store issues the document number, so pull the saved payload back in
      load(fromPayload(created.payload), { id: created.id })
      return created.id
    }
    return null
  }, [doc.recordId, invoice, invoices, load, setDirty])

  const onOpen = useCallback(
    async (id) => {
      const record = await invoices.get(id)
      if (record) load(fromPayload(record.payload), { id: record.id })
    },
    [invoices, load],
  )

  const onNew = useCallback(() => {
    doc.clear()
    setField('template_type', 'classic')
  }, [doc, setField])

  const onExportCurrent = useCallback(() => {
    const record = { id: doc.recordId, payload: toPayload(invoice), exported_at: new Date().toISOString() }
    const blob = new Blob([invoiceToFile(record)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoice.meta.invoice_number || 'draft'}.json`.replace(/[^\w.\-]+/g, '_')
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }, [doc.recordId, invoice])

  const onImportPayload = useCallback(
    (payload) => {
      load(fromPayload(payload))
    },
    [load],
  )

  const sheet = useMemo(() => {
    if (invoice.template_type === 'classic') return <ClassicSheet doc={doc} />
    return <StandardSheet doc={doc} variant={invoice.template_type} />
  }, [doc, invoice.template_type])

  return (
    <div className={`min-h-full tpl-${invoice.template_type}`}>
      <Toolbar
        doc={doc}
        pdf={pdf}
        onSave={onSave}
        onExportCurrent={onExportCurrent}
        onImportPayload={onImportPayload}
      />

      <main className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 py-5 lg:flex-row">
        <Sidebar
          invoices={{ ...invoices, exportAllData: () => invoices.exportAllPayloadRef }}
          doc={doc}
          onOpen={onOpen}
          onDelete={invoices.remove}
          onDuplicate={async (id) => {
            const copy = await invoices.duplicate(id)
            if (copy) load(fromPayload(copy.payload), { id: copy.id })
          }}
          onNew={onNew}
          onExportAll={() => {}}
          onImportAll={invoices.importAll}
          onClearAll={invoices.clearAll}
        />

        <section className="min-w-0 flex-1">
          <div className="paper sheet mx-auto w-full max-w-[840px] rounded-lg">{sheet}</div>
          <p className="no-print mx-auto mt-3 max-w-[840px] text-[11.5px] text-slate-400">
            Everything on the sheet is editable — click any label or value to change it. Download or print produces the
            PDF from the same data.
          </p>
        </section>
      </main>
    </div>
  )
}
