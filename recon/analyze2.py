import re, json, html

base = '/Users/juandisay/Organizer/zoho-invoice-clone/recon/'
s = open(base + 'invoicegenerator.js', encoding='utf8', errors='replace').read()
page = open(base + 'page.html', encoding='utf8', errors='replace').read()

out = []

# ---- URLs / endpoints -------------------------------------------------------
out.append('## URLS / ENDPOINTS')
urls = sorted(set(re.findall(r'"\'?//[^"\']{4,120}|/[a-z0-9_\-/]{4,80}\.json)["\']', s)))
for u in urls[:80]:
    out.append('  ' + u)

# ---- currency list ----------------------------------------------------------
out.append('\n## CURRENCY DATA')
for m in re.finditer(r'(?:currency|Currency)[^,;]{0,80}', s):
    pass
cur = re.findall(r'\{"?[A-Z]{3}"?:[^}]{2,120}\}', s)
out.append('  raw currency-ish blocks: %d' % len(cur))
for c in cur[:6]:
    out.append('   ' + c[:200])
# currency symbols
syms = sorted(set(re.findall(r'"\'["\']', s)))
out.append('  symbols found: %s' % syms)

# ---- tax types --------------------------------------------------------------
out.append('\n## TAX TYPES')
for m in re.finditer(r'.{60}(?:GST|IGST|VAT).{100}', s):
    out.append('   ' + re.sub(r'\s+', ' ', m.group(0)))

# ---- templates --------------------------------------------------------------
out.append('\n## TEMPLATES')
for m in re.finditer(r'.{40}template.{80}', s, flags=re.I):
    out.append('   ' + re.sub(r'\s+', ' ', m.group(0)))

# ---- localStorage / XHR -----------------------------------------------------
out.append('\n## STORAGE / XHR')
for m in re.finditer(r'.{60}(?:localStorage|XMLHttpRequest|window\.open).{120}', s):
    out.append('   ' + re.sub(r'\s+', ' ', m.group(0)))

# ---- print options (radios) -------------------------------------------------
out.append('\n## PRINT OPTIONS MARKUP')
i = page.find('print-option')
out.append(re.sub(r'\s+', ' ', page[max(0, i - 1500):i + 1200]))

open(base + 'findings.md', 'w').write('\n'.join(out))
print('\n'.join(out)[:9000])
