# Handoff — 27 Aug 2026 (packaging for Claude Code)

Session-only. Standing rules live in `AGENTS.md`. Delete or replace this file after the next agent picks up.

## In-flight / uncommitted

Working tree at start of packaging (still uncommitted unless you choose otherwise):

| Path | Why |
|---|---|
| `assets/icons/icon-192.png` | 19 Aug: favicon was a 192 file with the rocket only in the top-left quarter and a white L around it. Rebuilt by downscaling `icon-512.png` to 192×192 so the tab icon is the full ship on `#1a1a2e`. |
| `sw.js` | `CACHE_NAME` `planet-hopper-v8` → `planet-hopper-v9` so installed PWAs fetch the new 192 icon. |

This packaging pass **adds** (also uncommitted):

| Path | Why |
|---|---|
| `AGENTS.md` | Single source of truth for agents |
| `CLAUDE.md` | Claude Code loader: `@AGENTS.md` only |
| `DESIGN.md` | Visual tokens extracted from CSS (no token change this session; file did not exist) |
| `.cursorrules` | Thin Cursor shim → `AGENTS.md` |
| `.cursor/rules/agents.mdc` | Always-apply pointer at `AGENTS.md` |
| `.cursor/rules/open-game-after-request.mdc` | Path fixed to this repo; still Cursor-only “open the game” extra |

No secrets, no `.env`, no `node_modules`.

## Open questions / next steps

1. **Commit?** User asked not to commit this packaging pass. When committing, include the favicon + cache bump together with the agent docs, or ship the icon fix first so GitHub Pages updates.
2. Confirm the new favicon in a **hard-refreshed** tab and on the Home Screen icon (SW cache). `apple-touch-icon.png` / `icon-512.png` were not regenerated.
3. `sounds/rocket.mp3` is still missing (optional engine bed). Not a bug.
4. `#winOverlay` is leftover unused markup. Leave it unless someone asks to delete it.
5. `package.json` name `math-rocket-game` and HTML title `Astronaut Math Rocket` vs product **Planet Hopper** — cosmetic leftovers, do not “fix” unless asked.

## Commands

```bash
npm start
# then http://127.0.0.1:8000

npm run iphone
# same-Wi-Fi phone testing; not a real iOS PWA install
```

After a Pages deploy, bump was already done to `v9` for the icon. Further asset edits need `v10+`.

## Read first (ranked)

1. **`AGENTS.md`** — product, architecture, traps, how to run.
2. **`game.js`** — state machine, math, audio, intro timeline (the real spec).
3. **`index.html`** — DOM, overlays, two-tap start, audio tags.
4. **`styles.css`** — landscape keypad / cockpit; pixel ships.
5. **`sw.js`** — cache name and fetch strategy.
6. **`DESIGN.md`** — palette / type / motion tokens.
7. **`sounds/README.md`** — which clips are required vs optional.
8. **`README.md`** — player install URL.

## From recent chats (not standing rules)

- Two-tap start (**Tap to load game.** / **Tap to play.**) was **restored on purpose** after autoplay experiments failed on iPhone. Last shipped commit: `6d57737` (Web Audio overlapping SFX + two-tap unlock).
- Favicon quarter-size bug was fixed in the working tree but **never committed**.
- Do not copy Cursor agent transcripts or plan files into this repo; they are not git history.
