# Planet Hopper — agent instructions

**Conflict rule:** Implemented code wins over this file and every other doc (`README.md`, `DESIGN.md`, `HANDOFF.md`, `sounds/README.md`, Cursor rules). If docs and code disagree, trust `index.html` / `styles.css` / `game.js` / `sw.js` and update the docs.

Do not re-derive product or architecture. Decisions below are confirmed from the current codebase.

---

## What this is

Landscape math rocket **progressive web app**. Solve arithmetic (and, on level 5, rounding) to fly a pixel ship from the ground planet to the target planet. 10 correct answers land you; wrong answers drop you a step and cost a life.

Live: **https://ido-mor.github.io/planet-hopper/**  
Repo: `https://github.com/ido-mor/planet-hopper`  
Not an App Store / Play Store app. Install via Add to Home Screen from Safari (iPhone) or Chrome (Android).

## Stack

| Item | Choice |
|---|---|
| Runtime | Static HTML + CSS + vanilla JS (IIFE in `game.js`). No framework, bundler, TypeScript, or npm dependencies. |
| Fonts | Local `fonts/Pixeboy-z8XGD.ttf` (title). Google Fonts **Press Start 2P** (UI). |
| PWA | `manifest.webmanifest` + `sw.js`. Service worker registers only in a **secure context** (HTTPS or localhost). |
| Audio | Long loop on an `<audio>` element. Short SFX via Web Audio decoded buffers so iOS can overlap them. |
| Hosting | GitHub Pages. Paths are relative (`./`) on purpose. |
| Tests | None. No CI. |

`package.json` `"name"` is still `math-rocket-game` (legacy). Product name is **Planet Hopper**. HTML `<title>` is still `Astronaut Math Rocket`.

## How to run

From the repo root:

```bash
npm start
```

Opens nothing by itself. Browse **http://127.0.0.1:8000**.

Phone on the same Wi-Fi (local testing only — iOS will **not** treat this HTTP URL as a real offline PWA):

```bash
npm run iphone
```

Then open the printed `http://192.168.x.x:8000`. See `LOCAL_IPHONE_SETUP.md`.

There is **no build step** and **no test command**. After UI or game changes, play the landscape flow in a browser (iPhone Safari / Home Screen is the real target).

When you bump cached assets, increment `CACHE_NAME` in `sw.js` (currently `planet-hopper-v9`) so installed copies pick up the change. Hard-refresh or re-open the Home Screen app after a cache bump.

---

## Confirmed product / architecture decisions

### Layout and orientation
- **Landscape-only** on phones. Portrait (`orientation: portrait` and `max-width: 900px`) hides `.game-container` / `.intro-overlay` and shows `.rotate-device-overlay`.
- Split: left **map ~20%**, right **cockpit ~80%**. Header is lives (left) / level (center) / score (right).
- Cockpit is a pixel “calculator”: problem text, separate **answer viewport**, then keypad. Do not inline the typed answer back into the equation.
- Safe-area insets are applied on `body` padding and overlays. Target iPhone landscape (including X-class notch).

### Start flow (two taps — keep this)
iOS Safari / Home Screen blocks unmuted audio until a user gesture. The **two-tap unlock is intentional**, not a leftover hack to collapse:

1. Black screen: **Tap to load game.** — unlocks Web Audio, starts looping `sounds/Hero Immortal.mp3`.
2. Title screen: **Tap to play.** — fades Hero Immortal, pixel-fades the title, then the astronaut climb / doors / 3-2-1-GO / blast-off.

Do not autoplay Hero Immortal. Do not merge the two screens into one tap.

### Intro / launch
- After tap-to-play: title fades (`titleFadeOut` steps), astronaut climbs the ladder, shuttle doors open, then countdown **3, 2, 1, GO!**.
- Optional engine bed `sounds/rocket.mp3` fades in ~0.3s / out ~0.5s over ~4s if the file exists and has a duration. **The file is not in the repo**; missing is fine.
- Blast-off animation duration matches `rocket_launch.wav` length when known.
- Launch scaffolding is **static**. Do not reintroduce a shifting blue rocket-body detail.

