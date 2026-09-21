import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calcTotals, formatTotals } from '../lib/calc.js'
import { draft, emptyInvoice, fromPayload, toPayload, usedLineItems, validate } from '../lib/invoice.js'
import { amountInWords } from '../lib/words.js'

/**
 * Invoice document state: client-side only (like the original generator), with a
 * debounced localStorage draft so a reload never loses work.
 */
export function useInvoice() {
  const [invoice, setInvoice] = useState(() => draft.load() || emptyInvoice())
  const [savedAt, setSavedAt] = useState(null)
  const [recordId, setRecordId] = useState(null)
  const [dirty, setDirty] = useState(false)
  const primed = useRef(false)

  useEffect(() => {
    if (!primed.current) {
      primed.current = true
      return undefined
    }
    setDirty(true)
    const id = setTimeout(() => {
      if (draft.save(invoice)) setSavedAt(new Date())
    }, 500)
    return () => clearTimeout(id)
  }, [invoice])

  /** set a top-level field */
  const setField = useCallback((key, value) => {
    setInvoice((prev) => ({ ...prev, [key]: value }))
  }, [])

  /** patch a nested block: company / customer / project / meta / payment_details */
  const updateSection = useCallback((section, patch) => {
    setInvoice((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }))
  }, [])

  const setLabel = useCallback((key, value) => {
    setInvoice((prev) => ({ ...prev, labels: { ...prev.labels, [key]: value } }))
  }, [])

  const setPaymentDetail = useCallback((key, value) => {
    setInvoice((prev) => ({ ...prev, payment_details: { ...prev.payment_details, [key]: value } }))
  }, [])

  const itemChange = useCallback((index, key, value) => {
    setInvoice((prev) => {
      const line_items = prev.line_items.map((it, i) => (i === index ? { ...it, [key]: value } : it))
      return { ...prev, line_items }
    })
  }, [])

  const itemAdd = useCallback(() => {
    setInvoice((prev) => ({ ...prev, line_items: [...prev.line_items, { name: '', milestone: '', quantity: '1', rate: '', tax: '' }] }))
  }, [])

  const itemRemove = useCallback((index) => {
    setInvoice((prev) => {
      if (prev.line_items.length <= 1) return prev
      return { ...prev, line_items: prev.line_items.filter((_, i) => i !== index) }
    })
  }, [])

  const items = useMemo(() => usedLineItems(invoice), [invoice])
  const totals = useMemo(() => formatTotals(calcTotals(invoice), invoice.currency_code), [invoice])
  const totalInWords = useMemo(
    () => amountInWords(totals.total, invoice.currency_code),
    [totals.total, invoice.currency_code],
  )
  const payload = useMemo(
    () => ({ ...toPayload(invoice), amount_in_words: totalInWords }),
    [invoice, totalInWords],
  )
  const issues = useMemo(() => validate(invoice), [invoice])

  const load = useCallback((nextInvoice, { id = null } = {}) => {
    setInvoice(nextInvoice ? fromPayload(toPayload(nextInvoice)) : emptyInvoice())
    setRecordId(id)
    setDirty(false)
  }, [])

  const clear = useCallback(() => {
    draft.clear()
    setInvoice(emptyInvoice())
    setRecordId(null)
    setDirty(false)
    setSavedAt(null)
  }, [])

  return {
    invoice,
    setField,
    updateSection,
    setLabel,
    setPaymentDetail,
    itemChange,
    itemAdd,
    itemRemove,
    items,
    totals,
    totalInWords,
    payload,
    issues,
    isValid: Object.keys(issues).length === 0,
    savedAt,
    dirty,
    recordId,
    setRecordId,
    setDirty,
    load,
    clear,
  }
}
