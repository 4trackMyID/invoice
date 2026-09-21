/** Amount in words — powers the "In words" row of the classic template. */

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const SCALES = ['', ' thousand', ' million', ' billion', ' trillion']

const CURRENCY_WORDS = {
  USD: ['dollar', 'cents'],
  AUD: ['dollar', 'cents'],
  CAD: ['dollar', 'cents'],
  SGD: ['dollar', 'cents'],
  HKD: ['dollar', 'cents'],
  NZD: ['dollar', 'cents'],
  EUR: ['euro', 'cents'],
  GBP: ['pound', 'pence'],
  IDR: ['rupiah', 'sen'],
  INR: ['rupee', 'paise'],
  MYR: ['ringgit', 'sen'],
  JPY: ['yen', 'sen'],
  PHP: ['peso', 'centavos'],
  THB: ['baht', 'satang'],
  AED: ['dirham', 'fils'],
  SAR: ['riyal', 'halala'],
}

function chunkToWords(n) {
  if (n < 20) return ONES[n]
  if (n < 100) {
    const t = TENS[Math.floor(n / 10)]
    const o = n % 10
    return o ? `${t}-${ONES[o]}` : t
  }
  const h = `${ONES[Math.floor(n / 100)]} hundred`
  const rest = n % 100
  return rest ? `${h} and ${chunkToWords(rest)}` : h
}

export function numberToWords(value) {
  let n = Math.floor(Math.abs(Number(value) || 0))
  if (n === 0) return 'zero'
  const parts = []
  let scale = 0
  while (n > 0) {
    const chunk = n % 1000
    if (chunk) parts.unshift(`${chunkToWords(chunk)}${SCALES[scale]}`)
    n = Math.floor(n / 1000)
    scale += 1
  }
  return parts.join(' ')
}

const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1)

/** "One thousand two hundred and 50/100 dollars only" */
export function amountInWords(amount, currencyCode = 'USD') {
  const value = Math.abs(Number(amount) || 0)
  const [unit, sub] = CURRENCY_WORDS[currencyCode] || ['', '']
  const whole = Math.floor(value)
  const cents = Math.round((value - whole) * 100)
  const words = `${titleCase(numberToWords(whole))}${unit ? ` ${unit}${whole === 1 ? '' : 's'}` : ''}`
  const fraction = cents ? ` and ${String(cents).padStart(2, '0')}/100${sub ? ` ${sub}` : ''}` : ''
  return `${words}${fraction} only`
}
