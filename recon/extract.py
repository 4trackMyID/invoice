import re, json

BASE = '/Users/juandisay/Organizer/zoho-invoice-clone/recon/'
s = open(BASE + 'invoicegenerator.js', encoding='utf8', errors='replace').read()
page = open(BASE + 'page.html', encoding='utf8', errors='replace').read()


def grab_object(text, key):
    """Extract a JS object literal assigned to `key:` using brace matching."""
    i = text.find(key)
    if i < 0:
        return None
    j = text.find('{', i + len(key))
    if j < 0:
        return None
    depth, k = 0, j
    instr = None
    while k < len(text):
        c = text[k]
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
                return text[j:k + 1]
        k += 1
    return None


# ---------- 1. currency list -------------------------------------------------
raw = grab_object(s, 'currencyList')
print('currencyList raw len:', len(raw) if raw else None)
if raw:
    try:
        obj = json.loads(raw)
        json.dump(obj, open(BASE + 'currencyList.json', 'w'), indent=1)
        print('currencies parsed:', len(obj))
        print('sample:', list(obj.items())[:3], '| IDR:', obj.get('IDR'), '| USD:', obj.get('USD'))
    except Exception as e:
        print('parse fail', e)
        open(BASE + 'currencyList.raw.txt', 'w').write(raw)

# ---------- 2. country list ---------------------------------------------------
opts = re.findall(r'<option value=([A-Za-z]{2})>([^<]+)</option>', page)
seen, countries = set(), []
for code, name in opts:
    if code not in seen:
        seen.add(code)
        countries.append({'code': code, 'name': name})
json.dump(countries, open(BASE + 'countries.json', 'w'), indent=1)
print('countries:', len(countries))

# ---------- 3. GST / tax type logic ------------------------------------------
i = s.find('GST_TYPE')
print('\n--- GST_TYPE context ---')
print(re.sub(r'\s+', ' ', s[max(0, i - 200):i + 1200])[:1500])

# ---------- 4. rounding / format ---------------------------------------------
i = s.find('maximumFractionDigits')
print('\n--- number formatting ---')
print(re.sub(r'\s+', ' ', s[max(0, i - 900):i + 500])[:1400])

# ---------- 5. templates ------------------------------------------------------
print('\n--- template mentions ---')
for m in re.finditer(r'.{60}template_type.{120}|.{60}templateType.{120}', s):
    print('  ', re.sub(r'\s+', ' ', m.group(0))[:200])

# ---------- 6. save-online / endpoints ---------------------------------------
print('\n--- endpoints ---')
for m in sorted(set(re.findall(r'"\')["\']', s + page))):
    print('  ', m)
print('\n--- form action ---')
for m in re.finditer(r'<form[^>]{0,300}', page):
    print('  ', re.sub(r'\s+', ' ', m.group(0))[:300])
