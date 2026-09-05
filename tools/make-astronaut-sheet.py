#!/usr/bin/env python3
"""Convert walking_2.gif into a transparent pixel-art walk-cycle sprite sheet.

Source is a 24-frame, 400x650 GIF rendered on a flat dark background. Each pose
is duplicated, so only every other frame is kept -> 12 unique poses. The art was
authored on a ~5.9px grid, i.e. a native canvas of 68x110.

Output: assets/sprites/astronaut-walk.png, a horizontal strip of 12 frames.

Usage: python3 tools/make-astronaut-sheet.py [path/to/walking_2.gif]
"""

import os
import sys
from PIL import Image

DEFAULT_SRC = os.path.expanduser(
    "~/Documents/Projects/Planet Hopper Assets/walking_2.gif"
)
OUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "assets", "sprites", "astronaut-walk.png"
)

NATIVE_W, NATIVE_H = 68, 110   # native pixel grid of the source art
BG = (33, 38, 46)              # flat background colour baked into the GIF
BG_TOLERANCE = 34              # manhattan distance; the outline is near-black
GREY_COLORS = 13               # palette slots for the suit / helmet / boots
RED_COLORS = 3                 # reserved slots, else median-cut drops the accents


def is_background(px):
    return sum(abs(px[i] - BG[i]) for i in range(3)) < BG_TOLERANCE


def is_reddish(px):
    r, g, b = px[:3]
    return r > 90 and r - g > 40 and r - b > 40


def load_frames(src):
    """Every other GIF frame, box-downsampled to the native grid."""
    gif = Image.open(src)
    frames = []
    index = 0
    try:
        while True:
            if index % 2 == 0:
                frames.append(
                    gif.convert("RGB").resize((NATIVE_W, NATIVE_H), Image.BOX)
                )
            index += 1
            gif.seek(gif.tell() + 1)
    except EOFError:
        pass
    return frames


def build_palette(frames):
    """Median-cut greys and reds separately so the chest accents survive."""
    greys, reds = [], []
    for frame in frames:
        for px in frame.getdata():
            if is_background(px):
                continue
            (reds if is_reddish(px) else greys).append(px)

    def quantize(pixels, count):
        if not pixels:
            return []
        strip = Image.new("RGB", (len(pixels), 1))
        strip.putdata(pixels)
        pal = strip.quantize(colors=count, method=Image.MEDIANCUT,
                             dither=Image.NONE).getpalette()[: count * 3]
        return [tuple(pal[i:i + 3]) for i in range(0, len(pal), 3)]

    return quantize(greys, GREY_COLORS) + quantize(reds, RED_COLORS)


def snap(px, palette):
    return min(palette, key=lambda c: sum((px[i] - c[i]) ** 2 for i in range(3)))


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    frames = load_frames(src)
    palette = build_palette(frames)
    cache = {}

    keyed = []
    for frame in frames:
        out = Image.new("RGBA", frame.size, (0, 0, 0, 0))
        src_px, out_px = frame.load(), out.load()
        for y in range(frame.height):
            for x in range(frame.width):
                px = src_px[x, y]
                if is_background(px):
                    continue
                if px not in cache:
                    cache[px] = snap(px, palette)
                # Binary alpha only: partial alpha leaves a halo of background
                # colour around the sprite on light surfaces.
                out_px[x, y] = cache[px] + (255,)
        keyed.append(out)

    # One shared crop box so the walk cycle does not jitter between frames.
    box = None
    for frame in keyed:
        b = frame.getbbox()
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]),
                                     max(box[2], b[2]), max(box[3], b[3]))

    w, h = box[2] - box[0], box[3] - box[1]
    sheet = Image.new("RGBA", (w * len(keyed), h), (0, 0, 0, 0))
    for i, frame in enumerate(keyed):
        sheet.paste(frame.crop(box), (i * w, 0))
    sheet.save(OUT, optimize=True)

    print("frames %d  cell %dx%d  sheet %dx%d  %d bytes"
          % (len(keyed), w, h, sheet.width, sheet.height, os.path.getsize(OUT)))


if __name__ == "__main__":
    main()
