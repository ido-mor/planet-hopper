#!/usr/bin/env python3
"""Build the iOS launch images at assets/startup/.

Without these, a Home Screen launch flashes a blank screen before the page
paints - iOS does not read background_color from the web manifest the way
Android does.

The app is landscape-only, so only landscape variants are generated. Apple
matches these on the device's *portrait* logical size regardless of the
orientation being requested, so the media query carries portrait
device-width/height while the image itself is landscape:
    image = (portrait_height * dpr) x (portrait_width * dpr)

Each image is a flat #1a1a2e field with the astronaut centred, matching what
the first frame of the app looks like, so the handoff is invisible. Flat colour
means these compress to a couple of KB each despite the pixel dimensions.

Run make-startup-images.py --print-links to emit the <link> tags for index.html.

Usage: python3 tools/make-startup-images.py
"""

import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'startup')
BG = (26, 26, 46)           # #1a1a2e - matches body and the manifest
BLOCK = 5                   # device px per logical pixel of the astronaut

# (portrait logical width, portrait logical height, dpr, label)
DEVICES = [
    (320, 568, 2, 'iPhone SE 1st / 5s'),
    (375, 667, 2, 'iPhone SE 2nd-3rd / 8'),
    (414, 736, 3, 'iPhone 8 Plus'),
    (375, 812, 3, 'iPhone X / XS / 11 Pro / 12-13 mini'),
    (414, 896, 2, 'iPhone XR / 11'),
    (414, 896, 3, 'iPhone XS Max / 11 Pro Max'),
    (390, 844, 3, 'iPhone 12 / 13 / 14'),
    (393, 852, 3, 'iPhone 14 Pro / 15 / 16'),
    (428, 926, 3, 'iPhone 12-13 Pro Max / 14 Plus'),
    (430, 932, 3, 'iPhone 14 Pro Max / 15-16 Plus & Pro Max'),
]


def astronaut():
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        'make_icons', os.path.join(HERE, 'make-icons.py'))
    mk = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mk)
    logical = mk.load_logical()
    return logical.resize((mk.GRID_W * BLOCK, mk.GRID_H * BLOCK), Image.NEAREST)


def filename(pw, ph, dpr):
    return '%dx%d@%dx.png' % (ph * dpr, pw * dpr, dpr)


def links():
    out = []
    for pw, ph, dpr, label in DEVICES:
        out.append(
            '  <link rel="apple-touch-startup-image" href="assets/startup/%s"\n'
            '        media="screen and (device-width: %dpx) and (device-height: %dpx) '
            'and (-webkit-device-pixel-ratio: %d) and (orientation: landscape)">'
            % (filename(pw, ph, dpr), pw, ph, dpr))
    return '\n'.join(out)


def main():
    if '--print-links' in sys.argv:
        print(links())
        return
    art = astronaut()
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for pw, ph, dpr, label in DEVICES:
        w, h = ph * dpr, pw * dpr          # landscape
        img = Image.new('RGB', (w, h), BG)
        img.paste(art, ((w - art.width) // 2, (h - art.height) // 2), art)
        name = filename(pw, ph, dpr)
        img.save(os.path.join(OUT, name))
        size = os.path.getsize(os.path.join(OUT, name))
        total += size
        print('  %-16s %5dx%-5d %6.1f KB  %s' % (name, w, h, size / 1024, label))
    print('%d images, %.1f KB total' % (len(DEVICES), total / 1024))


if __name__ == '__main__':
    main()
