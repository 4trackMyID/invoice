import { OptionalBlock, SheetInput, SheetTextarea } from './SheetField.jsx'
import { LogoPicker } from './LogoPicker.jsx'
import { formatAmount, formatDate } from '../lib/format.js'

/**
 * Config-driven sheet for the other three template keys from the original
 * generator (`standard`, `excel`, `compact`) — same document, different chrome.
 */
const VARIANTS = {
  standard: { grid: false, fillHeader: false, dense: false, titleSize: 20, showFooterBlocks: true },
  excel: { grid: true, fillHeader: true, dense: false, titleSize: 18, showFooterBlocks: true },
  compact: { grid: false, fillHeader: false, dense: true, titleSize: 15, showFooterBlocks: false },
}

export function StandardSheet({ doc, variant = 'standard' }) {
  const cfg = VARIANTS[variant] || VARIANTS.standard
  const {
    invoice, setField, updateSection, setLabel, setPaymentDetail, totals, totalInWords, issues,
    itemChange, itemAdd, itemRemove,
  } = doc
  const money = (n) => `${invoice.currency_symbol}${formatAmount(n, invoice.currency_code)}`
  const bad = (k) => Boolean(issues[k])
  const cell = cfg.grid ? 'border border-slate-200 px-2' : ''

  return (
    <div className={`p-8 text-slate-800 sm:p-10 ${cfg.dense ? 'text-[11px]' : 'text-[12.5px]'}`}>
      <div className="sheet-head flex flex-wrap items-start justify-between gap-4 pb-4" style={{ borderColor: 'var(--accent)' }}>
        <div className="flex gap-4">
          <LogoPicker logo={invoice.logo} onChange={(v) => setField('logo', v)} />
          <div>
            <SheetInput
              value={invoice.company.name}
              onChange={(v) => updateSection('company', { name: v })}
              placeholder="Your Company"
              error={bad('company_name')}
              className="font-extrabold tracking-tight"
              style={{ fontSize: cfg.titleSize }}
            />
            <SheetInput
              value={invoice.company.address_1}
              onChange={(v) => updateSection('company', { address_1: v })}
              placeholder="Street address"
              className="text-[11px] text-slate-500"
            />
            <SheetInput
              value={invoice.company.address_2}
              onChange={(v) => updateSection('company', { address_2: v })}
              placeholder="City, Country / Tax ID"
              className="text-[11px] text-slate-500"
            />
          </div>
        </div>
        <div className="min-w-[210px] text-right">
          <SheetInput
            value={invoice.title}
            onChange={(v) => setField('title', v)}
            className="text-right font-extrabold tracking-[0.08em]"
            style={{ fontSize: cfg.titleSize }}
          />
          <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
            <div className="flex justify-end gap-2">
              <SheetInput
                value={invoice.meta.invoice_number_label}
                onChange={(v) => updateSection('meta', { invoice_number_label: v })}
                className="max-w-[110px] text-right"
              />
              <SheetInput
                value={invoice.meta.invoice_number}
                onChange={(v) => updateSection('meta', { invoice_number: v })}
                placeholder="INV-001"
                className="max-w-[120px] text-right font-semibold text-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2">
              <SheetInput
                value={invoice.meta.invoice_date_label}
                onChange={(v) => updateSection('meta', { invoice_date_label: v })}
                className="max-w-[110px] text-right"
              />
              <span className="w-[120px] text-right font-semibold text-slate-800">
                {formatDate(invoice.meta.invoice_date)}
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <SheetInput
                value={invoice.meta.due_date_label}
                onChange={(v) => updateSection('meta', { due_date_label: v })}
                className="max-w-[110px] text-right"
              />
              <span className="w-[120px] text-right font-semibold text-slate-800">
                {formatDate(invoice.meta.due_date)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <SheetInput
            value={invoice.customer.bill_to_label}
            onChange={(v) => updateSection('customer', { bill_to_label: v })}
            className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"
          />
          <SheetInput
            value={invoice.customer.name}
            onChange={(v) => updateSection('customer', { name: v })}
            placeholder="Client name"
            error={bad('customer_name')}
            className="text-[13.5px] font-bold"
          />
          <SheetInput
            value={invoice.customer.address_1}
            onChange={(v) => updateSection('customer', { address_1: v })}
            placeholder="Billing address"
            className="text-[11px] text-slate-500"
          />
          <SheetInput
            value={invoice.customer.address_2}
            onChange={(v) => updateSection('customer', { address_2: v })}
            placeholder="City, Country / Tax ID"
            className="text-[11px] text-slate-500"
          />
          <SheetInput
            value={invoice.customer.email}
            onChange={(v) => updateSection('customer', { email: v })}
            placeholder="billing email"
            className="text-[11px] text-slate-500"
          />
        </div>
        <div className="sm:text-right">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Ship / project</div>
          <SheetInput
            value={invoice.project.title}
            onChange={(v) => updateSection('project', { title: v })}
            placeholder="Project reference"
            className="text-[12px] font-semibold sm:text-right"
          />
          <SheetTextarea
            value={invoice.project.description}
            onChange={(v) => updateSection('project', { description: v })}
            placeholder="Scope notes"
            rows={2}
            className="text-[11px] text-slate-500"
          />
        </div>
      </div>

      <table className={`items mt-6 w-full ${cfg.dense ? 'text-[10.5px]' : 'text-[11.5px]'}`}>
        <thead>
          <tr
            className={cfg.fillHeader ? 'text-white' : 'border-b border-slate-300 text-slate-500'}
            style={cfg.fillHeader ? { background: 'var(--accent)' } : undefined}
          >
            <th className={`py-2 text-left font-bold ${cell}`}>
              <SheetInput
                value={invoice.item_header.name}
                onChange={(v) => updateSection('item_header', { name: v })}
                className={cfg.fillHeader ? 'text-white' : ''}
              />
            </th>
            {invoice.show_milestone && (
              <th className={`py-2 text-center font-bold ${cell}`}>
                <SheetInput
                  value={invoice.item_header.milestone}
                  onChange={(v) => updateSection('item_header', { milestone: v })}
                  className={cfg.fillHeader ? 'text-center text-white' : 'text-center'}
                />
              </th>
            )}
            <th className={`py-2 text-right font-bold ${cell}`}>
              <SheetInput
                value={invoice.item_header.quantity}
                onChange={(v) => updateSection('item_header', { quantity: v })}
                className={`num-input ${cfg.fillHeader ? 'text-white' : ''}`}
              />
            </th>
            <th className={`py-2 text-right font-bold ${cell}`}>
              <SheetInput
                value={invoice.item_header.rate}
                onChange={(v) => updateSection('item_header', { rate: v })}
                className={`num-input ${cfg.fillHeader ? 'text-white' : ''}`}
              />
            </th>
            <th className={`py-2 text-right font-bold ${cell}`}>
              <SheetInput
                value={invoice.item_header.amount}
                onChange={(v) => updateSection('item_header', { amount: v })}
                className={`num-input ${cfg.fillHeader ? 'text-white' : ''}`}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.line_items.map((item, index) => {
            const amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0)
            const isLast = index === invoice.line_items.length - 1
            return (
              <tr key={index} className="border-b border-slate-200 align-top">
                <td className={`py-1 ${cell}`}>
                  <SheetTextarea
                    value={item.name}
                    onChange={(v) => itemChange(index, 'name', v)}
                    onKeyDown={(e) => {
                      if (isLast && e.key.length === 1) onItemAdd()
                    }}
                    placeholder="Item or service"
                    rows={1}
                    className="min-h-[26px]"
                  />
                </td>
                {invoice.show_milestone && (
                  <td className={`py-1 ${cell}`}>
                    <SheetInput
                      value={item.milestone}
                      onChange={(v) => itemChange(index, 'milestone', v)}
                      className="text-center"
                    />
                  </td>
                )}
                <td className={`py-1 ${cell}`}>
                  <SheetInput value={item.quantity} onChange={(v) => itemChange(index, 'quantity', v)} className="num-input" />
                </td>
                <td className={`py-1 ${cell}`}>
                  <SheetInput value={item.rate} onChange={(v) => itemChange(index, 'rate', v)} className="num-input" />
                </td>
                <td className={`py-2 pr-1 text-right tabular-nums ${cell}`}>
                  {formatAmount(amount, invoice.currency_code)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="no-print mt-2 flex items-center gap-3 text-[11px]">
        <button type="button" className="text-slate-500 underline decoration-dotted" onClick={itemAdd}>
          + Add line item
        </button>
        {invoice.line_items.length > 1 && (
          <button type="button" className="text-slate-500 underline decoration-dotted" onClick={() => itemRemove(invoice.line_items.length - 1)}>
            − Remove last
          </button>
        )}
        {issues.line_items && <span className="text-rose-600">{issues.line_items}</span>}
      </div>

      <div className="sheet-summary mt-5 flex justify-end">
        <div className="w-full max-w-[300px]">
          <div className="flex justify-between py-1">
            <SheetInput
              value={invoice.labels.sub_total_label}
              onChange={(v) => setLabel('sub_total_label', v)}
              className="text-[11px] text-slate-600"
            />
            <span className="text-right text-[11.5px] tabular-nums">{money(totals.subTotal)}</span>
          </div>
          {invoice.show_tax_summary &&
            totals.taxes.map((t, i) => (
              <div key={i} className="flex justify-between py-1 text-slate-500">
                <span className="text-[11px]">{t.label}</span>
                <span className="text-right text-[11.5px] tabular-nums">{money(t.tax_amount)}</span>
              </div>
            ))}
          <div className="mt-1 flex justify-between border-t-2 pt-2" style={{ borderColor: 'var(--accent)' }}>
            <SheetInput
              value={invoice.labels.total_label}
              onChange={(v) => setLabel('total_label', v)}
              className="text-[11px] font-extrabold uppercase tracking-wide"
            />
            <span className="text-right text-[14px] font-extrabold tabular-nums">{money(totals.total)}</span>
          </div>
          {invoice.show_amount_in_words && (
            <div className="mt-2 text-[10.5px] text-slate-600">
              <span className="font-bold uppercase tracking-wide text-slate-400">
                {invoice.labels.amount_in_words_label}:{' '}
              </span>
              {totalInWords}
            </div>
          )}
        </div>
      </div>

      {cfg.showFooterBlocks && (
        <div className="mt-6 grid gap-5 text-[10.5px] text-slate-600 sm:grid-cols-2">
          {/* same rule as the classic sheet: a heading with no body is editor
              scaffolding on screen, and an unfinished section on the document */}
          <OptionalBlock when={invoice.payment_details}>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Payment</div>
              <div className="space-y-0.5">
                {[
                  ['Bank', 'bank_name'],
                  ['Account', 'account_number'],
                  ['Holder', 'account_name'],
                  ['SWIFT', 'swift'],
                ].map(([label, field]) => (
                  <div key={field} className="flex gap-2">
                    <span className="w-[70px] shrink-0 text-slate-400">{label}:</span>
                    <SheetInput value={invoice.payment_details[field]} onChange={(v) => setPaymentDetail(field, v)} placeholder="—" />
                  </div>
                ))}
              </div>
            </div>
          </OptionalBlock>
          <OptionalBlock when={invoice.notes}>
            <div>
              <SheetInput
                value={invoice.labels.notes_label}
                onChange={(v) => setLabel('notes_label', v)}
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"
              />
              <SheetTextarea value={invoice.notes} onChange={(v) => setField('notes', v)} rows={3} placeholder="Notes" />
            </div>
          </OptionalBlock>
        </div>
      )}
    </div>
  )
}
