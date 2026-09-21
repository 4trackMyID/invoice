# PRD — Invoice Generator (Zoho free-invoice-generator feature clone)

Status: implemented · Owner: Kelvin (office manager) · Target: Vercel

## 1. Goal

Reproduce the **invoice-building feature** of `zoho.com/invoice/free-invoice-generator.html`
as a self-contained web app, with the document layout of the Haputra reference invoice,
so the office can issue milestone invoices (e.g. the 30% down payment) and keep them in a
local invoice list.

Explicitly out of scope (the user asked to focus on the invoice feature only): estimates,
receipts, expenses, signup/accounts, recurring invoices, payments collection, email send.

## 2. Users & jobs

- **Office manager (Kelvin)** — fills an invoice from meeting notes, downloads the PDF,
  keeps a copy in the list so it can be reopened, edited and re-issued.
- **Founder/designer** — wants an invoice that matches the company letterhead and the
  company's own wording for labels (every label on the sheet is editable).

## 3. Functional requirements

| # | Requirement | Status |
| --- | --- | --- |
| F1 | Editable invoice sheet: company, client, project, meta, bank, notes, terms | done |
| F1b | Company logo upload in the letterhead: click or drag-and-drop, preview, replace, remove | done |
| F2 | Line items with description, milestone, qty, rate, tax %, computed amount | done |
| F3 | Add / remove line items; a new row appears when the last row is typed into | done |
| F4 | Derived totals: subtotal, per-group tax rows, total, amount in words | done |
| F5 | Currency: 181 currencies from the original's list + symbol override | done |
| F6 | Templates: `classic` (reference layout) + `standard`, `excel`, `compact` | done |
| F7 | Toggle milestone column / tax rows / amount-in-words | done |
| F8 | Theme accent colour for the sheet and buttons | done |
| F9 | Editable labels (`INVOICE`, `Bill To`, `Subtotal`, `TOTAL DUE`, …) | done |
| F10 | Download PDF, print, print N copies | done |
| F11 | CRUD over stored invoices: create, list/search/filter, open, update, duplicate, delete | done |
| F12 | Autosaved working draft that survives a reload | done |
| F13 | JSON export/import (single invoice and full backup) | done |
| F14 | Validation: company + client name + at least one line item | done |
| F15 | The PDF is the sheet itself, printed: identical line breaks and type to the editor, no form controls, blank rows dropped, one page for a normal invoice | done |

## 4. Non-functional requirements

- **Persistence without a server filesystem.** Deployed on Vercel, where the filesystem is
  ephemeral; records therefore live in the browser via one storage interface
  (`src/lib/storage.js`) so a hosted SQL database can replace it later without UI changes.
- **Stateless API.** Only PDF rendering is server-side: `POST /api/invoice/download`
  answers `application/pdf`, mirroring the original's wire contract.
- **The export is the sheet.** The PDF is produced by rendering the editor's own sheet
  components on the server and printing them with Chrome, so the document cannot drift
  from what the office saw on screen — same line breaks, same type, same spacing.
- **No tracking, no signup wall.** The original gates "Save and Send" behind a Zoho signup
  modal; the clone stores the invoice locally instead (documented divergence, see §6).
- **Verification.** Every claim in this PRD is backed by a script in `scripts/` that runs
  against the real app (see README "Verification").

## 5. Acceptance tests (all passing)

1. `node scripts/unit-storage.mjs` — 21 CRUD/derivation checks in Node.
2. `node scripts/smoke-api.mjs` — 6 checks on the HTTP contract, including both 400 paths.
3. `node scripts/smoke-pdf.mjs` — one PDF per template through the real export path, page
   count checked.
4. `node scripts/e2e.mjs` — 25 checks in headless Chrome: render, totals, CREATE, UPDATE,
   DUPLICATE, DELETE, reload persistence, real PDF download.
5. `NODE_ENV=production node scripts/smoke-prod.mjs` — after `npm run build`: the deployed
   path renders through the prebuilt bundle, emits no form controls, omits optional sections
   whose body is blank (and prints them when filled), and the route answers with real PDF bytes.
6. `node scripts/e2e-logo.mjs` — 17 checks on the logo path: upload, preview, oversize
   rejection, reload persistence, storage round-trip, and the embedded image in the PDF.
7. `python3 scripts/check_rules_through_text.py <pdf>…` — renders each PDF and proves, from
   pixels, that no rule crosses any word's ink.
8. `node scripts/verify-logo.mjs` — logo geometry measured from the live DOM and from the
   rendered PDF, not from a screenshot.

The download assertions poll for the file instead of sleeping a fixed time: the export runs
through Chrome, so its latency tracks CPU load, and concurrent browser instances made the
fixed-sleep version flaky.

## 5b. Logo rules

- Accepted: PNG, JPG, JPEG, BMP. Rejected above 1 MB (the original generator's limit),
  with the actual size in the message and the previous logo left untouched.
- Images are downscaled to 600 px on the longest edge and re-encoded before storage, so a
  multi-megabyte photo cannot exhaust the localStorage quota. PNG keeps its alpha; other
  formats are flattened onto white.
- The logo is part of the invoice payload, so it round-trips through the draft, the stored
  record, JSON export/import and the PDF request.
- An undecodable image degrades to a logo-less invoice; it never fails the PDF request.

## 6. Divergences from the original (deliberate)

| Original | Clone | Why |
| --- | --- | --- |
| PDF built by Zoho's servers via `POST /download` | PDF is the app's own sheet rendered server-side and printed by headless Chrome, same POST contract | no Zoho dependency, and no second layout implementation to keep in sync |
| "Save and Send" → Zoho signup modal | saves to the local invoice list | the signup wall is the paid funnel, not the feature |
| India-only GST/SGST/IGST + 1/2/3 copy dialog | generic tax label + tax rows; copies dialog retained | one tax model is enough for office invoices |
| Fixed three layouts | four, adding the letterhead layout | the office invoice layout is the reference |
| `dd/mm/yyyy` display | same | unchanged |

## 7. Known limits

- Tax is a single percentage per line; no compound tax, no per-line discount, no shipping.
- Amount-in-words is English-only and covers the currencies listed in `src/lib/words.js`;
  other currencies print the number in words without a currency noun.
- `localStorage` is per-browser-profile: two machines do not share the list. Move to a
  hosted database (Turso/libSQL, Postgres) when multi-device use is needed.
- The PDF fits one page: a document taller than A4 is scaled down to a floor of 0.6, and
  only beyond that does it paginate.
- Printing needs a browser binary. `CHROME_PATH` or a local Chrome covers development;
  the Vercel function relies on `@sparticuz/chromium`, which adds ~70 MB and a cold start.
