#!/usr/bin/env python3
"""Build the 1200x630 link-preview card at assets/og-card.png.

The game is shared as a link, so this is the first thing most people see. 1200x630
is what iMessage, WhatsApp, Slack and Twitter want for a large summary card; a
square icon gets cropped or shrunk to a thumbnail in that slot.

Reuses the astronaut sampling from make-icons.py (the source art is soft-edged, so
it has to be resampled on its 29x50 / 28px logical grid to come back as crisp
pixel art) and the title treatment from .game-title in styles.css - Pixeboy with a
cyan pixel outline on the #0f0f1a intro background.

Usage: python3 tools/make-og-card.py
"""

import os
import random

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'assets', 'og-card.png')
TITLE_FONT = os.path.join(ROOT, 'fonts', 'Pixeboy-z8XGD.ttf')

W, H = 1200, 630
BG = (15, 15, 26)           # #0f0f1a - the intro stage background
CYAN = (0, 255, 255)
GROUND = (26, 26, 46)       # #1a1a2e
BLOCK = 8                   # device px per logical pixel of the astronaut


def astronaut():
    """The front-view astronaut, resampled off its logical grid."""
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        'make_icons', os.path.join(HERE, 'make-icons.py'))
    mk = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mk)
    logical = mk.load_logical()
    return logical.resize(
        (mk.GRID_W * BLOCK, mk.GRID_H * BLOCK), Image.NEAREST)


def starfield(card):
    """Sparse static stars, matching the density of .intro-starfield."""
    rnd = random.Random(7)          # fixed seed: regenerating gives the same card
    d = ImageDraw.Draw(card)
    for _ in range(90):
        x, y = rnd.randrange(0, W), rnd.randrange(0, int(H * 0.78))
        shade = rnd.choice([(207, 214, 255), (255, 255, 255), (150, 160, 210)])
        r = rnd.choice([1, 1, 2])
        d.ellipse([x - r, y - r, x + r, y + r], fill=shade)


def draw_title(card, text, cx, cy):
    """Pixeboy with the cyan outline the title screen uses."""
    font = ImageFont.truetype(TITLE_FONT, 132)
    d = ImageDraw.Draw(card)
    bbox = d.textbbox((0, 0), text, font=font)
    x = cx - (bbox[2] - bbox[0]) // 2 - bbox[0]
    y = cy - (bbox[3] - bbox[1]) // 2 - bbox[1]
    for dx, dy in ((-4, 0), (4, 0), (0, -4), (0, 4),
                   (-3, -3), (3, 3), (-3, 3), (3, -3)):
        d.text((x + dx, y + dy), text, font=font, fill=CYAN)
    d.text((x, y), text, font=font, fill=(0, 0, 0))


def main():
    card = Image.new('RGB', (W, H), BG)
    starfield(card)

    # Ground band along the bottom, as on the launch stage.
    ImageDraw.Draw(card).rectangle([0, int(H * 0.86), W, H], fill=GROUND)

    art = astronaut()
    # Stand the astronaut on the ground line, right of centre.
    card.paste(art, (int(W * 0.70), int(H * 0.86) - art.height + 6), art)

    draw_title(card, 'PLANET HOPPER', int(W * 0.40), int(H * 0.34))

    sub = ImageFont.truetype(TITLE_FONT, 54)
    d = ImageDraw.Draw(card)
    line = 'Fly your rocket by solving math'
    bb = d.textbbox((0, 0), line, font=sub)
    d.text((int(W * 0.40) - (bb[2] - bb[0]) // 2 - bb[0], int(H * 0.52)),
           line, font=sub, fill=(160, 160, 192))

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    card.save(OUT)
    print('wrote assets/og-card.png (%dx%d, %d bytes)'
          % (W, H, os.path.getsize(OUT)))


if __name__ == '__main__':
    main()
