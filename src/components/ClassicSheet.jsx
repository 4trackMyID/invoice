import { OptionalBlock, SheetDate, SheetInput, SheetTextarea } from './SheetField.jsx'
import { LogoPicker } from './LogoPicker.jsx'
import { formatAmount } from '../lib/format.js'

/**
 * Classic letterhead invoice — the layout of the reference document:
 * brand block, labelled meta stack, Bill To / Project, ruled item table with an
 * optional Milestone column, summary with the amount in words, then
 * Payment Terms / Payment Details / Notes.
 *
 * Every value on the sheet is editable in place, like the original generator.
 */
export function ClassicSheet({ doc }) {
  const {
    invoice, setField, updateSection, setLabel, setPaymentDetail,
    totals, totalInWords, issues, itemChange, itemAdd, itemRemove,
  } = doc

  const showMilestone = invoice.show_milestone
  const money = (n) => `${invoice.currency_symbol}${formatAmount(n, invoice.currency_code)}`
  const bad = (k) => Boolean(issues[k])

  return (
    <div className="p-8 text-[12.5px] leading-relaxed text-slate-800 sm:p-10">
      <header className="sheet-head pb-4" style={{ borderColor: 'var(--accent)' }}>
        <div className="flex gap-4">
          <LogoPicker logo={invoice.logo} onChange={(v) => setField('logo', v)} />
          <div className="min-w-0 flex-1">
            <SheetInput
              value={invoice.company.name}
              onChange={(v) => updateSection('company', { name: v })}
              placeholder="Your Company"
              error={bad('company_name')}
              className="text-[22px] font-extrabold tracking-tight"
            />
            <SheetInput
              value={invoice.company.tagline}
              onChange={(v) => updateSection('company', { tagline: v })}
              placeholder="Tagline or business description"
              className="text-[11px] text-slate-500"
            />
            <div className="mt-2 grid gap-1 text-[11px] text-slate-500 sm:grid-cols-2">
              <div className="space-y-0.5">
                <SheetInput
                  value={invoice.company.address_1}
                  onChange={(v) => updateSection('company', { address_1: v })}
                  placeholder="Street address, City, Country"
                />
                <SheetInput
                  value={invoice.company.address_2}
                  onChange={(v) => updateSection('company', { address_2: v })}
                  placeholder="Tax ID / NPWP / VAT number"
                />
              </div>
              <div className="space-y-0.5 sm:text-right">
                <SheetInput
                  value={invoice.company.email}
                  onChange={(v) => updateSection('company', { email: v })}
                  placeholder="billing@company.com"
                />
                <div className="flex gap-2 sm:justify-end">
                  <SheetInput
                    value={invoice.company.phone}
                    onChange={(v) => updateSection('company', { phone: v })}
                    placeholder="+62 812 0000 0000"
                  />
                  <SheetInput
                    value={invoice.company.website}
                    onChange={(v) => updateSection('company', { website: v })}
                    placeholder="www.company.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <SheetInput
            value={invoice.title}
            onChange={(v) => setField('title', v)}
            className="text-[26px] font-extrabold tracking-[0.06em]"
          />
          <div className="mt-4 space-y-1">
            <SheetInput
              value={invoice.customer.bill_to_label}
              onChange={(v) => updateSection('customer', { bill_to_label: v })}
              className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"
            />
            <SheetInput
              value={invoice.customer.name}
              onChange={(v) => updateSection('customer', { name: v })}
              placeholder="Client name / legal entity"
              error={bad('customer_name')}
              className="text-[14px] font-bold"
            />
            <SheetInput
              value={invoice.customer.attn}
              onChange={(v) => updateSection('customer', { attn: v })}
              placeholder="Attn: contact person"
            />
            <SheetInput
              value={invoice.customer.address_1}
              onChange={(v) => updateSection('customer', { address_1: v })}
              placeholder="Billing address"
              className="text-slate-500"
            />
            <SheetInput
              value={invoice.customer.address_2}
              onChange={(v) => updateSection('customer', { address_2: v })}
              placeholder="City, State, Country / Tax ID"
              className="text-slate-500"
            />
            <SheetInput
              value={invoice.customer.email}
              onChange={(v) => updateSection('customer', { email: v })}
              placeholder="billing email"
              className="text-slate-500"
            />
          </div>
        </div>

        <dl className="space-y-2 sm:pl-6">
          <MetaRow
            label={invoice.meta.invoice_number_label}
            onLabel={(v) => updateSection('meta', { invoice_number_label: v })}
          >
            <SheetInput
              value={invoice.meta.invoice_number}
              onChange={(v) => updateSection('meta', { invoice_number: v })}
              placeholder="INV/2026/09/001"
              className="text-right font-semibold"
            />
          </MetaRow>
          <MetaRow
            label={invoice.meta.invoice_date_label}
            onLabel={(v) => updateSection('meta', { invoice_date_label: v })}
          >
            <SheetDate
              aria-label="Invoice date"
              className="w-[110px] text-right text-[12px] font-semibold"
              value={invoice.meta.invoice_date}
              onChange={(v) => updateSection('meta', { invoice_date: v })}
            />
          </MetaRow>
          <MetaRow label={invoice.meta.due_date_label} onLabel={(v) => updateSection('meta', { due_date_label: v })}>
            <SheetDate
              aria-label="Due date"
              className="w-[110px] text-right text-[12px] font-semibold"
              value={invoice.meta.due_date}
              onChange={(v) => updateSection('meta', { due_date: v })}
            />
          </MetaRow>
        </dl>
      </div>

      {/* the project label is scaffolding: with no title or scope under it, an
          empty "PROJECT" heading would print on the client's invoice */}
      <OptionalBlock when={[invoice.project.title, invoice.project.description].filter(Boolean)}>
        <div className="mt-6">
          <SheetInput
            value={invoice.project.label}
            onChange={(v) => updateSection('project', { label: v })}
            className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"
          />
          <SheetInput
            value={invoice.project.title}
            onChange={(v) => updateSection('project', { title: v })}
            placeholder="Project or engagement title"
            className="text-[14px] font-bold"
          />
          <SheetTextarea
            value={invoice.project.description}
            onChange={(v) => updateSection('project', { description: v })}
            placeholder="Scope of work, deliverables and duration"
            className="mt-1 text-[11.5px] text-slate-600"
            rows={3}
          />
        </div>
      </OptionalBlock>

      <table className="items mt-6 w-full text-[11.5px]" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: showMilestone ? '41%' : '51%' }} />
          {showMilestone && <col style={{ width: '13%' }} />}
          <col style={{ width: '9%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '14%' }} />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-300 text-[10px] uppercase tracking-wide text-slate-500">
            <th className="py-2 text-center font-bold">No.</th>
            <th className="py-2 text-left font-bold">
              <SheetInput value={invoice.item_header.name} onChange={(v) => updateSection('item_header', { name: v })} />
            </th>
            {showMilestone && (
              <th className="py-2 text-center font-bold">
                <SheetInput
                  value={invoice.item_header.milestone}
                  onChange={(v) => updateSection('item_header', { milestone: v })}
                />
              </th>
            )}
            <th className="py-2 text-right font-bold">
              <SheetInput
                value={invoice.item_header.quantity}
                onChange={(v) => updateSection('item_header', { quantity: v })}
                className="num-input"
              />
            </th>
            <th className="py-2 text-right font-bold">
              <SheetInput
                value={invoice.item_header.rate}
                onChange={(v) => updateSection('item_header', { rate: v })}
                className="num-input"
              />
            </th>
            <th className="py-2 text-right font-bold">
              <SheetInput
                value={invoice.item_header.tax}
                onChange={(v) => updateSection('item_header', { tax: v })}
                className="num-input"
              />
            </th>
            <th className="py-2 text-right font-bold">
              <SheetInput
                value={invoice.item_header.amount}
                onChange={(v) => updateSection('item_header', { amount: v })}
                className="num-input"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.line_items.map((item, index) => {
            const amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0)
            const isLast = index === invoice.line_items.length - 1
            return (
              <tr key={index} className="border-b border-slate-300/70 align-top">
                <td className="py-2 text-center text-slate-500">{index + 1}</td>
                <td className="py-1">
                  <SheetTextarea
                    value={item.name}
                    onChange={(v) => itemChange(index, 'name', v)}
                    onKeyDown={(e) => {
                      if (isLast && e.key.length === 1) onItemAdd()
                    }}
                    placeholder="Description of the item or service"
                    rows={2}
                    className="min-h-[38px]"
                  />
                </td>
                {showMilestone && (
                  <td className="py-1">
                    <SheetInput
                      value={item.milestone}
                      onChange={(v) => itemChange(index, 'milestone', v)}
                      placeholder="Milestone"
                      className="text-center"
                    />
                  </td>
                )}
                <td className="py-1">
                  <SheetInput
                    value={item.quantity}
                    onChange={(v) => itemChange(index, 'quantity', v)}
                    className="num-input"
                    inputMode="decimal"
                  />
                </td>
                <td className="py-1">
                  <SheetInput
                    value={item.rate}
                    onChange={(v) => itemChange(index, 'rate', v)}
                    className="num-input"
                    inputMode="decimal"
                  />
                </td>
                <td className="py-1">
                  <SheetInput
                    value={item.tax}
                    onChange={(v) => itemChange(index, 'tax', v)}
                    className="num-input"
                    inputMode="decimal"
                    placeholder="0"
                  />
                </td>
                <td className="py-2 pr-1 text-right font-medium tabular-nums">
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
          <button
            type="button"
            className="text-slate-500 underline decoration-dotted"
            onClick={() => itemRemove(invoice.line_items.length - 1)}
          >
            − Remove last
          </button>
        )}
        {issues.line_items && <span className="text-rose-600">{issues.line_items}</span>}
      </div>

      <div className="sheet-summary mt-6 flex justify-end">
        <div className="w-full max-w-[320px] border-t-2 pt-3" style={{ borderColor: 'var(--accent)' }}>
          <SummaryRow label={invoice.labels.sub_total_label} onLabel={(v) => setLabel('sub_total_label', v)} value={money(totals.subTotal)} />
          {invoice.show_tax_summary &&
            totals.taxes.map((t, i) => <SummaryRow key={i} label={t.label} value={money(t.tax_amount)} muted />)}
          <SummaryRow
            label={invoice.labels.total_label}
            onLabel={(v) => setLabel('total_label', v)}
            value={money(totals.total)}
            strong
          />
          {invoice.show_amount_in_words && (
            <div className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
              <span className="font-bold uppercase tracking-wide text-slate-400">
                {invoice.labels.amount_in_words_label}:{' '}
              </span>
              {totalInWords}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-5 text-[11px] text-slate-600 sm:grid-cols-2">
        <OptionalBlock when={invoice.meta.payment_terms}>
          <div>
            <SheetInput
              value={invoice.labels.payment_terms_label}
              onChange={(v) => setLabel('payment_terms_label', v)}
              className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"
            />
            <SheetTextarea
              value={invoice.meta.payment_terms}
              onChange={(v) => updateSection('meta', { payment_terms: v })}
              rows={2}
              placeholder="e.g. 30% down payment at kickoff, balance on delivery"
            />
          </div>
        </OptionalBlock>
        <OptionalBlock when={invoice.payment_details}>
          <div>
            <SheetInput
              value={invoice.labels.payment_details_label}
              onChange={(v) => setLabel('payment_details_label', v)}
              className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"
            />
            <div className="space-y-0.5">
              {[
                ['Bank Name', 'bank_name'],
                ['Account Number', 'account_number'],
                ['Account Name', 'account_name'],
                ['SWIFT / BIC', 'swift'],
                ['Bank Address', 'bank_address'],
              ].map(([label, field]) => (
                <div key={field} className="flex gap-2">
                  <span className="w-[108px] shrink-0 text-slate-400">{label}:</span>
                  <SheetInput
                    value={invoice.payment_details[field]}
                    onChange={(v) => setPaymentDetail(field, v)}
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          </div>
        </OptionalBlock>
      </div>

      <div className="mt-5 grid gap-5 text-[11px] text-slate-600 sm:grid-cols-2">
        {/* an empty Notes/Terms heading prints as an unfinished invoice, so the
            whole column is dropped on the document when its body is blank */}
        <OptionalBlock when={invoice.notes}>
          <div>
            <SheetInput
              value={invoice.labels.notes_label}
              onChange={(v) => setLabel('notes_label', v)}
              className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"
            />
            <SheetTextarea
              value={invoice.notes}
              onChange={(v) => setField('notes', v)}
              rows={3}
              placeholder="Notes for the client, payment reference, scope summary…"
            />
          </div>
        </OptionalBlock>
        <OptionalBlock when={invoice.terms}>
          <div>
            <SheetInput
              value={invoice.labels.terms_label}
              onChange={(v) => setLabel('terms_label', v)}
              className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"
            />
            <SheetTextarea value={invoice.terms} onChange={(v) => setField('terms', v)} rows={3} placeholder="Terms & conditions" />
          </div>
        </OptionalBlock>
      </div>
    </div>
  )
}

function MetaRow({ label, onLabel, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-1">
      <SheetInput
        value={label}
        onChange={onLabel}
        className="max-w-[150px] text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400"
      />
      {children}
    </div>
  )
}

function SummaryRow({ label, onLabel, value, strong, muted }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <SheetInput
        value={label}
        onChange={onLabel || (() => {})}
        className={`${strong ? 'text-[11px] font-extrabold uppercase tracking-wide' : 'text-[11px]'} ${
          muted ? 'text-slate-500' : 'text-slate-700'
        }`}
      />
      <span className={`text-right tabular-nums ${strong ? 'text-[14px] font-extrabold' : 'text-[11.5px]'}`}>{value}</span>
    </div>
  )
}
