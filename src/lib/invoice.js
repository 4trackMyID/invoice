import { isoDateOffset } from './format.js'

export const LANGUAGES = [
  { code: 'en-us', label: 'English (US)' },
  { code: 'en-gb', label: 'English (UK)' },
  { code: 'de-de', label: 'Deutsch' },
  { code: 'es-es', label: 'Español' },
  { code: 'fr-fr', label: 'Français' },
  { code: 'id-id', label: 'Bahasa Indonesia' },
]

/**
 * Four templates. `classic` reproduces the Haputra-style letterhead invoice:
 * brand block, labelled meta stack, Bill To / Project, ruled item table with an
 * optional Milestone column, boxed totals with the amount in words, then
 * Payment Terms, Payment Details and Notes blocks.
 */
export const TEMPLATES = [
  {
    key: 'classic',
    thumb: 'classic-thumb',
    name: 'Classic (Letterhead)',
    hint: 'Brand header, labelled meta, boxed totals, payment details block.',
  },
  { key: 'standard', thumb: 'standard-thumb', name: 'Standard', hint: 'Classic header, totals on the right.' },
  { key: 'excel', thumb: 'spreadsheet-thumb', name: 'Spreadsheet', hint: 'Grid look, ruled columns.' },
  { key: 'compact', thumb: 'compact-thumb', name: 'Compact', hint: 'Dense layout, small type.' },
]

export const THEMES = [
  { key: 'blue', label: 'Blue', accent: '#408dfb' },
  { key: 'slate', label: 'Slate', accent: '#334155' },
  { key: 'teal', label: 'Teal', accent: '#0d9488' },
  { key: 'green', label: 'Green', accent: '#16a34a' },
  { key: 'red', label: 'Red', accent: '#dc2626' },
  { key: 'violet', label: 'Violet', accent: '#7c3aed' },
]

export const DEFAULT_LABELS = {
  title: 'INVOICE',
  bill_to_label: 'Bill To',
  project_label: 'Project',
  invoice_number_label: 'Invoice No.',
  invoice_date_label: 'Invoice Date',
  due_date_label: 'Due Date',
  sub_total_label: 'Subtotal',
  total_label: 'TOTAL DUE',
  amount_in_words_label: 'In words',
  notes_label: 'Notes',
  terms_label: 'Terms & Conditions',
  payment_terms_label: 'Payment Terms',
  payment_details_label: 'Payment Details',
  item_header: {
    name: 'Description',
    milestone: 'Milestone',
    quantity: 'Qty',
    rate: 'Rate',
    tax: 'Tax %',
    amount: 'Amount',
  },
}

export const DEFAULT_TAX_LABEL = 'VAT'

function starterRow() {
  return { name: '', milestone: '', quantity: '1', rate: '', tax: '' }
}

export function emptyLineItem() {
  return starterRow()
}

export function emptyInvoice() {
  return {
    language: 'en-us',
    title: DEFAULT_LABELS.title,
    template_type: 'classic',
    theme: 'blue',
    logo: null,
    company: {
      name: '',
      tagline: '',
      user_name: '',
      address_1: '',
      address_2: '',
      country: '',
      tax_reg_no: '',
      email: '',
      phone: '',
      website: '',
    },
    customer: {
      bill_to_label: DEFAULT_LABELS.bill_to_label,
      name: '',
      attn: '',
      address_1: '',
      address_2: '',
      country: '',
      tax_reg_no: '',
      email: '',
    },
    project: {
      label: DEFAULT_LABELS.project_label,
      title: '',
      description: '',
    },
    meta: {
      invoice_number_label: DEFAULT_LABELS.invoice_number_label,
      invoice_number: '',
      invoice_date_label: DEFAULT_LABELS.invoice_date_label,
      invoice_date: isoDateOffset(0),
      due_date_label: DEFAULT_LABELS.due_date_label,
      due_date: isoDateOffset(14),
      payment_terms: 'Net 14 days',
    },
    item_header: { ...DEFAULT_LABELS.item_header },
    show_milestone: true,
    line_items: [starterRow(), starterRow(), starterRow()],
    tax_label: DEFAULT_TAX_LABEL,
    show_tax_summary: true,
    currency_code: 'USD',
    currency_symbol: '$',
    labels: {
      sub_total_label: DEFAULT_LABELS.sub_total_label,
      total_label: DEFAULT_LABELS.total_label,
      amount_in_words_label: DEFAULT_LABELS.amount_in_words_label,
      notes_label: DEFAULT_LABELS.notes_label,
      terms_label: DEFAULT_LABELS.terms_label,
      payment_terms_label: DEFAULT_LABELS.payment_terms_label,
      payment_details_label: DEFAULT_LABELS.payment_details_label,
    },
    show_amount_in_words: true,
    payment_details: {
      bank_name: '',
      account_number: '',
      account_name: '',
      swift: '',
      bank_address: '',
    },
    notes: '',
    terms: '',
  }
}

