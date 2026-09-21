import currencies from '../data/currencyList.json'

/**
 * Currency picker — the original exposes a hidden <select> of every currency
 * plus an editable symbol box. Same idea, searchable.
 */
export function CurrencyPicker({ code, symbol, onChange }) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-slate-600">
      <span className="whitespace-nowrap">Currency</span>
      <select
        aria-label="Currency"
        className="w-[210px] rounded-md border border-slate-300 bg-white px-2 py-1 text-[13px]"
        value={code}
        onChange={(e) => {
          const next = e.target.value
          const meta = currencies[next]
          onChange({ currency_code: next, currency_symbol: meta?.currency_symbol || symbol })
        }}
      >
        {Object.entries(currencies).map(([c, meta]) => (
          <option key={c} value={c}>
            {c} · {meta.currency_name}
          </option>
        ))}
      </select>
      <input
        aria-label="Currency symbol override"
        title={`Currency symbol override — ${code}`}
        className="w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-[13px]"
        maxLength={5}
        value={symbol}
        onChange={(e) => onChange({ currency_symbol: e.target.value })}
      />
    </label>
  )
}

export const currencyMeta = currencies
