/**
 * Calculation engine — a 1:1 port of `CreateInvoiceUtil` from the original
 * invoicegenerator.js, with the jQuery DOM reads replaced by plain objects.
 *
 * Original quirks deliberately preserved:
 *  - an unparsable quantity counts as 1, an unparsable rate as 0
 *  - every intermediate value is rounded with toFixed(2) before it is summed
 *  - tax rows are grouped by the label `${taxLabel} (${percent}%)`
 */

const round2 = (n) => Number(n).toFixed(2)

export function normaliseItem(item) {
  const rawQty = item.quantity
  const rawRate = item.rate
  const qty = rawQty === '' || rawQty === null || rawQty === undefined || Number.isNaN(Number(rawQty))
    ? 1
    : Number(rawQty)
  const rate = rawRate === '' || rawRate === null || rawRate === undefined || Number.isNaN(Number(rawRate))
    ? 0
    : Number(rawRate)
  const tax = Number(item.tax) || 0
  return { ...item, quantity: qty, rate, tax }
}

/** `calculateItemTotal`: qty × rate, plus the per-line tax amount. */
export function calcItem(item) {
  const { quantity, rate, tax } = normaliseItem(item)
  const amount = round2(quantity * rate)
  const taxAmount = tax ? round2(Number(amount) * tax / 100) : '0.00'
  return { amount: Number(amount), taxAmount: Number(taxAmount), quantity, rate, tax }
}

/** `calculateInvoiceTotal`: plain sum of the line amounts. */
export function calcSubTotal(items) {
  const sum = items.reduce((acc, item) => {
    const { amount } = calcItem(item)
    return Number.isNaN(amount) ? acc : acc + amount
  }, 0)
  return Number(round2(sum))
}

/**
 * `calculateTaxAndTotal` + `calculateTaxSummary`: group by tax label and keep a
 * taxable value per group so the summary block can print taxable/tax/total.
 */
export function calcTaxSummary(items, taxLabel = 'VAT') {
  const groups = []
  for (const item of items) {
    const { amount, taxAmount, tax } = calcItem(item)
    if (!taxAmount) continue
    const label = `${taxLabel} (${tax}%)`
    const found = groups.find((g) => g.label === label)
    if (found) {
      found.tax_amount = Number(round2(found.tax_amount + taxAmount))
      found.taxable_value = Number(round2(found.taxable_value + amount))
    } else {
      groups.push({
        label,
        tax_amount: taxAmount,
        taxable_value: amount,
        tax_percent: tax,
      })
    }
  }
  return groups
}

/** Full totals object used by the sheet, the summary block and the PDF. */
export function calcTotals(invoice) {
  const items = invoice.line_items || []
  const subTotal = calcSubTotal(items)
  const taxes = calcTaxSummary(items, invoice.tax_label || 'VAT')
  const total = Number(round2(subTotal + taxes.reduce((a, t) => a + Number(t.tax_amount), 0)))
  const totalTax = Number(round2(taxes.reduce((a, t) => a + Number(t.tax_amount), 0)))
  return { subTotal, taxes, total, totalTax }
}

/** Formatting helpers used by both the on-screen sheet and the PDF builder. */
export function formatTotals(totals, currencyCode, edition = 'global') {
  const fmt = (n) => new Intl.NumberFormat(
    ['AUD', 'CAD', 'USD', 'INR'].includes(currencyCode) || ['au', 'ca', 'us', 'in'].includes(edition)
      ? 'en-US'
      : 'de-DE',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  ).format(Number(n) || 0)
  return {
    ...totals,
    subTotalText: fmt(totals.subTotal),
    totalText: fmt(totals.total),
    totalTaxText: fmt(totals.totalTax),
    taxes: totals.taxes.map((t) => ({ ...t, amountText: fmt(t.tax_amount) })),
  }
}
