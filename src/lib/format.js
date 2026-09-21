/**
 * Number / date formatting rules lifted from the original bundle
 * (`CreateInvoiceUtil.amountFormatted` + `isGermanEdition` branches).
 */

const EN_US_CURRENCIES = ['USD', 'AUD', 'CAD', 'INR']
const DE_DE_CURRENCIES = ['EUR']

/** Format a numeric amount the way the original does, without the symbol. */
export function formatAmount(value, currencyCode = 'USD', edition = 'global') {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0.00'
  const useEnUs = ['au', 'ca', 'us', 'in'].includes(edition) || EN_US_CURRENCIES.includes(currencyCode)
  const useDeDe = edition === 'uk' || DE_DE_CURRENCIES.includes(currencyCode)
  if (useEnUs) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(n)
  }
  if (useDeDe) {
    return new Intl.NumberFormat('de-DE', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(n)
  }
  return n.toFixed(2)
}

/** Money for the sheet / PDF: symbol in front, thin space, formatted figure. */
export function formatMoney(value, currencyCode = 'USD', symbol = '', edition = 'global') {
  return `${symbol}${formatAmount(value, currencyCode, edition)}`
}

export function formatCurrencySymbol(value, fallback = '$') {
  return value && value.trim() ? value.trim() : fallback
}

/** dd/mm/yyyy like the original date fields (which used a jquery datepicker). */
export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  const p = (x) => String(x).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** Today + n days as an <input type=date> value. */
export function isoDateOffset(days = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
