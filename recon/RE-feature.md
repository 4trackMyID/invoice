# Feature: Free Invoice Generator — reverse-engineering record

Target: `https://www.zoho.com/invoice/free-invoice-generator.html`
Artifacts captured in `recon/` (`page.html`, `index.js`, `invoicegenerator.js`, `site.css`,
`extract*.py` + `findings*.md`, `currencyList.json`, `countries.json`).

## 1. Architecture of the original

| Layer | Original | This clone |
| --- | --- | --- |
| UI | Server-rendered HTML form (`<form name=invoiceGenerator>`), jQuery + vanilla JS | Vite + React (same field set, controlled inputs) |
| Logic | `InvoiceGenerator` / `CreateInvoiceUtil` in `invoicegenerator.js` (193 KB un-minified stream, jQuery selectors on `#itemTotal.N` etc.) | `src/lib/calc.js` — same arithmetic, decoupled from the DOM |
| PDF | Server-side. `getInvoicePDF()` POSTs `multipart/form-data` (`JSONString`, `is_new_template_flow`, optional `org_logo`) to `constructBaseUrl() + "/download?edition=..&format_type=PDF&entity=invoice"`, expects PDF bytes back (XHR `responseType=arraybuffer`), then triggers a blob download (`Invoice.pdf`) or `window.open` when printing | Hono `POST /api/invoice/download` — **same wire contract**, but the PDF is the editor's own sheet rendered on the server and printed by Chrome, so it cannot drift from the screen |
| "Save and Send" | `POST {baseUrl}/save` → returns `file_id`, then opens the Zoho signup modal (the free generator's growth hook) | `POST /api/invoice/save` → returns a `file_id` + JSON snapshot; no signup wall |
| Templates | `applyTemplateType(thumb, key)` flipping a hidden `template_type`: `standard`, `excel`, `compact` (+ `item_table_color`) | Same three keys/templates, same hidden-field semantics |
| Autosave | `getLocalStorage` helper with `expires` handling | `localStorage` draft autosave + JSON import/export |

Paywall finding (per the cloning playbook): there is **no** server-side invoice engine
gate — the whole generator is client-side form state, and the paid funnel is only the
`/save` → signup modal. So the clone keeps the feature and drops the funnel.

## 2. Data model sent to the PDF endpoint (`constructJSONObjectFrmForm`)

Every input in the form carries `data-json-node` (flat key) or `data-array-parent`
(`line_items`, `taxes`). The serialized JSON observed:

```
title, company_name, user_name, company_address_1, company_address_2, company_country,
bill_to_label, customer_name, customer_billing_address_1, customer_billing_address_2,
customer_billing_country, invoice_number_label, invoice_number, invoice_date_label,
invoice_date, due_date_label, due_date, template_type, item_table_color,
line_items[]: { name, quantity, rate, tax1, tax1_amount, amount },
line_items_header: { name, quantity, rate, tax1_name, amount },
taxes[]: { tax_name, tax },
currency_code, currency_symbol, invoice_date ..., notes_label, notes,
terms_and_conditions_label, terms_and_conditions, sub_total_label, total_label
```

Rules lifted from the bundle: `removeEmptyLineItems` drops rows with an empty `name`;
`removeCertainEmptyFields` deletes empty tax registration fields.

## 3. Calculation rules (must match exactly)

- line amount = `(Number(qty) * Number(rate)).toFixed(2)`; NaN qty → "1.00", NaN rate → "0.00"
- line tax amount = `amount * taxPercent / 100`, `toFixed(2)`, `0` → `"0.00"`
- sub total = Σ line amounts, `toFixed(2)`
- tax summary groups lines by label `` `${taxLabel} (${pct}%)` `` and sums `tax_amount`
- total = sub total + Σ tax amounts, `toFixed(2)`
- number formatting (`amountFormatted`): `en-US` 2-dp for AUD/CAD/USD/INR (and editions au/ca/us/in),
  `de-DE` for EUR/UK, otherwise plain `toFixed(2)`
- India edition only: `SGST`/`IGST` switch driven by company state vs place of supply (`GST_TYPE`)

## 4. Field inventory (parsed from `page.html`)

Company block: logo upload (`png/jpg/jpeg/bmp`, < 1 MB, 240×240 @72 DPI), `title` (default
"INVOICE"), company name, your name, address 1, address 2, country (autocomplete over 237
countries), Bill To label (default "Bill To:"), client company, client address 1/2, client
country, Invoice# label + value (placeholder `INV-12`), Invoice Date label + value,
Due Date label + value.
Items: 4 starter rows (last one is the "add row on keypress" row → `TOTAL_LINE_ITEMS = 3` +
clone), headers `Item Description | Qty | Rate | Tax | Amount`, per-row computed tax value
and read-only amount, remove-row close icon.
Totals: `Sub Total`, tax rows (`VAT` default label), `TOTAL`, currency symbol picker
(5-char, default `USD` / `$`), Notes label + textarea, Terms & Conditions label + textarea.
Actions: three template thumbnails, **Save and Send**, **Download/Print** dropdown,
print-copies modal (1 / 2 / 3 copies → `no_of_copies`, India edition only).

## 5. Data assets reused

- `currencyList.json` — 181 currencies `{code: {currency_name, currency_symbol}}`, extracted verbatim
- `countries.json` — 237 countries from the `<select>` options