### Gameplay
- **10 steps** from ground to target (`state.currentStep` 0–10). Ship `top` is computed from ground/planet bounding rects (`updateShipPosition`), not from the `.path-step` dots.
- **3 lives**, shown as mini rockets. Wrong answer: −1 life, −1 step (floor 0), explosion on game over.
- **Score:** `10 + (level - 1) * 5` points per correct; same amount subtracted on wrong. Comma-format numbers ≥ 1000.
- **Lives and score carry over** on Continue. `startLevel()` (after intro / Play Again) resets level progress: `currentStep = 0`, `lives = 3`, `score = 0`. Do not call `startLevel()` when advancing a planet.
- Planets cycle `PLANET_COLORS` (8 colors). Level 1 ground is earth green `#4a5a3a`; later levels use the previous planet color as ground.
- Levels are infinite. `#winOverlay` exists in the DOM but is **unused**; level win is `#levelCompleteOverlay` (“Great job! Advance to next planet!”). Do not revive the win overlay as the level-complete path.

### Math by level (do not rebalance without asking)
- **1:** 1–2 digit add/sub.
- **2:** add parentheticals; answers max 99.
- **3:** three-digit; parentheticals max 999.
- **4:** mix of two-digit and four-digit add/sub (commas in 4-digit).
- **5:** **estimation only** — round a whole number ≤ 900,000 to a random place (tens … hundred thousands).
- **6:** single-digit × two-digit (and single × single).
- **7+:** two-digit × single-digit, etc. **No division yet.**
- **10+:** division (`÷`), integer quotients generated as `answer * b`.

Operators in text: `+`, `-`, `x` (not `*`), `÷`. Answers are non-negative integers. Typed input max **7 digits**, no commas (parser strips commas if present). Submit is disabled while empty.

**Grading:** compare parsed input to `state.currentProblem.answer`, then **override expected** with `solveFromProblemText()` when that parse succeeds. Keep both. Do not grade from a stored number alone.

### Keypad
Two rows, six columns: `1–5` + Del, then `6–0` + Submit. Number keys are **circular**; Del and Submit are **pill-shaped** and stretch in the last, wider column (`minmax(0, 2.2fr)`). Click sound on digits/delete, not on Submit. Keyboard: `0–9`, Enter, Backspace.

### Audio
| Event | File | Playback |
|---|---|---|
| Load / game over | `sounds/Hero Immortal.mp3` | `<audio id="startSoundtrack">` loop |
| Countdown | `sounds/3 2 1 go_noise-removal_equalized_lower.mp3` | Web Audio SFX |
| Optional engine | `sounds/rocket.mp3` | HTML audio fade; **file absent** |
| Blast-off | `sounds/rocket_launch.wav` | Web Audio SFX |
| Level complete | `sounds/newthingget.mp3` | Web Audio SFX |
| Correct | `sounds/Picked Coin Echo 2.mp3` | Web Audio SFX |
| Wrong | `sounds/thunk.wav` | Web Audio SFX |
| Keypad | `sounds/click_sound_6.mp3` | Web Audio SFX |

Filenames contain **spaces**. `encodeAssetUrl()` encodes each path segment for `fetch`. Missing optional clips must not crash the game.

On iOS, short overlapping SFX **must** go through Web Audio. Falling back to HTML `<audio>` for SFX is desktop-only (`!isLikelyIOS()`). Do not “simplify” back to HTML-audio-only SFX.

### PWA / icons
- Manifest: name Planet Hopper, `display: standalone`, `orientation: landscape`, theme `#1a1a2e`.
- Icons: `assets/icons/apple-touch-icon.png` (180), `icon-192.png` (favicon + manifest), `icon-512.png`. **No circular ring** around the rocket. Favicon must be the **full rocket filling the square** (scale from 512); do not ship a 192 file that only paints the top-left quadrant.
- SW: `skipWaiting` + `clients.claim`. Navigations are **network-first** (so deploys show up); other same-origin GETs are **stale-while-revalidate**. Required assets must `cache.addAll`; optional sounds use `Promise.allSettled`.

### Auth / routing
None. Single page. No accounts, no router, no backend.

---

## File / component map

| Path | Role |
|---|---|
| `index.html` | Markup: overlays, map, cockpit, keypad, `<audio>` tags, SW register snippet |
| `styles.css` | All layout, pixel art (ships/planets/astronauts as CSS/SVG), motion, landscape media query |
| `game.js` | State machine, math generator, grading, audio, intro timeline, input |
| `sw.js` | Cache name + offline + update strategy |
| `manifest.webmanifest` | PWA install metadata |
| `package.json` | `start`, `iphone` scripts only |
| `start-iphone.sh` | LAN `python3 -m http.server` bound to `0.0.0.0` |
| `fonts/Pixeboy-z8XGD.ttf` | Title typeface |
| `assets/icons/` | Home Screen / favicon PNGs |
| `sounds/` | Audio clips + `sounds/README.md` |
| `README.md` | Player-facing install / share / run |
| `LOCAL_IPHONE_SETUP.md` | Same-Wi-Fi iPhone testing |
| `DESIGN.md` | Visual tokens (palette, type, motion) |
| `HANDOFF.md` | **Current session only** — not standing rules |

