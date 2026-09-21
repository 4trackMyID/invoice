/**
 * Invoice store — CRUD over localStorage.
 *
 * Why localStorage and not a SQLite file: this app ships to Vercel, where every
 * serverless invocation gets an ephemeral filesystem, so a local .sqlite file
 * would silently lose data. The store below is an interface, so a remote SQL
 * database can be dropped in later without touching any component:
 *
 *   export const invoices = localStorageStore          // today
 *   export const invoices = createSqlStore(client)     // Turso/libSQL, later
 *
 * Every method is async so a remote implementation stays signature-compatible.
 */
import { fromPayload, toPayload, usedLineItems } from './invoice.js'
import { calcTotals } from './calc.js'

const KEY = 'invoice-generator:invoices:v1'
const SCHEMA = 1

let cache = null

function readAll() {
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : null
    const records = Array.isArray(parsed?.records) ? parsed.records : []
    cache = { schema: SCHEMA, records }
  } catch {
    cache = { schema: SCHEMA, records: [] }
  }
  return cache
}

function writeAll(records) {
  cache = { schema: SCHEMA, records }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache))
    return true
  } catch {
    return false
  }
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `inv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function nextInvoiceNumber(records) {
  const year = new Date().getFullYear()
  const prefix = `INV/${year}/`
  let max = 0
  for (const r of records) {
    const m = new RegExp(`^INV/${year}/(\\d+)$`).exec(r.payload?.invoice_number || '')
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

function summarise(record, { withPayload = false } = {}) {
  const invoice = fromPayload(record.payload)
  const totals = calcTotals(invoice)
  const base = {
    id: record.id,
    name: record.name,
    status: record.status,
    created_at: record.created_at,
    updated_at: record.updated_at,
    invoice_number: invoice.meta.invoice_number,
    customer_name: invoice.customer.name,
    company_name: invoice.company.name,
    currency_code: invoice.currency_code,
    currency_symbol: invoice.currency_symbol,
    total: totals.total,
    line_count: usedLineItems(invoice).length,
    template_type: invoice.template_type,
  }
  return withPayload ? { ...base, payload: record.payload } : base
}

export const localStorageStore = {
  backend: 'localStorage',

  /** CREATE */
  async create(invoice, name) {
    const { records } = readAll()
    const now = new Date().toISOString()
    const payload = toPayload(invoice)
    const record = {
      id: newId(),
      name: name || payload.customer_name || 'Untitled invoice',
      status: 'draft',
      created_at: now,
      updated_at: now,
      payload,
    }
    if (!record.payload.invoice_number) {
      record.payload.invoice_number = nextInvoiceNumber(records)
    }
    writeAll([record, ...records])
    return summarise(record, { withPayload: true })
  },

  /** READ (list) */
  async list({ search = '', status = '' } = {}) {
    const { records } = readAll()
    const needle = search.trim().toLowerCase()
    return records
      .map((r) => summarise(r))
      .filter((r) => (status ? r.status === status : true))
      .filter((r) =>
        needle
          ? [r.name, r.invoice_number, r.customer_name, r.company_name]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(needle))
          : true,
      )
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
  },

  /** READ (one) */
  async get(id) {
    const { records } = readAll()
    const record = records.find((r) => r.id === id)
    return record ? summarise(record, { withPayload: true }) : null
  },

  /** UPDATE */
  async update(id, invoice, patch = {}) {
    const { records } = readAll()
    const index = records.findIndex((r) => r.id === id)
    if (index < 0) return null
    const nextPayload = invoice ? toPayload(invoice) : records[index].payload
    // never lose a document number that was already issued: an update that
    // arrives without one keeps the stored number instead of blanking it
    if (!nextPayload.invoice_number) {
      nextPayload.invoice_number = records[index].payload?.invoice_number || nextInvoiceNumber(records)
    }
    const next = {
      ...records[index],
      ...patch,
      payload: nextPayload,
      updated_at: new Date().toISOString(),
    }
    const copy = [...records]
    copy[index] = next
    writeAll(copy)
    return summarise(next, { withPayload: true })
  },

  /** DUPLICATE — keeps the payload, issues a fresh document number */
  async duplicate(id) {
    const source = await this.get(id)
    if (!source) return null
    const { records } = readAll()
    const payload = { ...source.payload, invoice_number: nextInvoiceNumber(records) }
    return this.create(fromPayload(payload), `${source.name} (copy)`)
  },

  /** DELETE */
  async remove(id) {
    const { records } = readAll()
    const next = records.filter((r) => r.id !== id)
    if (next.length === records.length) return false
    writeAll(next)
    return true
  },

  async clear() {
    writeAll([])
    return true
  },

  /** Bulk export / import — the escape hatch that survives any backend swap. */
  /** Synchronous snapshot, for the "Export all" button. */
  snapshot() {
    const { records } = readAll()
    return { schema: SCHEMA, exported_at: new Date().toISOString(), records }
  },

  async exportAll() {
    const { records } = readAll()
    return { schema: SCHEMA, exported_at: new Date().toISOString(), records }
  },

  async importAll(payload, { merge = true } = {}) {
    const incoming = Array.isArray(payload) ? payload : payload?.records
    if (!Array.isArray(incoming)) return { imported: 0, skipped: 0 }
    const existing = merge ? readAll().records : []
    const seen = new Set(existing.map((r) => r.id))
    let imported = 0
    let skipped = 0
    const merged = [...existing]
    for (const record of incoming) {
      if (!record?.payload || seen.has(record.id)) {
        skipped += 1
        continue
      }
      seen.add(record.id)
      merged.push(record)
      imported += 1
    }
    writeAll(merged)
    return { imported, skipped }
  },

  /** Test/support helper: drop the in-memory cache so storage is re-read. */
  _resetCache() {
    cache = null
  },
}

/** Text export of a single invoice, the "crud → file" path. */
export function invoiceToFile(record) {
  return JSON.stringify({ schema: SCHEMA, records: [record] }, null, 2)
}