/** Drop rows the user never filled in — mirrors `removeEmptyLineItems`. */
export function usedLineItems(invoice) {
  return (invoice.line_items || []).filter((i) => (i.name || '').trim() !== '')
}

/**
 * Serialise to the payload shape the PDF endpoint receives, keeping the
 * original generator's flat key names (so the wire contract stays recognisable).
 */
export function toPayload(invoice) {
  const items = usedLineItems(invoice)
  return {
    language: invoice.language,
    title: invoice.title,
    template_type: invoice.template_type,
    theme: invoice.theme,
    item_table_color: '000',

    company_name: invoice.company.name,
    company_tagline: invoice.company.tagline,
    user_name: invoice.company.user_name,
    company_address_1: invoice.company.address_1,
    company_address_2: invoice.company.address_2,
    company_country: invoice.company.country,
    company_tax_reg_no: invoice.company.tax_reg_no,
    company_email: invoice.company.email,
    company_phone: invoice.company.phone,
    company_website: invoice.company.website,

    bill_to_label: invoice.customer.bill_to_label,
    customer_name: invoice.customer.name,
    customer_attn: invoice.customer.attn,
    customer_billing_address_1: invoice.customer.address_1,
    customer_billing_address_2: invoice.customer.address_2,
    customer_billing_country: invoice.customer.country,
    customer_tax_reg_no: invoice.customer.tax_reg_no,
    customer_email: invoice.customer.email,

    project_label: invoice.project.label,
    project_title: invoice.project.title,
    project_description: invoice.project.description,

    invoice_number_label: invoice.meta.invoice_number_label,
    invoice_number: invoice.meta.invoice_number,
    invoice_date_label: invoice.meta.invoice_date_label,
    invoice_date: invoice.meta.invoice_date,
    due_date_label: invoice.meta.due_date_label,
    due_date: invoice.meta.due_date,
    payment_terms: invoice.meta.payment_terms,

    item_table_header: {
      name: invoice.item_header.name,
      milestone: invoice.item_header.milestone,
      quantity: invoice.item_header.quantity,
      rate: invoice.item_header.rate,
      tax1_name: invoice.item_header.tax,
      amount: invoice.item_header.amount,
    },
    // legacy alias, kept so older payloads keep rendering
    line_items_header: {
      name: invoice.item_header.name,
      milestone: invoice.item_header.milestone,
      quantity: invoice.item_header.quantity,
      rate: invoice.item_header.rate,
      tax1_name: invoice.item_header.tax,
      amount: invoice.item_header.amount,
    },
    line_items: items.map((i) => ({
      name: i.name,
      milestone: i.milestone,
      quantity: i.quantity,
      rate: i.rate,
      tax1: i.tax,
    })),

    show_milestone: invoice.show_milestone,
    tax_label: invoice.tax_label,
    show_tax_summary: invoice.show_tax_summary,
    currency_code: invoice.currency_code,
    currency_symbol: invoice.currency_symbol,

    sub_total_label: invoice.labels.sub_total_label,
    total_label: invoice.labels.total_label,
    amount_in_words_label: invoice.labels.amount_in_words_label,
    notes_label: invoice.labels.notes_label,
    terms_and_conditions_label: invoice.labels.terms_label,
    payment_terms_label: invoice.labels.payment_terms_label,
    payment_details_label: invoice.labels.payment_details_label,
    show_amount_in_words: invoice.show_amount_in_words,

    bank_name: invoice.payment_details.bank_name,
    bank_account_number: invoice.payment_details.account_number,
    bank_account_name: invoice.payment_details.account_name,
    bank_swift: invoice.payment_details.swift,
    bank_address: invoice.payment_details.bank_address,

    notes: invoice.notes,
    terms_and_conditions: invoice.terms,
    // the PDF endpoint reads the logo from the payload when no file part is sent
    logo: invoice.logo ?? null,
    has_logo: Boolean(invoice.logo),
  }
}

