# Handoff — current session

Scope: a mobile audit and every item from it except one, plus a new app icon.
High: first-load payload, time-to-play, UI font offline. Medium: #4, #6, #7,
#8, #9, #10, #11. Low: #12, #13, #14, #15, #16, #17, #18, #19.
**#5 is the only thing left undone**, at the owner's request: iPad Pro portrait
(1024x1366) still clears the `max-width: 900px` rotate gate and renders the
landscape layout into a tall window.
Math and the two-tap unlock are untouched.

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
- **Hold-to-skip during the launch sequence.** `runIntro()` / `runCountdown()`
  register every timer through `introTimeout()`, so `cancelIntroTimers()`
  can drop the whole pending chain. `finishIntro()` is the single exit, shared
  by the natural end and the skip. An `introToken` generation counter also
  neutralises async work already in flight, and intro SFX nodes are tracked so
  the countdown voice and launch roar stop when the sequence is cut short.
- **`runIntro({ skipWalk: true })` on Play Again** — straight to the countdown.
  The boarding walk is worth watching once, not after every game over.
- **`#introSkip` is a `<button>`** ("Hold to skip.", bottom-right, white, on a
  translucent disc with a progress ring). It appears at the same moment the skip
  arms, so the affordance never lies.
- **800 ms hold, not a tap.** A tap anywhere on the overlay used to skip, which
  a stray poke could trigger during the 12 s sequence. 800 ms is clear of the
  ~500 ms the OS uses to separate a tap from a long press, and still short
  enough to be worth using. `handleIntroStart` now returns inert while
  `startPhase === 'starting'`; the ring is the only hit target.
- The ring is driven from **rAF, not CSS**: the blanket `prefers-reduced-motion`
  rule collapses every animation to 0.01ms with `!important`, which would snap a
  CSS arc straight to full and leave the button with no feedback at all. The
  decorative resting pulse still collapses, which is what should happen.
- `resetSkipHold()` (snap to empty) vs `cancelSkipHold()` (animated rewind) are
  deliberately separate. Teardown and setup — `runIntro()`, `finishIntro()`, a
  completed hold, a page going hidden — snap; only a finger lifting off gets the
  rewind. Sharing one function let a fresh intro arm with the previous round's
  arc still painted.
- `setPointerCapture` on pointerdown forgives finger drift over 800 ms; without
  it a `pointerleave` on a ~100 px target aborts most honest holds.
- `-webkit-touch-callout: none` + `user-select: none` on the button: an 800 ms
  press on iOS Safari otherwise pops the text-selection callout mid-hold.
- A `visibilitychange` listener drops an in-flight hold. rAF pauses while the
  page is hidden but `performance.now()` does not, so a hold interrupted by an
  app switch would otherwise resume with a huge elapsed and fire instantly.
- Skip is armed 900 ms into `runIntro` so a quick second tap on "Tap to play."
  cannot blow past the whole intro (~1.6 s after that tap, once the 720 ms
  title-scatter is counted). `beginSkipHold()` also refuses while the ring still
  carries `.hidden`, covering the window before `runIntro()` has set the arm at
  all. `skipIntro()` stays idempotent via its phase guard.
- The ring shrinks to `8em` at `right: 2%` below 600 px wide. At 9.5em it
  crossed the rocket's right fin on a 568x320 board; 844x390 keeps the roomier
  86 px circle.
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

## Medium-value items

- **#4 problem text clipped.** Level-5 rounding prompts lost their last line at
  <=360px viewport height: `#answerInputDisplay` is a later sibling with an
  opaque background, so the overflow was painted over, not clipped. New
  `fitProblemText()` shrinks the font until it fits. Chosen over more CSS
  breakpoints because a per-breakpoint font size is brittle across Android
  landscape sizes and needs retuning for every new problem format. Runs from
  `showProblem()` and on viewport change only — **not** `renderProblemText()`,
  which fires per keystroke and would force ~15 layouts per tap.
- **#6 tap flash.** `-webkit-tap-highlight-color: transparent` on `body`; it
  inherits, so one declaration covers the keypad and every button.
- **#7 translucent overlays.** `rgba(0,0,0,0.85)` -> opaque `#0f0f1a`. The
  overlay always covered the HUD; it was only ever see-through.
- **#8 double downloads.** SFX `<audio>` elements are the desktop-only fallback
  and `prefetchSfx()` already fetches every clip, so `preload="auto"` doubled
  each one. Now `preload="none"` — except `rocketSound`, which keeps
  `metadata` because `playRocketSound()` gates on `isFinite(duration)` and
  would otherwise never play if `sounds/rocket.mp3` were ever added.
- **#9 progress persistence.** `localStorage`, auto-resume verbatim. See the
  AGENTS.md gameplay section for the contract. Free, offline, no accounts, and
  no child data leaves the device.
- **#10 keypad latency.** `pointerdown` instead of `click`, with a second
  `click` listener guarded by `e.detail === 0` so keyboard activation still
  works without double-entering.
- **#11 link previews.** `<title>` -> "Planet Hopper", description, `og:*` and
  `twitter:*`, plus a real 1200x630 card at `assets/og-card.png` from the new
  `tools/make-og-card.py`. og:image/og:url are absolute by necessity — carve-out
  recorded in AGENTS.md.
- `CACHE_NAME` -> `planet-hopper-v18`.

## Low-value items

- **#12 portrait screen.** Was a bare line of text, and `aria-hidden="true"` on
  the only thing on screen, so AT users in portrait got nothing. Now the app
  icon, an animated phone-tipping hint (`rotateHint`) and the copy, with
  `role="alert"` and no aria-hidden.
