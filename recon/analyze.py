import re, collections

s = open('/Users/juandisay/Organizer/zoho-invoice-clone/recon/invoicegenerator.js', encoding='utf8', errors='replace').read()
fns = re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(', s)
uniq = []
for f in fns:
    if f not in uniq:
        uniq.append(f)
print('FUNCTION COUNT', len(uniq))
print('FUNCTIONS:', uniq)

print()
kws = ['localStorage', 'sessionStorage', 'window.print', 'jsPDF', 'html2canvas',
       'currency', 'template', 'signature', 'QRCode', 'amount_in_words', 'numberToWords',
       'decimal', 'exchange', 'exchange', 'GST', 'IGST', 'VAT', 'discount', 'shipping',
       'roundoff', 'roundOff', 'gst_type', 'place_of_supply', 'STATE', 'logo',
       'invoice_number', 'save', 'saveOnline', 'due_date', 'repeat', 'notes', 'terms',
       'json', 'JSON', 'AJAX', 'XMLHttpRequest', 'fetch(', 'window.open', 'tos']
for kw in kws:
    print('%-18s %d' % (kw, s.count(kw)))

print()
print('=== string literals containing /invoice/ or api ===')
for m in sorted(set(re.findall(r'"\'[a-z0-9_\-/.?=&]*)["\']', s))):
    if len(m) < 80:
        print(' ', m)
