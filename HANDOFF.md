# Handoff — 27 Aug 2026 (AGENTS.md gap fill)

Session-only. Standing rules live in `AGENTS.md`. Replace this file on the next pick-up.

## In-flight / uncommitted

None on `main` after `d3d10f6` (agent docs + full-frame favicon + SW `v9`). This pass only edits standing docs + this file + `.cursor/TRANSFER_PROMPT.md`.

## Open questions / next steps

1. Confirm the new favicon in a **hard-refreshed** tab and on the Home Screen icon (SW cache `planet-hopper-v9`). `apple-touch-icon.png` / `icon-512.png` were not regenerated.
2. `sounds/rocket.mp3` is still missing (optional engine bed). Not a bug.
3. `#winOverlay` is leftover unused markup. Leave it unless someone asks to delete it.
4. `package.json` name `math-rocket-game` and HTML title `Astronaut Math Rocket` vs product **Planet Hopper** — cosmetic leftovers, do not “fix” unless asked.

## Commands

```bash
npm start
# then http://127.0.0.1:8000

npm run iphone
# same-Wi-Fi phone testing; not a real iOS PWA install
```

Further cached-asset edits need `CACHE_NAME` `v10+`.

## Read first (ranked)

1. **`AGENTS.md`** — product, architecture, traps, how to run, conventions.
2. **`game.js`** — state machine, math, audio, intro timeline (the real spec).
3. **`index.html`** — DOM, overlays, two-tap start, audio tags.
4. **`styles.css`** — landscape keypad / cockpit; pixel ships.
5. **`sw.js`** — cache name and fetch strategy.
6. **`DESIGN.md`** — palette / type / motion tokens.
7. **`sounds/README.md`** — which clips are required vs optional.
8. **`README.md`** — player install URL.

## From this chat (not standing rules)

- Synthesized transfer layout: standing spec in `AGENTS.md`; `CLAUDE.md` is only `@AGENTS.md`; session state in `HANDOFF.md`. Do not flatten that into a fat `CLAUDE.md`.
- Reusable packaging prompt: `.cursor/TRANSFER_PROMPT.md`.
- Two-tap start and Web Audio SFX were restored on purpose (`6d57737`).
