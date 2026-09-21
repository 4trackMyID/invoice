import re, json, html

BASE = '/Users/juandisay/Organizer/zoho-invoice-clone/recon/'
s = open(BASE + 'invoicegenerator.js', encoding='utf8', errors='replace').read()
page = open(BASE + 'page.html', encoding='utf8', errors='replace').read()

# ---------------- currency list: quote unquoted keys then parse ----------------
raw = None
i = s.find('currencyList:')
j = s.find('{', i)
depth, k, instr = 0, j, None
while k < len(s):
    c = s[k]
    if instr:
        if c == '\\':
            k += 2
            continue
        if c == instr:
            instr = None
    elif c in '"\'':
        instr = c
    elif c == '{':
        depth += 1
    elif c == '}':
        depth -= 1
        if depth == 0:
            raw = s[j:k + 1]
            break
    k += 1

fixed = re.sub(r'([{,])\s*([A-Za-z_$][\w$]*)\s*:', r'\1"\2":', raw)
cur = json.loads(fixed)
json.dump(cur, open(BASE + 'currencyList.json', 'w'), indent=1)
print('CURRENCIES:', len(cur))
print('IDR ->', cur.get('IDR'), '| USD ->', cur.get('USD'), '| AUD ->', cur.get('AUD'), '| EUR ->', cur.get('EUR'))

# ---------------- template picker markup --------------------------------------
print('\n### TEMPLATE PICKER ###')
for m in re.finditer(r'template|Template', page):
    pass
idxs = [m.start() for m in re.finditer(r'template-', page)]
print('template- ids in page:', sorted(set(re.findall(r'class="?([a-z0-9\-]*template[a-z0-9\-]*)', page)))[:30])
print('ids:', sorted(set(re.findall(r'id="([a-z0-9\-_]*template[a-z0-9\-_]*)"', page, flags=re.I)))[:30])
for m in re.finditer(r'<div[^>]*class="?[^">]*template[^">]*"?[^>]*>.{0,400}', page, flags=re.S | re.I):
    print('PICKER:', re.sub(r'\s+', ' ', m.group(0))[:400])

# ---------------- 'Save online' / print / download flow -----------------------
print('\n### SAVE / PRINT / DOWNLOAD ###')
for kw in ['saveOnline', 'save_online', 'Save online', 'printInvoice', 'downloadInvoice', 'saveInvoice',
           'generateInvoice', 'Preview', 'download', 'print', 'btn-', 'saveDraft']:
    hits = [re.sub(r'\s+', ' ', m.group(0))[:180] for m in re.finditer(r'.{40}' + re.escape(kw) + r'.{120}', s + page)]
    if hits:
        print('---', kw, '(%d)' % len(hits))
        for h in hits[:4]:
            print('   ', h)

# ---------------- form + buttons in the invoice form --------------------------
print('\n### FORM TAGS / BUTTONS ###')
for m in re.finditer(r'<form[^>]{0,400}', page):
    print('FORM:', re.sub(r'\s+', ' ', m.group(0))[:300])
fstart = page.find('free-invoice-generator')
for m in re.finditer(r'<button[^>]{0,300}', page):
    t = re.sub(r'\s+', ' ', m.group(0))
    if len(t) < 400:
        print('BTN:', t[:280])

# ---------------- localStorage usage ------------------------------------------
print('\n### LOCALSTORAGE ###')
for m in re.finditer(r'.{100}localStorage.{200}', s + page):
    print('  ', re.sub(r'\s+', ' ', m.group(0))[:300])
