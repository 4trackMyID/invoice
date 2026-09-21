#!/usr/bin/env python3
"""Generate PNG fixtures for the logo tests (RGB, 8-bit truecolour, stdlib only).

    python3 scripts/make_logo_fixtures.py

  scripts/fixtures/logo-240x80.png    a normal logo, well under the 1 MB limit
  scripts/fixtures/logo-1200x400.png  a big logo, to exercise the downscale path
  scripts/fixtures/logo-too-large.png over 1 MB, to exercise the rejection path
"""
import os
import struct
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "fixtures")


def write_png(path, width, height, pixel):
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0 (None)
        for x in range(width):
            raw.extend(pixel(x, y))

    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)  # 8-bit, colour type 2 (RGB)
    with open(path, "wb") as fh:
        fh.write(b"\x89PNG\r\n\x1a\n")
        fh.write(chunk(b"IHDR", ihdr))
        fh.write(chunk(b"IDAT", zlib.compress(bytes(raw), 6)))
        fh.write(chunk(b"IEND", b""))


def logo_pixel(width, height):
    """A dark rounded slab plus a lighter bar: enough to see placement in a PDF."""

    def px(x, y):
        border = 6
        inside = border <= x < width - border and border <= y < height - border
        band = height * 0.55 <= y < height * 0.72 and border + 10 <= x < width - border - 40
        if band:
            return (255, 255, 255)
        if inside:
            return (32, 60, 120)
        return (255, 255, 255)

    return px


def noisy_pixel(seed=12345):
    """Random fill: zlib cannot compress it, so the file really exceeds 1 MB."""
    del seed  # kept for signature stability
    buf = os.urandom(4 * 1024 * 1024)

    def px(_x, _y):
        nonlocal cursor
        v = buf[cursor]
        r = buf[cursor + 1]
        g = buf[cursor + 2]
        cursor = (cursor + 3) % (len(buf) - 3)
        return (v, r, g)

    cursor = 0
    return px


def main():
    os.makedirs(OUT, exist_ok=True)
    targets = [
        ("logo-240x80.png", 240, 80, logo_pixel(240, 80)),
        ("logo-1200x400.png", 1200, 400, logo_pixel(1200, 400)),
        ("logo-too-large.png", 900, 900, noisy_pixel()),
    ]
    for name, w, h, px in targets:
        path = os.path.join(OUT, name)
        write_png(path, w, h, px)
        print(f"{name}: {w}x{h}  {os.path.getsize(path) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
