#!/usr/bin/env python3
"""Dump raw word boxes and rule bands so the geometry is inspected, not inferred."""
import re
import subprocess
import sys
from html import unescape

path = sys.argv[1]
xml = subprocess.run(["pdftotext", "-bbox", path, "-"], capture_output=True, text=True).stdout
page = re.search(r'<page width="([\d.]+)" height="([\d.]+)"', xml)
print("page:", page.groups())

want = sys.argv[2] if len(sys.argv) > 2 else None
for m in re.finditer(
    r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>', xml
):
    x0, y0, x1, y1 = (float(m.group(i)) for i in range(1, 5))
    w = unescape(m.group(5))
    if want and want.lower() not in w.lower():
        continue
    print(f"  {w!r:28} x=({x0:6.1f},{x1:6.1f}) y=({y0:6.1f},{y1:6.1f}) h={y1 - y0:5.1f}")
