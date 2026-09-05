# Planet Hopper — visual tokens

Extracted from `styles.css` / `manifest.webmanifest`. If this file and CSS disagree, **CSS wins**.

## Aesthetic

Donkey Kong / 8-bit pixel art. Limited palette, chunky borders, `image-rendering: pixelated` / `crisp-edges`. Ships, planets, astronauts, and lives are CSS boxes or inline SVG data URIs — not bitmaps (except Home Screen icons).

## Color

| Token | Hex | Use |
|---|---|---|
| Space / page | `#1a1a2e` | `body`, theme_color, display well, ship outline |
| Deep panel | `#0f0f1a` | Map, intro, load overlay, answer viewport bg |
| Cockpit fill | `#2a2a3e` | `.cockpit-frame` |
| Frame / path | `#3d3d5c` | Borders, path dots |
| Frame highlight | `#5c5c8a` | Inner rivet line, empty answer ellipsis, empty life stroke |
| UI text | `#e8e8e8` | Body, problem, score |
| Muted header | `#a0a0c0` | Level label, “Score” word |
| Answer digits | `#f0e860` | Typed answer |
| Earth ground | `#4a5a3a` | Level-1 ground + intro ground (border `#3d4a2e`) |
| Nose / fins | `#c41e3a` | Rocket red |
| Body | `#f0f0f0` | Rocket white |
| Window / base | `#4169e1` | Rocket blue |
| Flame | `#ff6600` / `#ffaa00` | Engine, explosion |
| Key pad | `#2f3035` | Number keys |
| Delete key | `#4f5158` | |
| Submit | `#ff9f0a` | |
| Correct | `#00aa00` | Check stroke |
| Wrong / game over | `#aa0000` / `#ff4444` | X stroke, GAME OVER |
| Tap-to-play | `#8f8` | |

Planet cycle (`PLANET_COLORS` in `game.js`): `#e8c040` gold, `#40c060` green, `#4080e0` blue, `#e08040` orange, `#a040e0` purple, `#e04050` red, `#40c0c0` teal, `#c06090` pink.

Title outline cycles cyan / magenta / yellow / green (`#0ff`, `#f0f`, `#ff0`, `#0f8`) via `text-shadow`. Title fill is `#000`.

## Type

- **Title:** `Pixeboy` (`fonts/Pixeboy-z8XGD.ttf`), `clamp(48px, 12vw, 96px)`.
- **UI / keypad / problem:** `"Press Start 2P", monospace` (Google Fonts). Body 20px; problem 24px (smaller in the iPhone landscape query); answer viewport 26px; keypad `clamp(14px, 4.2vw, 28px)`.
- Letter-spacing on GAME OVER and answer digits. User-select disabled.

## Layout

- Full viewport: `100vw` × `100dvh`, `overflow: hidden`, overscroll none.
- Game: flex row, map `flex: 0 0 20%` (min 120px), cockpit the rest. Cockpit frame `max-width: 560px`, desktop `min-height: 480px`.
- Header above the frame: lives | level | score.
- Keypad: 6 columns, last column `minmax(0, 2.2fr)`. Number keys `aspect-ratio: 1; border-radius: 50%`. Del/Submit `border-radius: 999px`, stretch.
- iPhone landscape: `@media (orientation: landscape) and (max-height: 500px)` compresses planets, keypad, header, and cockpit padding so Del/Submit stay on screen.
- Portrait phones: rotate overlay only (`z-index: 50`).

## Motion (keep these)

| Name | Behavior |
|---|---|
| `flameFlicker` | 0.08s scale/opacity loop on thrust |
| ship `top` | `0.5s ease-out`; `.thrusting` shows flame |
| `feedbackInOut` | 1.2s check/X |
| `explode` | 1s on game over |
| `titleOutline` | 3s color cycle |
| `titleFadeOut` | 500ms `steps(8, end)` |
| `clickPulse` | 1.5s opacity on “Tap to play.” |
| `climbLadder` | astronaut intro |
| `rocketBlastOff` | duration set in JS from launch SFX length (fallback 3.5s) |
| `countdownPop` | 1s per numeral |
| `astronautDanceFrames` | level-complete astronaut, 10 poses over 0.9s |
| `flash` | GAME OVER text |

Key press: `transform: scale(0.96)` 0.06s. No extra animation libraries.

## Icons

- Home Screen / favicon: pixel rocket (red nose, white body, blue window, red fins, blue base) on `#1a1a2e`. **No ring.** `icon-192.png` must fill the 192×192 frame (downscale of `icon-512.png`), not a quarter-sized sprite with a white L around it.
- Manifest `background_color` / `theme_color`: `#1a1a2e`.

## Pixel sprites

The intro and the gameplay ship/lives/level-complete art are native-resolution
PNGs under `assets/sprites/`, scaled up in CSS with `image-rendering: pixelated`.
Nothing is anti-aliased and nothing is hand-edited — regenerate instead:

```bash
python3 tools/make-sprites.py
python3 tools/make-astronaut-sheet.py
python3 tools/make-dance-sheet.py
```

| Sprite | Native size | Notes |
|---|---|---|
| `rocket-idle.png` | 76x127 | Hero rocket, stands on its fin tips |
| `rocket-fire.png` | 152x171 | Two flicker frames side by side |
| `rocket-small.png` | 24x30 | Map panel |
| `life-rocket.png` / `-empty.png` | 12x16 | HUD pips |
| `astronaut-walk.png` | 816x102 | 12 frames of 68x102 |
| `astronaut-dance.png` | 320x48 | 10 front-view dance poses of 32x48 |
| `countdown.png` | 224x26 | 4 cells of 56x26: 3 / 2 / 1 / GO! |
| `gantry.png` | 120x82 | Stepped ramp, platform, support tower |

Sprite palette: warm charcoal outline `#382e3e`, cream hull `#eae3d3`, cool steel
`#9eaab4`, orange-red `#cb5436` with gold `#f3c05a` accents, teal glass `#5cb2b2`.
Countdown digits run cream -> yellow `#f7cb2e` -> orange -> red with a
checkerboard dither at the base.

Intro sizing is driven by `--rocket-h` on `.intro-overlay`; the gantry and
astronaut are derived from it so the ramp always meets the hull hatch.
