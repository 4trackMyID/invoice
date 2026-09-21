import { useMemo } from 'react'
import { ClassicSheet } from '../components/ClassicSheet.jsx'
import { StandardSheet } from '../components/StandardSheet.jsx'
import { PrintModeProvider } from '../components/SheetField.jsx'
import { calcTotals, formatTotals } from '../lib/calc.js'
import { THEMES, fromPayload, usedLineItems } from '../lib/invoice.js'
import { amountInWords } from '../lib/words.js'

/** No-ops: a document is read-only, so the sheet's edit handlers are inert. */
const noop = () => {}

/**
 * The invoice as a *document*: the same sheet components the editor renders, with
 * the print provider on. This is deliberately the only PDF layout in the app —
 * one sheet, one stylesheet, so what the office sees is what the client receives.
 */
export function PrintDocument({ payload }) {
  const invoice = useMemo(() => {
    const next = fromPayload(payload)
    // Blank line-item rows are editor scaffolding: on screen they are placeholders
    // waiting to be typed into, on a document they would print as an empty row.
    // A payload with no filled row keeps one, so the table still has its shape.
    const filled = usedLineItems(next)
    return { ...next, line_items: filled.length ? filled : next.line_items.slice(0, 1) }
  }, [payload])

  const totals = useMemo(() => formatTotals(calcTotals(invoice), invoice.currency_code), [invoice])
  const totalInWords = useMemo(
    () => amountInWords(totals.total, invoice.currency_code),
    [totals.total, invoice.currency_code],
  )

  const accent = THEMES.find((t) => t.key === invoice.theme)?.accent || '#408dfb'
  const doc = {
    invoice,
    setField: noop,
    updateSection: noop,
    setLabel: noop,
    setPaymentDetail: noop,
    itemChange: noop,
    itemAdd: noop,
    itemRemove: noop,
    totals,
    totalInWords,
    issues: {},
  }

  return (
    <div className={`tpl-${invoice.template_type}`} style={{ '--accent': accent }}>
      <div className="paper sheet">
        <PrintModeProvider>
          {invoice.template_type === 'classic' ? (
            <ClassicSheet doc={doc} />
          ) : (
            <StandardSheet doc={doc} variant={invoice.template_type} />
          )}
        </PrintModeProvider>
      </div>
    </div>
  )
}