DOM ids that `game.js` owns: `shipContainer`, `explosion`, `targetPlanet`, `groundPlanet`, `mathProblem`, `answerInputDisplay`, `keypad`, `feedbackOverlay` / `feedbackCheck` / `feedbackX`, `gameOverOverlay`, `levelCompleteOverlay`, `winOverlay` (unused), `introOverlay`, `loadGameOverlay`, `clickToStart`, `blastOffScene`, `countdownOverlay`, `astronaut`, `doorLeft` / `doorRight`, `playAgainBtn` / `playAgainBtnWin`, `btnSubmit` / `btnDelete`, audio elements listed in `index.html`.

---

## Conventions

### Styling
See **`DESIGN.md`**. Pixel / Donkey Kong palette, 4px-ish borders, `image-rendering: pixelated`. Ships are CSS boxes + SVG data URIs, not sprite sheets. Prefer editing existing classes over new components.

### Motion
Keep existing timings unless asked: ship thrust 0.5s, feedback overlay 1.2s, title fade 500ms steps(8), countdown pop 1s, climb/door timeouts in `runIntro()` (500 / 2600 / 3600 ms). Flame flicker is a tiny loop. Do not add large JS animation libraries.

### Content
Copy is short, 8-bit, present tense. Start strings: `Tap to load game.` / `Tap to play.` Rotate: `Rotate your phone to landscape to play.` Level complete: `Great job! Advance to next planet!`

### Routing / auth
N/A. Do not add a router or login.

### Cursor-only workflow
`.cursor/rules/` may tell Cursor to `open index.html` after a finished UI request. That is **not** a Claude Code rule. Claude Code: skip it unless the user asks. Any agent doing UI work should still **play-test landscape** before calling the work done.

---

## Known traps and do-not-recreate

- **Do not collapse the two-tap audio unlock.** A previous “elegant one-tap / autoplay” pass failed on iPhone; two taps were restored on purpose (`6d57737`).
- **Do not play overlapping SFX via HTMLAudio on iOS.** Clips cut each other off. Use the Web Audio buffer path.
- **Do not autoplay** Hero Immortal; browsers (especially iOS) will ignore it.
- **Do not put a circular ring** back on app icons (`3ab9810`).
- **Do not ship a quarter-size favicon.** `icon-192.png` must be a full-frame downscale of `icon-512.png`.
- **Do not go back to a third keypad row / stacked Del+Submit that clips** on iPhone landscape. Current six-column grid with a wide last column is the surviving layout.
- **Do not inline the answer into the equation.** Separate `#answerInputDisplay` viewport.
- **Do not add shifting blue body detail** on the launch rocket (`6a224cc`).
- **Do not introduce division before level 10**, or extra operations on level 5 (rounding only).
- **Do not call `startLevel()` on Continue** — it zeros score and lives.
- **Do not wire `#winOverlay`** as the planet-reached screen; level-complete is the path.
- **Do not use absolute GitHub Pages URLs** in asset hrefs; keep `./` relative paths.
- **Do not register the service worker on insecure LAN HTTP.** The inline script already no-ops outside `isSecureContext`.
- **Do not bump only the PNG** without bumping `CACHE_NAME`, or installed PWAs will keep the old icon.
- **Do not add a bundler / React / modules** unless explicitly asked. This is three static files plus assets.
- **Do not copy `node_modules`, `.next`, or IDE chat transcripts** into git. This repo has none of those on purpose.
- Sound paths with spaces must stay encoded on fetch. Changing filenames requires `index.html`, `game.js` `SFX_URLS`, `sw.js` `OPTIONAL_ASSETS`, and `sounds/README.md` together.
- `sounds/rocket.mp3` is documented as optional and is **not** in git. Do not treat a 404 as a bug.
- Old Cursor rule path `…/Math rocket game/` is stale. This repo lives at `planet-hopper`.

---

## After code changes

If you change anything under `REQUIRED_ASSETS` or icons, increment `CACHE_NAME` in `sw.js`. Verify in a real landscape viewport (or iPhone). Player-facing install instructions live in `README.md`; keep them in sync if the public URL or install steps change.
