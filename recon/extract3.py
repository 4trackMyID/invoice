import re, json, html

BASE = '/Users/juandisay/Organizer/zoho-invoice-clone/recon/'
page = open(BASE + 'page.html', encoding='utf8', errors='replace').read()
s = open(BASE + 'invoicegenerator.js', encoding='utf8', errors='replace').read()

out = []
W = out.append

# ---- 1. Full ordered field inventory inside <form name=invoiceGenerator> ----
i = page.find('name=invoiceGenerator')
j = page.find('</form>', i)
form = page[i:j]
W('## FORM LENGTH %d' % len(form))
for m in re.finditer(r'<(input|select|textarea)\b[^>]*>', form, flags=re.S):
    W('  ' + re.sub(r'\s+', ' ', m.group(0)))
W('')

# ---- 2. Non-input visible text of the sheet (labels, total rows) ------------
txt = re.sub(r'<[^>]+>', '\n', form)
txt = html.unescape(txt)
W('## SHEET TEXT')
W('\n'.join(l.strip() for l in txt.split('\n') if l.strip()))
W('')

# ---- 3. template thumbnails ------------------------------------------------
W('## applyTemplateType calls')
for m in re.finditer(r'applyTemplateType\(([^)]*)\)', page + s):
    W('  ' + m.group(0))
W('## thumbnail aria-labels')
for m in re.finditer(r'aria-label="Change to ([^"]+)"[^>]*>', page):
    W('  ' + m.group(1))
W('')

# ---- 4. constructJSONObjectFrmForm + removeEmptyLineitems ------------------
for fn in ['constructJSONObjectFrmForm', 'removeEmptyLineitems', 'getInvoicePDF', 'saveInvoice', 'applyTemplateType']:
    k = s.find(fn + '=function')
    if k < 0:
        k = s.find(fn + ':function')
    if k < 0:
        W('## %s NOT FOUND' % fn)
        continue
    seg = s[k:k + 2200]
    W('## ' + fn)
    W('  ' + re.sub(r'\s+', ' ', seg)[:2200])
    W('')

# ---- 5. totals calculation --------------------------------------------------
for fn in ['calculateItemTotal', 'calculateInvoiceTotal', 'calculateTaxSummary', 'calculateItemTableSubTotal', 'calculateTaxAndTotal']:
    k = s.find(fn + '=function')
    if k < 0:
        W('## %s NOT FOUND' % fn)
        continue
    W('## ' + fn)
    W('  ' + re.sub(r'\s+', ' ', s[k:k + 1400])[:1400])
    W('')

open(BASE + 'findings2.md', 'w').write('\n'.join(out))
print('written', len('\n'.join(out)))