/** Inverse of toPayload — used by the importer and by every stored record. */
export function fromPayload(payload) {
  const base = emptyInvoice()
  if (!payload || typeof payload !== 'object') return base
  const items = (payload.line_items || []).length
    ? payload.line_items.map((i) => ({
        name: i.name ?? '',
        milestone: i.milestone ?? '',
        quantity: i.quantity ?? '1',
        rate: i.rate ?? '',
        tax: i.tax1 ?? i.tax ?? '',
      }))
    : base.line_items

  return {
    ...base,
    language: payload.language || base.language,
    title: payload.title ?? base.title,
    template_type: payload.template_type || base.template_type,
    theme: payload.theme || base.theme,
    company: {
      name: payload.company_name ?? '',
      tagline: payload.company_tagline ?? '',
      user_name: payload.user_name ?? '',
      address_1: payload.company_address_1 ?? '',
      address_2: payload.company_address_2 ?? '',
      country: payload.company_country ?? '',
      tax_reg_no: payload.company_tax_reg_no ?? '',
      email: payload.company_email ?? '',
      phone: payload.company_phone ?? '',
      website: payload.company_website ?? '',
    },
    customer: {
      bill_to_label: payload.bill_to_label ?? base.customer.bill_to_label,
      name: payload.customer_name ?? '',
      attn: payload.customer_attn ?? '',
      address_1: payload.customer_billing_address_1 ?? '',
      address_2: payload.customer_billing_address_2 ?? '',
      country: payload.customer_billing_country ?? '',
      tax_reg_no: payload.customer_tax_reg_no ?? '',
      email: payload.customer_email ?? '',
    },
    project: {
      label: payload.project_label ?? base.project.label,
      title: payload.project_title ?? '',
      description: payload.project_description ?? '',
    },
    meta: {
      invoice_number_label: payload.invoice_number_label ?? base.meta.invoice_number_label,
      invoice_number: payload.invoice_number ?? '',
      invoice_date_label: payload.invoice_date_label ?? base.meta.invoice_date_label,
      invoice_date: payload.invoice_date || base.meta.invoice_date,
      due_date_label: payload.due_date_label ?? base.meta.due_date_label,
      due_date: payload.due_date || base.meta.due_date,
      payment_terms: payload.payment_terms ?? base.meta.payment_terms,
    },
    item_header: { ...base.item_header, ...(payload.item_table_header || payload.line_items_header || {}) },
    show_milestone: payload.show_milestone ?? base.show_milestone,
    line_items: items,
    tax_label: payload.tax_label || base.tax_label,
    show_tax_summary: payload.show_tax_summary ?? base.show_tax_summary,
    currency_code: payload.currency_code || base.currency_code,
    currency_symbol: payload.currency_symbol || base.currency_symbol,
    labels: {
      sub_total_label: payload.sub_total_label || base.labels.sub_total_label,
      total_label: payload.total_label || base.labels.total_label,
      amount_in_words_label: payload.amount_in_words_label || base.labels.amount_in_words_label,
      notes_label: payload.notes_label || base.labels.notes_label,
      terms_label: payload.terms_and_conditions_label || base.labels.terms_label,
      payment_terms_label: payload.payment_terms_label || base.labels.payment_terms_label,
      payment_details_label: payload.payment_details_label || base.labels.payment_details_label,
    },
    show_amount_in_words: payload.show_amount_in_words ?? base.show_amount_in_words,
    payment_details: {
      bank_name: payload.bank_name ?? '',
      account_number: payload.bank_account_number ?? '',
      account_name: payload.bank_account_name ?? '',
      swift: payload.bank_swift ?? '',
      bank_address: payload.bank_address ?? '',
    },
    notes: payload.notes ?? '',
    terms: payload.terms_and_conditions ?? '',
    logo: payload.logo ?? null,
  }
}

/** Client-side validation mirroring the original `validateForm`. */
export function validate(invoice) {
  const errors = {}
  if (!invoice.company.name.trim()) errors.company_name = "Please fill in your company's name"
  if (!invoice.customer.name.trim()) errors.customer_name = "Please fill in your client's name or company name"
  if (!usedLineItems(invoice).length) errors.line_items = 'Add at least one line item'
  return errors
}

export const draft = {
  key: 'invoice-generator:draft:v2',
  load() {
    try {
      const raw = window.localStorage.getItem(this.key)
      return raw ? fromPayload(JSON.parse(raw)) : null
    } catch {
      return null
    }
  },
  save(invoice) {
    try {
      // store the portable payload shape, not the in-memory shape, so the draft
      // round-trips through fromPayload() and stays importable/exportable
      window.localStorage.setItem(this.key, JSON.stringify(toPayload(invoice)))
      return true
    } catch {
      return false
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(this.key)
    } catch {
      /* storage unavailable — nothing to clear */
    }
  },
}
