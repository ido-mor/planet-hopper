#!/usr/bin/env python3
"""Build the app icons from the owner's front-view astronaut art.

The source is soft-edged (almost every pixel carries partial alpha), so it is
resampled by reading the centre of each cell of its 29x50 / 28px logical grid
rather than by area-averaging - that recovers hard pixel-art edges. The 512s
are drawn at an integer block factor so every block stays square, and the
smaller icons are downscaled from the 512 so all sizes share one framing.

Two renders, because one file cannot serve both purposes well:

  any      block 8, subject 78% of the height. Matches the framing of the
           rocket icon this replaced (76%). Used by iOS - the Home Screen
           applies a rounded-rect mask, not the Android circle - and by any
           context that shows the square as authored.
  maskable block 7, subject 68%. Android crops maskable icons to a centred
           circle of 80% diameter; at block 8 the helmet and boots fall
           outside it and get clipped. Verified at build time.

The astronaut is a wider subject than the rocket was, so it cannot fill as
much of the frame and stay inside the circle - hence the split.

Constraints (see AGENTS.md): no ring around the subject; the small icons are
full-frame downscales of the 512, never a re-render at a different crop.

Usage: python3 tools/make-icons.py
"""

import math
import os
from PIL import Image

SRC = os.path.expanduser(
    '~/Documents/Projects/Planet Hopper Assets/astronaut front view.png')
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'icons')

BG = (26, 26, 46, 255)      # #1a1a2e - manifest background_color / theme_color
GRID_W, GRID_H = 29, 50     # logical pixels in the source art
CELL = 28                   # source px per logical pixel
CONTENT = (97, 59, 909, 1459)
BLOCK_ANY = 8
BLOCK_MASKABLE = 7


def load_logical():
    """Source art reduced to one pixel per logical block."""
    im = Image.open(SRC).convert('RGBA')
    px = im.load()
    out = Image.new('RGBA', (GRID_W, GRID_H), (0, 0, 0, 0))
    op = out.load()
    for gy in range(GRID_H):
        for gx in range(GRID_W):
            x = CONTENT[0] + gx * CELL + CELL // 2
            y = CONTENT[1] + gy * CELL + CELL // 2
            r, g, b, a = px[x, y]
            # Snap the soft alpha to a hard edge so the art reads as pixel art.
            op[gx, gy] = (r, g, b, 255) if a >= 128 else (0, 0, 0, 0)
    return out


def render(logical, block):
    icon = Image.new('RGBA', (512, 512), BG)
    art = logical.resize((GRID_W * block, GRID_H * block), Image.NEAREST)
    icon.alpha_composite(art, ((512 - art.width) // 2, (512 - art.height) // 2))
    return icon


def maskable_overflow(icon):
    """Content pixels falling outside the maskable safe circle (80% diameter)."""
    w, h = icon.size
    px = icon.convert('RGB').load()
    cx, cy, r = w / 2, h / 2, 0.4 * w
    n = 0
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if sum(abs(p[i] - BG[i]) for i in range(3)) > 24:
                if math.hypot(x - cx, y - cy) > r:
                    n += 1
    return n


def save(icon, name, size=512):
    if size != 512:
        icon = icon.resize((size, size), Image.LANCZOS)
    icon.convert('RGB').save(os.path.join(OUT, name))
    print('  wrote %-28s %dx%d' % (name, size, size))


def main():
    logical = load_logical()
    os.makedirs(OUT, exist_ok=True)

    any_icon = render(logical, BLOCK_ANY)
    maskable = render(logical, BLOCK_MASKABLE)

    over = maskable_overflow(maskable)
    if over:
        raise SystemExit(
            'refusing to write: %d px outside the maskable safe circle; '
            'lower BLOCK_MASKABLE' % over)

    print('purpose "any" (block %d):' % BLOCK_ANY)
    save(any_icon, 'icon-512.png')
    save(any_icon, 'icon-192.png', 192)
    save(any_icon, 'apple-touch-icon.png', 180)
    print('purpose "maskable" (block %d, 0 px outside safe circle):'
          % BLOCK_MASKABLE)
    save(maskable, 'icon-512-maskable.png')


if __name__ == '__main__':
    main()
