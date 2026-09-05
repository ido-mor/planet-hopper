#!/usr/bin/env python3
"""Draw Planet Hopper's original pixel-art sprites.

Everything here is authored from scratch. The supplied spaceship-*.png files
were style reference only (palette, shading density, the way the shuttle stands
on its fin tips) and are not copied.

Native sizes match the astronaut's grid so the two read as one set:
  rocket-idle.png      76x127
  rocket-fire.png      152x171   (two flicker frames side by side)
  countdown.png        124x31    (3 / 2 / 1 / GO!)
  gantry.png           132x86
  rocket-small.png     24x30     (map panel)
  life-rocket.png      12x16     life-rocket-empty.png 12x16

Usage: python3 tools/make-sprites.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spritelib import Canvas  # noqa: E402

OUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "assets", "sprites"
)

# --- palette -----------------------------------------------------------------
INK      = (56, 46, 62)     # outline, a warm charcoal rather than pure black
INK_SOFT = (86, 76, 94)

CREAM_HI = (250, 246, 236)
CREAM    = (234, 227, 211)
CREAM_LO = (206, 201, 190)

STEEL_HI = (198, 208, 214)
STEEL    = (158, 170, 180)
STEEL_LO = (112, 126, 140)
STEEL_DK = (78, 90, 104)

RED_HI   = (233, 130, 76)
RED      = (203, 84, 54)
RED_LO   = (160, 56, 44)
RED_DK   = (118, 40, 38)
GOLD     = (243, 192, 90)
INK_BLACK = (18, 16, 24)

TEAL_HI  = (176, 232, 226)
TEAL     = (92, 178, 178)
TEAL_LO  = (52, 122, 132)

F_CORE   = (255, 245, 205)
F_GOLD   = (250, 202, 78)
F_ORANGE = (240, 138, 52)
F_RED    = (212, 68, 46)

RW, RH = 76, 127
CX = 38


def _row_span(c, y, colors, x0=0, x1=None):
    x1 = c.w if x1 is None else x1
    xs = [x for x in range(x0, x1) if c.get(x, y) in colors]
    return (min(xs), max(xs)) if xs else None


def draw_rocket():
    """The hero rocket: 76x127, standing on its fin tips. Light from the left."""
    c = Canvas(RW, RH)

    HULL_TOP, HULL_BOT = 32, 104
    HALF = 19

    # --- engine skirt, behind everything -----------------------------------
    c.rect(CX - 15, HULL_BOT, CX + 15, 122, STEEL)
    c.rect(CX - 15, HULL_BOT, CX - 6, 122, STEEL_HI)
    c.rect(CX + 8, HULL_BOT, CX + 15, 122, STEEL_LO)
    for y in (108, 115):
        c.hline(CX - 15, CX + 15, y, STEEL_DK)
    for x in (CX - 12, CX + 9):
        c.rect(x, 118, x + 1, 119, TEAL_LO)
    c.speckle([(28, 111), (46, 113), (30, 120), (44, 106)], CREAM, only=[STEEL,
              STEEL_HI, STEEL_LO])

    # --- fins: wide swept deltas bottoming out in a V -----------------------
    for side in (-1, 1):
        def m(x):
            return CX + side * (x - CX)
        c.poly([(m(21), 78), (m(18), 102), (m(0), 123), (m(0), 96)], RED)
    # Shade each column as a fraction of that column's depth, so the gradient
    # rides the swept leading edge no matter how thick the fin is there.
    for x in range(0, RW):
        if CX - 14 <= x <= CX + 14:
            continue
        ys = [y for y in range(70, 124) if c.get(x, y) == RED]
        if not ys:
            continue
        top, bot = min(ys), max(ys)
        depth = bot - top + 1
        near = x < CX                       # left fin faces the light
        lit = RED_HI if near else RED
        dark = RED_LO if near else RED_DK
        for y in range(top, bot + 1):
            f = (y - top) / float(depth)
            if f < 0.26:
                c.set(x, y, lit)
            elif f < 0.32:
                c.set(x, y, lit if (x + y) % 2 else RED)
            elif f < 0.62:
                c.set(x, y, RED)
            elif f < 0.68:
                c.set(x, y, dark if (x + y) % 2 else RED)
            else:
                c.set(x, y, dark)
        if x % 3 == 0:
            c.set(x, top, GOLD)
    c.speckle([(6, 106), (11, 114), (16, 120), (69, 108), (64, 116), (59, 121),
               (9, 100), (67, 102)],
              GOLD, only=[RED, RED_HI, RED_LO, RED_DK])

    # --- nose cone: short stepped pyramid, gold-lit across the left face ----
    for y0, y1, half in ((0, 2, 4), (3, 6, 7), (7, 10, 9), (11, 14, 11),
                         (15, 18, 13)):
        c.rect(CX - half, y0, CX + half, y1, RED)
        c.rect(CX - half, y0, CX - half + max(1, half - 6), y1, GOLD)
        c.rect(CX - half + max(1, half - 6) + 1, y0,
               CX - half + max(1, half - 6) + 2, y1, RED_HI)
        c.rect(CX + half - 3, y0, CX + half, y1, RED_LO)
        c.set(CX + half - 4, y1, RED_LO)
    # break up the gold field so it reads as flame, not a painted stripe
    c.speckle([(34, 2), (32, 6), (35, 10), (30, 14), (33, 17), (36, 4),
               (37, 12), (29, 18), (31, 9)], RED, only=[GOLD])
    c.speckle([(38, 3), (40, 8), (39, 12), (41, 16), (37, 18), (36, 7)],
              GOLD, only=[RED])

    # --- collar: stepped tiers widening down into the hull ------------------
    for y0, y1, half in ((19, 23, 15), (24, 31, 17)):
        c.rect(CX - half, y0, CX + half, y1, CREAM)
        c.rect(CX - half, y0, CX - half + 7, y1, CREAM_HI)
        c.rect(CX + half - 4, y0, CX + half, y1, CREAM_LO)
        c.rect(CX + half - 1, y0, CX + half, y1, STEEL)
        c.hline(CX - half, CX + half, y0, INK_SOFT)

    # --- main hull ---------------------------------------------------------
    c.rect(CX - HALF, HULL_TOP, CX + HALF, HULL_BOT, CREAM)
    c.rect(CX - HALF, HULL_TOP, CX - 15, HULL_BOT, STEEL_HI)
    c.rect(CX - 14, HULL_TOP, CX + 2, HULL_BOT, CREAM_HI)
    c.rect(CX + 12, HULL_TOP, CX + 15, HULL_BOT, CREAM_LO)
    c.rect(CX + 16, HULL_TOP, CX + HALF, HULL_BOT, STEEL)
    # single-column dithers keep the transitions soft without reading as stripes
    c.dither(CX - 15, HULL_TOP, CX - 14, HULL_BOT, CREAM_HI, parity=0)
    c.dither(CX + 3, HULL_TOP, CX + 4, HULL_BOT, CREAM_LO, parity=1)
    c.rect(CX + 16, HULL_TOP, CX + 17, HULL_BOT, STEEL_HI)
    c.dither(CX + 15, HULL_TOP, CX + 16, HULL_BOT, CREAM_LO, parity=1)
    # greeble ticks down the cool band
    for y in range(36, HULL_BOT - 2, 5):
        c.hline(CX - HALF, CX - 17, y, STEEL)
        c.set(CX - 16, y, STEEL_LO)
    for i, (x, y) in enumerate([(30, 40), (34, 55), (27, 68), (32, 80),
                                (25, 90), (36, 97), (29, 101), (41, 45),
                                (45, 63), (47, 86), (44, 99), (39, 36),
                                (26, 47), (43, 72), (33, 92), (48, 54),
                                (28, 58), (46, 41), (31, 86), (42, 91)]):
        c.set(x, y, CREAM_LO if i % 2 else STEEL_HI)

    # --- porthole: round, with a rim and a diagonal glint -----------------
    WCX, WCY, WR = CX, 53, 7

    def disc(radius, colour):
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                if dx * dx + dy * dy <= radius * radius + radius * 0.4:
                    c.set(WCX + dx, WCY + dy, colour)

    disc(WR, TEAL_LO)
    disc(WR - 1, TEAL)
    for dy in range(-WR + 1, WR):        # thin crescent of shade on the far side
        for dx in range(-WR + 1, WR):
            if dx * dx + dy * dy <= (WR - 1) ** 2 and dx - dy > 5:
                c.set(WCX + dx, WCY + dy, TEAL_LO)
    for i in range(6):                   # glint: one long streak, one short
        c.set(WCX - 3 + i, WCY + 2 - i, TEAL_HI)
    for i in range(2):
        c.set(WCX - 1 + i, WCY + 4 - i, TEAL_HI)

    # --- hull bands --------------------------------------------------------
    for y in (34, 76):
        c.hline(CX - HALF, CX + HALF, y, INK_SOFT)
        c.hline(CX - HALF, CX + HALF, y + 1, CREAM_HI)

    # --- central booster strut ---------------------------------------------
    c.taper(CX, 70, 75, 1, 3, RED)
    c.rect(CX - 3, 75, CX + 3, 126, RED)
    c.vline(CX - 3, 75, 126, RED_HI)
    c.vline(CX - 2, 70, 126, RED_HI)
    c.vline(CX + 3, 75, 126, RED_LO)
    for y in (90, 107):
        c.hline(CX - 3, CX + 3, y, RED_DK)

    c.outline(INK)
    return c


def flame(width, height, phase):
    """Exhaust plume: broad at the nozzle, tapering to a whipping tail."""
    f = Canvas(width, height)
    cx = width // 2
    stretch = 1.0 if phase == 0 else 0.88
    lean = 0 if phase == 0 else 1

    def tongue(half_top, half_bulge, length, colour, bulge_at=0.3):
        length = int(length * stretch)
        for y in range(0, length):
            t = y / float(length)
            if t < bulge_at:
                half = half_top + (half_bulge - half_top) * (t / bulge_at)
            else:
                # ease out to a point so the tail feathers instead of wedging
                k = (t - bulge_at) / (1 - bulge_at)
                half = half_bulge * (1 - k ** 1.6)
            h = int(round(half))
            if h < 0:
                continue
            off = lean if t > 0.55 else 0
            f.rect(cx - h + off, y, cx + h + off, y, colour)

    tongue(11, 14, height, F_RED)
    tongue(8, 11, int(height * 0.82), F_ORANGE)
    tongue(5, 7, int(height * 0.58), F_GOLD)
    tongue(2, 4, int(height * 0.32), F_CORE)
    # a few licks of flame breaking off the edges
    f.speckle([(cx - 15, 18), (cx + 15, 24), (cx - 14, 33), (cx + 13, 38)]
              if phase == 0 else
              [(cx - 14, 21), (cx + 16, 20), (cx - 13, 36), (cx + 12, 42)],
              F_RED)
    f.dither(cx - 13, int(height * 0.62), cx + 13, height - 1, F_ORANGE,
             parity=phase, only=[F_RED])
    return f


def draw_rocket_fire():
    """Two flicker frames of the rocket with its plume lit."""
    fw, fh = RW, 171
    sheet = Canvas(fw * 2, fh)
    body = draw_rocket()
    for phase in (0, 1):
        frame = Canvas(fw, fh)
        fl = flame(38, 58, phase)
        fl.outline(INK)
        frame.paste_from(fl, CX - 19, 112)
        frame.paste_from(body, 0, 0)
        sheet.paste_from(frame, phase * fw, 0)
    return sheet


def draw_small_rocket():
    """24x30 simplification for the map panel, same palette and stance."""
    c = Canvas(24, 30)
    cx = 12
    for side in (-1, 1):
        def m(x):
            return cx + side * (x - cx)
        c.poly([(m(7), 17), (m(7), 27), (m(2), 27), (m(2), 22)], RED)
        c.poly([(m(7), 17), (m(7), 27), (m(5), 27), (m(5), 20)], RED_LO)
    c.taper(cx, 1, 6, 1, 4, RED)
    c.taper(cx, 1, 6, 0, 2, RED_HI)
    c.rect(cx - 6, 7, cx + 6, 25, CREAM)
    c.rect(cx - 6, 7, cx - 3, 25, CREAM_HI)
    c.rect(cx + 4, 7, cx + 6, 25, STEEL)
    c.rect(cx - 3, 11, cx + 2, 17, TEAL_LO)
    c.rect(cx - 2, 12, cx + 1, 16, TEAL)
    c.set(cx - 2, 15, TEAL_HI); c.set(cx - 1, 14, TEAL_HI)
    c.hline(cx - 6, cx + 6, 9, INK_SOFT)
    c.rect(cx - 5, 24, cx + 5, 27, STEEL)
    c.rect(cx - 5, 24, cx - 1, 27, STEEL_HI)
    c.rect(cx - 1, 18, cx + 1, 29, RED)
    c.vline(cx - 1, 18, 29, RED_HI)
    c.outline(INK)
    return c


def draw_life_rocket(full=True):
    """12x16 HUD pip."""
    c = Canvas(12, 16)
    cx = 6
    if not full:
        # spent life: the same silhouette, drained to a dim ghost so the slot
        # still reads as a rocket rather than an abstract outline
        ghost = draw_life_rocket(True)
        drained = Canvas(ghost.w, ghost.h)
        ramp = {INK: INK, RED: STEEL_LO, RED_LO: STEEL_DK, RED_HI: STEEL_LO,
                CREAM: STEEL_LO, CREAM_HI: STEEL, STEEL: STEEL_DK,
                TEAL: STEEL_DK, TEAL_HI: STEEL_LO}
        for y in range(ghost.h):
            for x in range(ghost.w):
                c0 = ghost.get(x, y)
                if c0 is not None:
                    drained.set(x, y, ramp.get(c0, STEEL_DK))
        return drained

    c.taper(cx, 1, 4, 0, 2, RED)
    c.rect(cx - 4, 5, cx + 3, 12, CREAM)
    c.rect(cx - 4, 5, cx - 2, 12, CREAM_HI)
    c.rect(cx + 2, 5, cx + 3, 12, STEEL)
    c.rect(cx - 2, 7, cx + 1, 10, TEAL)
    c.set(cx - 2, 9, TEAL_HI)
    c.poly([(cx - 4, 10), (cx - 4, 14), (cx - 6, 14)], RED)
    c.poly([(cx + 3, 10), (cx + 3, 14), (cx + 5, 14)], RED)
    c.rect(cx - 1, 12, cx, 15, RED_LO)
    c.outline(INK)
    return c


# --- countdown digits --------------------------------------------------------
# Chunky numerals: cream cap, yellow body, orange/red dithered base, thick ink
# outline and an offset drop shadow -- matching the supplied 3/2/1 artwork.

GLYPHS = {
    "3": [
        "...XXXXXXXXXX...",
        "..XXXXXXXXXXXX..",
        ".XXXXXXXXXXXXXX.",
        ".XXXX......XXXXX",
        ".XXX........XXXX",
        "............XXXX",
        "...........XXXXX",
        ".........XXXXXX.",
        "....XXXXXXXXXX..",
        "....XXXXXXXXXX..",
        ".........XXXXXX.",
        "...........XXXXX",
        "............XXXX",
        ".XXX........XXXX",
        ".XXXX......XXXXX",
        ".XXXXXXXXXXXXXX.",
        "..XXXXXXXXXXXX..",
        "...XXXXXXXXXX...",
    ],
    "2": [
        "...XXXXXXXXXX...",
        "..XXXXXXXXXXXX..",
        ".XXXXXXXXXXXXXX.",
        ".XXXX......XXXXX",
        ".XXX........XXXX",
        "............XXXX",
        "...........XXXXX",
        "..........XXXXX.",
        ".........XXXXX..",
        "........XXXXX...",
        ".......XXXXX....",
        "......XXXXX.....",
        ".....XXXXX......",
        "....XXXXX.......",
        "...XXXXX........",
        "..XXXXXXXXXXXXXX",
        ".XXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXX",
    ],
    "1": [
        "......XXXXXX....",
        ".....XXXXXXX....",
        "....XXXXXXXX....",
        "...XXXXXXXXX....",
        "..XXXXX.XXXX....",
        ".XXXXX..XXXX....",
        ".XXXX...XXXX....",
        "........XXXX....",
        "........XXXX....",
        "........XXXX....",
        "........XXXX....",
        "........XXXX....",
        "........XXXX....",
        "........XXXX....",
        "........XXXX....",
        "....XXXXXXXXXXX.",
        "...XXXXXXXXXXXX.",
        "..XXXXXXXXXXXXXX",
    ],
    "G": [
        "....XXXXXXXX....",
        "..XXXXXXXXXXXX..",
        ".XXXXXXXXXXXXXX.",
        ".XXXX......XXXX.",
        "XXXX........XXX.",
        "XXXX............",
        "XXXX............",
        "XXXX............",
        "XXXX....XXXXXXX.",
        "XXXX....XXXXXXX.",
        "XXXX.......XXXX.",
        "XXXX.......XXXX.",
        "XXXX.......XXXX.",
        ".XXXX......XXXX.",
        ".XXXXX....XXXXX.",
        ".XXXXXXXXXXXXXX.",
        "..XXXXXXXXXXXX..",
        "....XXXXXXXX....",
    ],
    "O": [
        "....XXXXXXXX....",
        "..XXXXXXXXXXXX..",
        ".XXXXXXXXXXXXXX.",
        ".XXXX......XXXX.",
        "XXXX........XXXX",
        "XXXX........XXXX",
        "XXXX........XXXX",
        "XXXX........XXXX",
        "XXXX........XXXX",
        "XXXX........XXXX",
        "XXXX........XXXX",
        "XXXX........XXXX",
        "XXXX........XXXX",
        ".XXXX......XXXX.",
        ".XXXXX....XXXXX.",
        ".XXXXXXXXXXXXXX.",
        "..XXXXXXXXXXXX..",
        "....XXXXXXXX....",
    ],
    "!": [
        ".XXXXXX.",
        "XXXXXXXX",
        "XXXXXXXX",
        "XXXXXXXX",
        "XXXXXXXX",
        ".XXXXXX.",
        ".XXXXXX.",
        ".XXXXXX.",
        "..XXXX..",
        "..XXXX..",
        "..XXXX..",
        "........",
        "........",
        "........",
        ".XXXXXX.",
        "XXXXXXXX",
        "XXXXXXXX",
        ".XXXXXX.",
    ],
}

DIGIT_CELL_W, DIGIT_CELL_H = 56, 26


def _draw_glyph(c, mask, ox, oy):
    """Paint one glyph: vertical colour ramp, then outline, then drop shadow."""
    rows = len(mask)
    body = []
    for y, row in enumerate(mask):
        for x, ch in enumerate(row):
            if ch != "X":
                continue
            f = y / float(rows - 1)
            if f < 0.14:
                col = (255, 244, 206)          # cream cap
            elif f < 0.60:
                col = (247, 203, 46)           # yellow body
            elif f < 0.76:
                col = (247, 203, 46) if (x + y) % 2 else (245, 152, 40)
            elif f < 0.88:
                col = (245, 152, 40) if (x + y) % 2 else (232, 96, 42)
            else:
                col = (232, 96, 42) if (x + y) % 2 else (219, 58, 44)
            c.set(ox + x, oy + y, col)
            body.append((ox + x, oy + y))
    return body


def draw_countdown():
    """124-wide strip is not enough for GO!, so every cell is 44 wide."""
    steps = [["3"], ["2"], ["1"], ["G", "O", "!"]]
    sheet = Canvas(DIGIT_CELL_W * len(steps), DIGIT_CELL_H)
    for i, glyphs in enumerate(steps):
        cell = Canvas(DIGIT_CELL_W, DIGIT_CELL_H)
        widths = [len(GLYPHS[g][0]) for g in glyphs]
        total = sum(widths) + (len(glyphs) - 1)
        x = (DIGIT_CELL_W - total) // 2
        y = (DIGIT_CELL_H - 18) // 2 - 1
        for g, w in zip(glyphs, widths):
            _draw_glyph(cell, GLYPHS[g], x, y)
            x += w + 1
        cell.outline(INK_BLACK)
        cell.outline(INK_BLACK)
        # drop shadow, painted only where nothing is already drawn
        shadow = Canvas(DIGIT_CELL_W, DIGIT_CELL_H)
        for yy in range(DIGIT_CELL_H):
            for xx in range(DIGIT_CELL_W):
                if cell.get(xx, yy) is not None:
                    shadow.set(xx + 2, yy + 2, INK_BLACK)
        for yy in range(DIGIT_CELL_H):
            for xx in range(DIGIT_CELL_W):
                if cell.get(xx, yy) is None and shadow.get(xx, yy) is not None:
                    cell.set(xx, yy, INK_BLACK)
        sheet.paste_from(cell, i * DIGIT_CELL_W, 0)
    return sheet


# --- launch gantry -----------------------------------------------------------

GANTRY_W, GANTRY_H = 120, 82
GANTRY_STEPS = 12
GANTRY_RUN, GANTRY_RISE = 8, 5


def draw_gantry():
    """Stepped access ramp on an open truss, with a support tower at the top."""
    c = Canvas(GANTRY_W, GANTRY_H)
    ground = GANTRY_H - 1

    def step_top(i):
        return ground - (i + 1) * GANTRY_RISE

    # stringer: a thin beam running under the treads
    for i in range(GANTRY_STEPS):
        x0 = i * GANTRY_RUN
        c.rect(x0, step_top(i) + GANTRY_RISE, x0 + GANTRY_RUN - 1,
               step_top(i) + GANTRY_RISE + 3, STEEL)
        c.hline(x0, x0 + GANTRY_RUN - 1, step_top(i) + GANTRY_RISE + 3, STEEL_LO)

    # treads and risers
    for i in range(GANTRY_STEPS):
        x0 = i * GANTRY_RUN
        top = step_top(i)
        c.rect(x0, top, x0 + GANTRY_RUN - 1, top + 1, STEEL_HI)
        c.rect(x0, top + 2, x0 + 1, top + GANTRY_RISE - 1, STEEL)
        c.set(x0 + GANTRY_RUN - 1, top + 2, STEEL_LO)

    # open cross-bracing under the stringer
    for i in range(1, GANTRY_STEPS, 2):
        x0 = i * GANTRY_RUN
        top = step_top(i) + GANTRY_RISE + 4
        legs = ground - top
        if legs < 4:
            continue
        c.vline(x0, top, ground - 2, STEEL_LO)
        c.vline(x0 + 1, top, ground - 2, STEEL_DK)
        for k in range(legs - 2):        # diagonal brace out to the next leg
            x = x0 + 2 + int(k * (2 * GANTRY_RUN - 4) / float(max(legs - 3, 1)))
            c.set(x, top + k, STEEL_DK)
            c.set(x + 1, top + k, STEEL_LO)

    # ground rail
    c.hline(0, GANTRY_W - 1, ground - 1, STEEL)
    c.hline(0, GANTRY_W - 1, ground, STEEL_LO)

    # top platform and the tower carrying it
    plat_top = step_top(GANTRY_STEPS - 1)
    c.rect(GANTRY_STEPS * GANTRY_RUN, plat_top, GANTRY_W - 1,
           plat_top + 1, STEEL_HI)
    c.rect(GANTRY_STEPS * GANTRY_RUN, plat_top + 2, GANTRY_W - 1,
           plat_top + 3, STEEL)
    c.rect(GANTRY_W - 7, plat_top + 4, GANTRY_W - 3, ground - 2, STEEL)
    c.vline(GANTRY_W - 7, plat_top + 4, ground - 2, STEEL_HI)
    c.vline(GANTRY_W - 3, plat_top + 4, ground - 2, STEEL_LO)
    for y in range(plat_top + 8, ground - 4, 6):
        c.hline(GANTRY_W - 6, GANTRY_W - 4, y, STEEL_LO)

    c.outline(INK)
    return c


def save(canvas, name):
    path = os.path.join(OUT_DIR, name)
    canvas.image().save(path, optimize=True)
    print("%-24s %dx%d  %d bytes"
          % (name, canvas.w, canvas.h, os.path.getsize(path)))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    save(draw_rocket(), "rocket-idle.png")
    save(draw_rocket_fire(), "rocket-fire.png")
    save(draw_small_rocket(), "rocket-small.png")
    save(draw_life_rocket(True), "life-rocket.png")
    save(draw_life_rocket(False), "life-rocket-empty.png")
    save(draw_countdown(), "countdown.png")
    save(draw_gantry(), "gantry.png")


if __name__ == "__main__":
    main()
