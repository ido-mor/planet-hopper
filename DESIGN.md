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
| `danceAnim` | level-complete astronaut |
| `flash` | GAME OVER text |

Key press: `transform: scale(0.96)` 0.06s. No extra animation libraries.

## Icons

- Home Screen / favicon: pixel rocket (red nose, white body, blue window, red fins, blue base) on `#1a1a2e`. **No ring.** `icon-192.png` must fill the 192×192 frame (downscale of `icon-512.png`), not a quarter-sized sprite with a white L around it.
- Manifest `background_color` / `theme_color`: `#1a1a2e`.