- **#13 tablet landscape.** New `min-width: 1000px` + `min-height: 600px`
  landscape query: cockpit cap 560 -> 820px, keys to 116px, type scaled. The
  owner capped this at 3/10 effort; it came in around 2 — one media query.
  The `min-height` gate keeps tall narrow windows on the phone layout.
- **#14 touch target.** `min-height: 44px` on the overlay buttons; the
  short-landscape query had them at 40px.
- **#15 focus.** `:focus-visible` ring (3px `#f0e860`) on the keypad and overlay
  buttons - there were no focus styles anywhere. `:focus-visible`, not
  `:focus`, so pointer presses stay clean.
- **#16 reduced motion.** Standard recipe (animations and transitions to
  0.01ms), which lands each animation on its END state - correct throughout
  here, so nothing is stranded. `runIntro()` also skips the boarding walk,
  because collapsing its animation would otherwise leave a still screen for the
  7.4s the timeline still waits.
- **#17 iOS launch flash.** 10 landscape launch images in `assets/startup/`
  from `tools/make-startup-images.py`, 138 KB total (flat colour compresses
  well). Apple matches on the device's *portrait* logical size even for
  landscape images, so the media queries carry portrait device-width/height.
  Not precached - iOS caches them itself and the page never loads them.
- **#18 ship position.** `updateShipPosition()` bails when the diagram measures
  under 8px and window resize alone never brought it back. Now a
  `ResizeObserver` on `.path-diagram` retries as soon as it has a real box.
- **#19 pinch-zoom — raised, then reverted at the owner's call.** Briefly
  dropped `maximum-scale=1, user-scalable=no` on accessibility grounds; the
  owner wants no pinch-zoom, so it is back. The reasoning is sound: the board is
  a fixed landscape layout and an accidental pinch mid-question leaves a child
  stuck in a view they cannot undo. Recorded in AGENTS.md as a decision so it is
  not "fixed" again.
- `CACHE_NAME` -> `planet-hopper-v19`.

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

Medium-value items, driven in-browser at 568x320 / 640x360 / 667x375 / 844x390:

- **#4** reached level 5 for real (Continue x4) so a genuine rounding prompt hit
  the fitter: shrank 15.9px -> 13.9px and `scrollHeight === clientHeight`, two
  readable lines where the third used to vanish. On a real `resize` the inline
  size clears and CSS wins again (18px at 844x390) — the shrink is not sticky.
  Note `resize_window` does not fire a `resize` event; that had to be dispatched
  explicitly to test the grow-back.
- **#6** computed `-webkit-tap-highlight-color` is `rgba(0, 0, 0, 0)`.
- **#7** both overlays compute to `rgb(15, 15, 26)`; screenshotted at 568x320 —
  no keypad or HUD ghosting behind either.
- **#8** one resource-timing entry per clip (was two). All SFX report
  `readyState 0 / networkState 1` before any tap.
- **#9** played to `{level:5, score:60, lives:2, currentStep:2}`, reloaded, and
  got all four back exactly, ship animating to the step-2 position (246px, the
  computed value). Game over clears the save; Play Again clears a planted
  level-7 save and starts clean at level 1; corrupt JSON and an out-of-range
  `lives: 0` both fall back to a fresh level 1 without throwing.
- **#10** `pointerdown` alone enters a digit; a full pointerdown+click sequence
  enters exactly one; a `detail: 0` click still works (keyboard); a
  non-primary/right button is ignored.
- **#11** title, `og:*` and `twitter:*` present; `assets/og-card.png` serves 200
  as a 15.5 KB image/png and was eyeballed at card size.
- Regression: full run at 568x320 — two-tap unlock, skip, ten correct answers to
  level complete, Continue carrying score 100 and 3 lives into level 2 with the
  ship back on the ground. Only console errors are the documented
  `sounds/rocket.mp3` 404.

Low-value items:

- **#12** overlay computes `display: flex` with `role="alert"`, no aria-hidden,
  icon loaded, `rotateHint` running; screenshotted at 390x844.
- **#13** at 1180x820: frame 820px, keys 98x98, problem 30px, answer 32px.
- **#14** Play Again and Continue both measure exactly 44px at 568x320.
- **#15** `:focus-visible` rule present with the yellow outline.
- **#16** patched `matchMedia` to force the reduced-motion signal on and ran the
  **first** intro (not Play Again, which skips the walk regardless): walk
  skipped, 7.3s instead of 14.8s. The `@media` block is in the CSSOM.
- **#17** all 10 launch images serve 200, 138 KB total, every media query
  landscape-scoped.
- **#18** collapsed `.path-diagram` to nothing (updateShipPosition correctly
  bailed, inline top empty), restored it, and the observer repositioned the ship
  to 226px. Before this it would have stayed unpositioned.
- **#19** viewport meta carries `maximum-scale=1, user-scalable=no` (reverted).
- Regression after all of the above at 667x375: nothing prefetched before the
  first tap, skip lands in 52ms, ten correct to level complete, Continue carries
  score 100 / 3 lives into level 2, save updates correctly. Every asset returns
  200 except the documented `sounds/rocket.mp3`.

**Caveat on the browser-pane harness:** it caches `styles.css` aggressively and
serves stale copies after an edit, and it pauses CSS transitions, rAF and
ResizeObserver callbacks while the pane is not painting. Several readings above
were wrong until a screenshot forced a paint or a fresh `<link>` was injected.
Anything measured here should be re-checked on a device before it is trusted.

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
