import re, json

BASE = '/Users/juandisay/Organizer/zoho-invoice-clone/recon/'
s = open(BASE + 'invoicegenerator.js', encoding='utf8', errors='replace').read()
page = open(BASE + 'page.html', encoding='utf8', errors='replace').read()

lines = []


def dump(title, items):
    lines.append('## ' + title)
    for it in items:
        lines.append('  ' + it)
    lines.append('')


# ---- 1. template picker markup -------------------------------------------------
i = page.find('template-picker')
if i < 0:
    i = page.find('templateType')
dump('TEMPLATE MARKUP (around templateType)', [re.sub(r'\s+', ' ', page[max(0, i - 3000):i + 800])])

# ---- 2. print options ----------------------------------------------------------
i = page.find('print-option')
dump('PRINT OPTIONS', [re.sub(r'\s+', ' ', page[max(0, i - 4000):i + 600])])

# ---- 3. currency handling in JS ------------------------------------------------
cur_blocks = re.findall(r'currency[A-Za-z_$]*\s*[:=]\s*[^;]{0,300}', s)
dump('CURRENCY CODE BLOCKS (%d)' % len(cur_blocks), [re.sub(r'\s+', ' ', c)[:300] for c in cur_blocks[:15]])

# ---- 4. tax / GST --------------------------------------------------------------
gst = re.findall(r'.{50}(?:GST_TYPE|changeGSTType|gst_type|IGST).{150}', s)
dump('GST BITS (%d)' % len(gst), [re.sub(r'\s+', ' ', g) for g in gst[:12]])

# ---- 5. endpoints / urls -------------------------------------------------------
urls = sorted(set(re.findall(r'https?://[A-Za-z0-9_\-./?=&%]+', s + page)))
dump('URLS (%d)' % len(urls), urls[:60])

# ---- 6. storage / persistence ---------------------------------------------------
pers = re.findall(r'.{80}(?:localStorage|XMLHttpRequest|window\.open).{160}', s)
dump('PERSISTENCE BITS (%d)' % len(pers), [re.sub(r'\s+', ' ', p) for p in pers[:12]])

# ---- 7. country -> currency / tax mapping ---------------------------------------
cc = re.findall(r'(?:state_list|stateList|countryCurrency|country_currency|currency_list|currencyList)[^;]{0,400}', s)
dump('COUNTRY/CURRENCY MAPS (%d)' % len(cc), [re.sub(r'\s+', ' ', c)[:400] for c in cc[:10]])

# ---- 8. labels and defaults from markup -----------------------------------------
labels = re.findall(r'data-json-node=([A-Za-z0-9_.]+)', page)
uniq = []
for l in labels:
    if l not in uniq:
        uniq.append(l)
dump('data-json-node FIELDS (%d)' % len(uniq), uniq)

open(BASE + 'findings.md', 'w').write('\n'.join(lines))
print('\n'.join(lines)[:12000])
