#!/usr/bin/env python3
"""Definitive test: does a rule pass through the INK of any word?

    python3 scripts/check_rules_through_text.py [-v] <pdf> [<pdf> ...]

Why this exists: `pdftotext -bbox` returns the font's line box (ascent +
descent), which is taller than the letters actually drawn. A rule sitting in the
gap between two rows is correct typography, yet it falls "inside" that line box —
so a naive box/rule intersection reports a strikethrough that isn't there.

This renders the page and measures the real ink per word from the pixels: a word
is struck through only if a rule row lies strictly inside the ink rows
(top + margin, bottom - margin) with the ink continuing below it, and the rule
horizontally crosses the word.
"""
import re
import subprocess
import sys
from html import unescape

PAGE_TALL = 841.89
DPI = 200
RULE_MAX = 240   # rules are light grey (~208); text edges are darker
INK_MAX = 128    # real glyph ink
EDGE_PX = int(1.5 * DPI / 72)  # 1.5pt margin, so grazing a descender is not a hit


def pgm(path):
    out = subprocess.run(
        ["pdftoppm", "-gray", "-r", str(DPI), "-f", "1", "-l", "1", path],
        capture_output=True,
        check=True,
    ).stdout
    assert out[:2] == b"P5", out[:8]
    idx = 2
    fields = []
    while len(fields) < 3:
        while out[idx : idx + 1].isspace():
            idx += 1
        if out[idx : idx + 1] == b"#":
            while out[idx : idx + 1] != b"\n":
                idx += 1
            continue
        start = idx
        while not out[idx : idx + 1].isspace():
            idx += 1
        fields.append(int(out[start:idx]))
    idx += 1
    width, height, _ = fields
    return width, height, out[idx : idx + width * height]


def word_boxes(path):
    xml = subprocess.run(["pdftotext", "-bbox", path, "-"], capture_output=True, text=True).stdout
    return [
        (float(m.group(1)), float(m.group(2)), float(m.group(3)), float(m.group(4)), unescape(m.group(5)))
        for m in re.finditer(
            r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>', xml
        )
    ]


def main(path):
    width, height, px = pgm(path)
    scale = DPI / 72.0

    def at(x, y):
        return px[y * width + x]

    # ---- rule rows: an unbroken non-white run (text is broken into letter runs)
    min_run = int(0.30 * (width - 2 * int(42 * scale)))
    rule_rows = []
    for y in range(height):
        best = run = 0
        for x in range(width):
            if at(x, y) < RULE_MAX:
                run += 1
                best = run if run > best else best
            else:
                run = 0
        if best >= min_run:
            rule_rows.append(y)

    bands = []
    for y in rule_rows:
        if bands and y - bands[-1][1] <= 2:
            bands[-1][1] = y
        else:
            bands.append([y, y])

    band_extents = []
    for (ry0, ry1) in bands:
        mid = (ry0 + ry1) // 2
        xs = [x for x in range(width) if at(x, mid) < RULE_MAX]
        if xs:
            band_extents.append((ry0, ry1, xs[0], xs[-1]))

    print(f"{path}: {width}x{height} @ {DPI}dpi   rules: {len(band_extents)}")
    if VERBOSE:
        for e in band_extents:
            print(f"   rule y=({e[0]},{e[1]}) x=({e[2]},{e[3]})  ({e[0] / scale:.1f}pt from top)")

    hits = []
    for x0, y0, x1, y1, word in word_boxes(path):
        c0, c1 = int(x0 * scale), int(x1 * scale)
        r0, r1 = int(y0 * scale), int(y1 * scale)
        # true ink rows for this word (ignore its x-padding, which holds no ink)
        ink_rows = [y for y in range(r0, min(r1 + 1, height)) if any(at(x, y) < INK_MAX for x in range(c0, c1))]
        if not ink_rows:
            continue
        ink_top, ink_bot = ink_rows[0], ink_rows[-1]
        for (ry0, ry1, rx0, rx1) in band_extents:
            # the rule must be strictly inside the INK, not merely inside the line box
            if not (ink_top + EDGE_PX <= ry0 and ry1 <= ink_bot - EDGE_PX):
                continue
            if not (c1 > rx0 and c0 < rx1):
                continue
            hits.append((word, (round(ink_top / scale, 1), round(ink_bot / scale, 1)), ry0))

    if hits:
        print(f"  !! {len(hits)} word(s) genuinely struck through:")
        for w, ink, ry in hits[:15]:
            print(f"     {w!r} ink_y(pt)={ink} rule_y(px)={ry}")
    else:
        print("  OK  no rule crosses any word's ink")
    return len(hits)


if __name__ == "__main__":
    VERBOSE = "-v" in sys.argv
    targets = [a for a in sys.argv[1:] if not a.startswith("-")] or ["tmp/pdf/invoice-classic.pdf"]
    bad = sum(main(t) for t in targets)
    sys.exit(1 if bad else 0)
