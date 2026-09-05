# Handoff — current session

Scope: mobile audit, then the three highest-value fixes from it — first-load
payload, time-to-play, and the UI font offline — followed by a new app icon.
Layout, math and the two-tap unlock are untouched.

## What changed

- **`sounds/Hero Immortal.mp3` re-encoded**: 320 kbps CBR stereo -> LAME VBR
  V5 (~115 kbps), 8.02 MB -> 2.90 MB. Same 210 s duration, same 44.1 kHz
  stereo, same filename (so `index.html`, `sw.js` and `sounds/README.md` needed
  no path edits). The original is recoverable with
  `git checkout HEAD -- "sounds/Hero Immortal.mp3"`.
- **`preload="none"`** on `#startSoundtrack`. It was `preload="auto"`, so the
  whole track downloaded behind the black "Tap to load game." screen before any
  interaction — 93% of the app's payload, spent before the player did anything.
  The first tap now starts the fetch, and that tap is the gesture iOS needs.
- **Tap-to-skip during the launch sequence.** `runIntro()` / `runCountdown()`
  now register every timer through `introTimeout()`, so `cancelIntroTimers()`
  can drop the whole pending chain. `finishIntro()` is the single exit, shared
  by the natural end and the skip. An `introToken` generation counter also
  neutralises async work already in flight, and intro SFX nodes are tracked so
  the countdown voice and launch roar stop when the sequence is cut short.
- **`runIntro({ skipWalk: true })` on Play Again** — straight to the countdown.
  The boarding walk is worth watching once, not after every game over.
- **`#introSkip` hint** ("Tap to skip.", top-right, `clickPulse`). It appears at
  the same moment the skip arms, so the affordance never lies.
- Skip is armed 900 ms into `runIntro` so a quick second tap on "Tap to play."
  cannot blow past the whole intro (~1.6 s after that tap, once the 720 ms
  title-scatter is counted).
- The `touchend` listener no longer bails out while `startPhase === 'starting'`
  — that window is now the skip window. `skipIntro()` is idempotent (phase
  guard), so overlapping pointerdown/touchend/click is safe.
- **Press Start 2P self-hosted.** It came from `fonts.googleapis.com`, which
  `sw.js` cannot cache — the fetch handler skips anything not
  `response.type === 'basic'`, and both the Google CSS and the gstatic woff2
  are `cors`. The installed PWA offline therefore rendered the whole cockpit in
  fallback monospace. Now `fonts/PressStart2P-latin.woff2` (4.7 KB latin
  subset) with a local `@font-face`, preloaded in `index.html`, and added to
  `REQUIRED_ASSETS`. The two `preconnect` hints and the render-blocking
  third-party stylesheet are gone. Licence: SIL OFL 1.1, text kept alongside
  the font in `fonts/PressStart2P-OFL.txt` as the licence requires.
- `AGENTS.md` (stack table) and `DESIGN.md` (type scale) updated to say the UI
  font is self-hosted, per the conflict rule in `AGENTS.md`.
- `sw.js` `CACHE_NAME` -> `planet-hopper-v16`.

## App icon

Swapped from the pixel rocket to the owner's front-view astronaut
(`~/Documents/Projects/Planet Hopper Assets/astronaut front view.png`), built
by the new `tools/make-icons.py`.

- The source is soft-edged — only 2,702 of ~1.5M pixels are fully opaque — so a
  plain resize turns it to mush. The script finds its logical grid (exactly
  29x50 blocks of 28px) and resamples by block centre with a hard alpha
  threshold, which recovers true pixel-art edges.
- **Split `any` and `maskable`.** The manifest previously declared
  `icon-192`/`icon-512` as `"any maskable"`, one file for both. The astronaut is
  a wider subject than the rocket, and at the framing that matches the old icon
  (78% height) Android's circular mask clips 665 px off the helmet and boots.
  The largest single file that survives the crop sits at 68%, which reads small
  on a Home Screen. So: `any` at 78% (what iOS uses — it masks to a rounded
  rect, not a circle) plus a new `icon-512-maskable.png` at 68%, verified 0 px
  outside the safe circle. `make-icons.py` refuses to write if that check fails.
- 180 and 192 remain full-frame downscales of the 512, per the existing rule.
  No ring; flat `#1a1a2e`.
- `CACHE_NAME` -> `planet-hopper-v17`; the maskable file added to
  `REQUIRED_ASSETS`. `AGENTS.md` and `DESIGN.md` both described the icon as a
  rocket and were updated.

## Verified

Driven in-browser at 667x375, plus 568x320 / 844x390 for the skip hint:

- Nothing fetches before the first tap (`readyState 0`, `networkState 1`,
  `buffered 0`); after the tap the track loads and plays.
- Un-skipped intro unchanged: **14.8 s**, astronaut still walks the gantry.
- Tap-to-skip mid-walk: **3.0 s** to a playable board. Mid-countdown (on "2"):
  **2.3 s**. Once armed, the skip lands in **52 ms**.
- Play Again: **6.6 s**, walk correctly absent, lives 3 / score 0.
- No cancelled timer fires later — checked 8-16 s past each skip that the
  countdown never reappears and score/level/problem are untouched.
- Grace window holds: a double tap 900 ms after "Tap to play." does not skip.
- Skip hint clears the rocket, the walking astronaut and the "GO!" digits at
  568x320 and 844x390.
- Font: **zero third-party requests** on load (was 6 faces across 4 unused
  subsets); the local woff2 loads at 4704 B and `document.fonts.check` passes.
  Glyph coverage verified against every character the game renders — including
  `÷` for level 10+ and the `…` answer placeholder — nothing missing.
  Rendering is pixel-identical to the Google-hosted version.
- Precache integrity: replayed the install step in page scope. All 20
  `REQUIRED_ASSETS` return 200 and `cache.addAll` resolves with the font and
  the maskable icon included, so a bad path cannot silently break offline
  install.
- Icons: manifest parses with four entries and correct purposes, every file
  returns 200, and the `<link rel=icon>` / `<link rel=apple-touch-icon>` targets
  resolve. Geometry measured from the pixels: `any` 78% subject height (the
  rocket it replaced was 76%), maskable 68% with 0 px outside the safe circle.

## Known, not addressed

- Still not play-tested on a real iPhone / Home Screen PWA. The service worker
  could not be exercised end-to-end here either — the browser pane refuses to
  fetch `sw.js` ("An unknown error occurred when fetching the script"), which
  is a sandbox limitation, not a code fault: the server returns it 200 as
  `text/javascript`, and the precache list was validated separately. A real
  offline check on a phone is still worth doing.
- Remaining audit items, unstarted: level-5 rounding text clipped below 360 px
  viewport height; iPad Pro portrait (1024x1366) escapes the `max-width: 900px`
  rotate gate; default blue `-webkit-tap-highlight-color` on the keypad;
  overlays only 85% opaque over a live board; SFX downloaded twice
  (`preload="auto"` on clips that are a desktop-only fallback); no persistence
  of level/score/lives; keypad on `click` rather than `pointerdown`; no
  `og:`/`description` meta and `<title>` still "Astronaut Math Rocket".
