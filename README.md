# Invoice Generator

A feature-focused clone of Zoho's **free invoice generator**, using the letterhead invoice
layout of the Haputra audit invoice as its default template. Build an invoice on screen,
download or print it as a PDF, and keep saved invoices in a local list.

- `PRD.md` — scope, requirements, acceptance tests, divergences
- `recon/RE-feature.md` — how the original was reverse-engineered, and what was reused

## Quick start

```bash
npm install
npm run dev          # web on http://localhost:5199, api on http://localhost:3099
```

Production preview in one process (Hono serves `dist/` too):

```bash
npm run build && npm start
```

## How it works

| Piece | File |
| --- | --- |
| Invoice document state + derived totals | `src/hooks/useInvoice.js` |
| Calculation engine (port of the original's `CreateInvoiceUtil`) | `src/lib/calc.js` |
| Payload shape (the original's flat `data-json-node` keys) | `src/lib/invoice.js` |
| CRUD storage (localStorage, swappable) | `src/lib/storage.js` |
| Amount in words | `src/lib/words.js` |
| Logo intake (validate, downscale, data URL) | `src/lib/image.js` |
| Logo control for the letterhead | `src/components/LogoPicker.jsx` |
| Letterhead sheet | `src/components/ClassicSheet.jsx` |
| Standard / Spreadsheet / Compact sheets | `src/components/StandardSheet.jsx` |
| Toolbar, sidebar, currency picker | `src/components/{Toolbar,Sidebar,CurrencyPicker}.jsx` |
| PDF export: the sheet as an A4 document | `src/print/{entry.jsx,PrintDocument.jsx,print.css}` |
| Server-side HTML renderer (dev via Vite, prod via `dist-ssr/`) | `server/lib/sheet-html.js` |
| Chrome/Chromium as the PDF engine | `server/lib/chrome.js` |
| API (shared by Node dev server and Vercel) | `server/app.js` |
| Local dev server + on-disk endpoints | `server/index.js` |
| Vercel function | `api/[...route].js` |

### API

```
GET  /api/health                     -> { status: "ok" }
POST /api/invoice/download?print=    -> application/pdf   (multipart JSONString, or raw JSON)
POST /api/invoice/save               -> { file_id }        (local dev server only)
GET  /api/invoice/:fileId            -> stored payload     (local dev server only)
```

The download endpoint keeps the original generator's contract: a `JSONString` form field
holding the invoice payload.

### The PDF is the sheet, printed

An invoice must not look different once it leaves the browser, so the export does not
re-draw the document: the endpoint renders the *same* React sheet components on the
server (`src/print/entry.jsx`), and Chrome prints that HTML onto A4.

That is why the sheet is laid out at a fixed 840px here rather than being fitted to the
paper. A page 6% narrower re-wraps every address, note and total, and the PDF stops
matching what the office approved on screen. Instead the document keeps its on-screen
width and `server/lib/chrome.js` computes a per-document scale that lands it on one page
(`MIN_SCALE` paginates rather than shrinking type into unreadability), so line breaks in
the PDF are the line breaks on screen.

By the same rule `PrintModeProvider` (`src/components/SheetField.jsx`) swaps every
`input`/`textarea` for a static element carrying the *same class list*, so the printed box
is the box the control occupied — an editable-looking field is an editor affordance, not
part of the invoice. Blank line-item rows are dropped too: on screen they are placeholders
waiting to be typed into, on paper they would print as an empty row.

The same distinction applies to whole sections. `OptionalBlock` keeps a section visible while
editing — the heading is what tells the user the field exists — but drops it from the document
when its body is blank, because "TERMS & CONDITIONS" followed by white space reads as an
unfinished invoice. It covers notes, terms, payment terms, bank details and the project block,
in both the classic and standard/spreadsheet/compact sheets. `smoke-prod.mjs` asserts both
directions: blanks absent, filled sections present.

Chrome binary resolution is `CHROME_PATH` → a locally installed Chrome → puppeteer's cache
→ `@sparticuz/chromium` for serverless, where the platform image has no browser.

### Where the data lives (and why not SQLite)

The app deploys to Vercel, where each invocation gets an ephemeral filesystem — a local
`.sqlite` file would silently lose every invoice. Records are therefore kept in the browser
through a single interface:

```js
// src/lib/storage.js
create / list / get / update / duplicate / remove / exportAll / importAll
```

Swapping in a hosted SQL database is a one-file change; every method is already async so
the signatures do not move:

```js
export const invoices = createSqlStore(client)   // Turso/libSQL, Postgres, …
```

Use the sidebar's **Data** tab to export a JSON backup or import one.

## Verification

Each script asserts against the real app and exits non-zero on failure.

```bash
node scripts/unit-storage.mjs    # CRUD + number/round-trip rules      (no browser)
node scripts/smoke-api.mjs       # HTTP contract incl. both 400 paths
node scripts/smoke-pdf.mjs       # one PDF per template, page count
npm run build && NODE_ENV=production node scripts/smoke-prod.mjs   # the deployed path
node scripts/e2e.mjs             # 25 checks in headless Chrome (needs `npm run dev`)
node scripts/e2e-logo.mjs        # 17 checks on the logo path        (needs `npm run dev`)
node scripts/verify-logo.mjs     # logo geometry from the DOM and the PDF
node scripts/time-pdf-download.mjs  # how long an export actually takes
node scripts/inspect-item-row.mjs   # item-table column map, for fixture authors
node scripts/screenshot.mjs      # screenshots into tmp/shots/ (needs `npm run dev`)
python3 scripts/make_logo_fixtures.py     # PNG fixtures for the logo tests
python3 scripts/check_rules_through_text.py tmp/pdf/*.pdf
```

The download checks poll for the file rather than sleeping a fixed time. The export goes
through Chrome now, so its latency varies with CPU load, and a fixed sleep made those tests
flaky — a stray bundled Chrome from an interrupted run is enough to push it over.

`smoke-prod.mjs` matters because the export renders through Vite in development and through
the prebuilt `dist-ssr/` bundle in production — the branch Vercel actually runs, which the
dev-mode suites never touch.

`check_rules_through_text.py` renders each PDF and checks the pixels, because a vision read
cannot settle whether a rule strikes through a label. It found real bugs: the item-row
separator was drawn 2pt above the next row's baseline, and the totals rule crossed the
`TOTAL DUE` label. The same script ignores a rule that merely grazes a descender, and an
earlier box-based version false-positived because `pdftotext -bbox` returns the font's line
box (ascent + descent), which is taller than the drawn glyphs. It is independent of the
renderer, which is why it survived the move to Chrome: it reads the finished page either way.

Note for local testing: the dev server renders the print document through Vite, so a change
to `src/print/` or `src/components/` shows up in the very next export. Only `server/lib/*`
needs a restart.

`e2e.mjs` drives the real UI: it types into the sheet, checks the derived totals, then
exercises Create → Update → Duplicate → Delete, reload persistence, and a real PDF download.
It needs Chrome; `CHROME_PATH` overrides the auto-detection.

## Deploy to Vercel

```bash
vercel        # or: connect the repo in the dashboard
```

`vercel.json` runs `npm run build` (the app *and* the print bundle), points `/api/*` at the
single Hono function, and gives that function 1024 MB, a longer timeout, and the two things
it cannot infer:

```
includeFiles: {dist-ssr/**,node_modules/@sparticuz/chromium/**,node_modules/tar-fs/**}
```

Both halves are load-bearing:

- `dist-ssr/**` is the renderer. It is produced by the build and loaded at runtime rather
  than imported, so the bundler never sees it; without this the function has no renderer and
  every export 500s.
- the Chromium payload is the browser. It ships as brotli archives inside `node_modules`,
  which Vercel prunes from functions, and it is spawned as a child process rather than
  imported, so it is invisible to dependency tracing. `tar-fs` comes along because that is
  what unpacks it.

The Node runtime matters too: `@sparticuz/chromium` requires **Node ≥ 22.17** (`package.json`
declares it), so on an older runtime the function fails at import. The API route pins
`nodejs` in `api/[...route].js`; Vercel resolves that to its current default Node version,
which must satisfy the floor above.

Nothing else is required — the app is stateless, and invoice records stay in the browser.
The browser is only used by `POST /api/invoice/download`; every other route answers without it.
