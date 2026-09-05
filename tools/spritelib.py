"""Tiny pixel-art drawing helpers shared by the sprite generators.

Everything is drawn at native resolution (one array cell == one art pixel) and
scaled up in CSS with image-rendering: pixelated, so there is no anti-aliasing
anywhere in this pipeline.
"""

from PIL import Image

TRANSPARENT = None


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[None] * w for _ in range(h)]

    def set(self, x, y, c):
        if c is None:
            return
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = c

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.px[y][x]
        return None

    def rect(self, x0, y0, x1, y1, c):
        """Inclusive rectangle."""
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.set(x, y, c)

    def hline(self, x0, x1, y, c):
        self.rect(x0, y, x1, y, c)

    def vline(self, x, y0, y1, c):
        self.rect(x, y0, x, y1, c)

    def poly(self, points, c):
        """Scanline fill of a closed polygon, vertices in art-pixel coords."""
        ys = [p[1] for p in points]
        for y in range(min(ys), max(ys) + 1):
            spans = []
            n = len(points)
            for i in range(n):
                x0, y0 = points[i]
                x1, y1 = points[(i + 1) % n]
                if y0 == y1:
                    continue
                if min(y0, y1) <= y <= max(y0, y1) - 0 and (y0 <= y < y1 or y1 <= y < y0):
                    t = (y - y0) / float(y1 - y0)
                    spans.append(x0 + t * (x1 - x0))
            spans.sort()
            for i in range(0, len(spans) - 1, 2):
                for x in range(int(round(spans[i])), int(round(spans[i + 1])) + 1):
                    self.set(x, y, c)

    def taper(self, cx, y0, y1, half0, half1, c):
        """Vertical cone: half-width eases from half0 at y0 to half1 at y1."""
        for y in range(y0, y1 + 1):
            t = 0 if y1 == y0 else (y - y0) / float(y1 - y0)
            half = int(round(half0 + (half1 - half0) * t))
            self.rect(cx - half, y, cx + half, y, c)

    def outline(self, c, over=None):
        """Wrap every filled cell in a 4-connected border of colour c."""
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.px[y][x] is not None:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    n = self.get(x + dx, y + dy)
                    if n is not None and (over is None or n in over):
                        add.append((x, y))
                        break
        for x, y in add:
            self.set(x, y, c)

    def dither(self, x0, y0, x1, y1, c, parity=0, only=None):
        """Checkerboard speckle, used for shading transitions."""
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if (x + y) % 2 != parity:
                    continue
                if only is not None and self.get(x, y) not in only:
                    continue
                self.set(x, y, c)

    def speckle(self, cells, c, only=None):
        for x, y in cells:
            if only is None or self.get(x, y) in only:
                self.set(x, y, c)

    def mirror_x(self, cx):
        """Mirror the left half onto the right across column cx."""
        for y in range(self.h):
            for x in range(cx):
                v = self.px[y][x]
                mx = 2 * cx - x
                if 0 <= mx < self.w:
                    self.px[y][mx] = v

    def image(self):
        im = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        px = im.load()
        for y in range(self.h):
            for x in range(self.w):
                c = self.px[y][x]
                if c is not None:
                    px[x, y] = c + (255,)
        return im

    def paste_from(self, other, ox, oy):
        for y in range(other.h):
            for x in range(other.w):
                self.set(x + ox, y + oy, other.px[y][x])
