#!/usr/bin/env python3
"""Convert the supplied dance contact sheet into a transparent sprite strip.

Source: 'astronaut gif elements.png' in the Planet Hopper Assets folder - ten
numbered dance poses laid out 5x2 on a flat dark panel background.

Output: assets/sprites/astronaut-dance.png, 320x48 (10 frames of 32x48).

Two things this does on purpose:

* Frames are cut with one fixed window relative to each panel, not from each
  pose's own bounding box. Per-frame cropping would re-centre every pose and
  make the character jitter around the screen as the loop plays.
* Colours are snapped to the palette already in astronaut-walk.png, so the
  celebrating astronaut and the one who boards the rocket are the same
  character. Reds are matched only against reds - they are a couple of percent
  of the pixels and a plain nearest-neighbour pass over the whole palette
  drags the darker ones into the greys.
"""

import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.expanduser(
    '~/Documents/Projects/Planet Hopper Assets/astronaut gif elements.png')
WALK = os.path.join(ROOT, 'assets', 'sprites', 'astronaut-walk.png')
OUT = os.path.join(ROOT, 'assets', 'sprites', 'astronaut-dance.png')

# Panel grid, measured off the contact sheet's gutters.
COLS = [(4, 232), (237, 465), (470, 698), (703, 931), (935, 1163)]
ROWS = [(8, 525), (595, 1112)]

BG = (41, 45, 50)
BG_TOLERANCE = 34

# Native frame. The character stands 48px tall; 32 wide clears the widest pose.
NATIVE_W, NATIVE_H = 32, 48
CELL = 354.0 / NATIVE_H          # source pixels per native pixel

# Window into a panel, in panel-relative source pixels. Height is exactly the
# character's standing height so the feet land on the last row of every frame.
WIN_H = int(round(NATIVE_H * CELL))
WIN_W = int(round(NATIVE_W * CELL))
WIN_TOP = 148
WIN_LEFT = (COLS[0][1] - COLS[0][0]) // 2 - WIN_W // 2


def is_reddish(px):
    r, g, b = px[:3]
    return r > 90 and r - g > 40 and r - b > 40


def load_palette():
    im = Image.open(WALK).convert('RGBA')
    seen = {}
    for p in im.getdata():
        if p[3]:
            seen[p[:3]] = seen.get(p[:3], 0) + 1
    reds = [c for c in seen if is_reddish(c)]
    greys = [c for c in seen if not is_reddish(c)]
    return greys, reds


def nearest(px, palette):
    r, g, b = px[:3]
    best, bd = palette[0], None
    for c in palette:
        d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2
        if bd is None or d < bd:
            best, bd = c, d
    return best


def cut_panel(src, x0, x1, y0, y1):
    """One frame's window, with anything outside the panel filled as background
    so it keys out cleanly instead of dragging the panel border in."""
    win = Image.new('RGB', (WIN_W, WIN_H), BG)
    sp = src.load()
    wp = win.load()
    for wy in range(WIN_H):
        sy = y0 + WIN_TOP + wy
        if not (y0 + 2 <= sy < y1 - 2):
            continue
        for wx in range(WIN_W):
            sx = x0 + WIN_LEFT + wx
            if x0 + 1 <= sx < x1 - 1:
                wp[wx, wy] = sp[sx, sy]
    return win


def main():
    src = Image.open(SRC).convert('RGB')
    greys, reds = load_palette()

    sheet = Image.new('RGBA', (NATIVE_W * 10, NATIVE_H), (0, 0, 0, 0))
    frame = 0
    for (y0, y1) in ROWS:
        for (x0, x1) in COLS:
            win = cut_panel(src, x0, x1, y0, y1)
            small = win.resize((NATIVE_W, NATIVE_H), Image.BOX)
            out = Image.new('RGBA', (NATIVE_W, NATIVE_H), (0, 0, 0, 0))
            sp, op = small.load(), out.load()
            for y in range(NATIVE_H):
                for x in range(NATIVE_W):
                    px = sp[x, y]
                    if max(abs(px[i] - BG[i]) for i in range(3)) <= BG_TOLERANCE:
                        continue
                    pal = reds if is_reddish(px) else greys
                    c = nearest(px, pal)
                    op[x, y] = (c[0], c[1], c[2], 255)
            sheet.paste(out, (frame * NATIVE_W, 0))
            frame += 1

    sheet.save(OUT)
    print('wrote %s (%dx%d, %d frames)' % (OUT, sheet.width, sheet.height, frame))


if __name__ == '__main__':
    main()
