# Transfer prompt (Cursor → Claude Code)

Paste this in a repo when chat history will not transfer. Do **not** dump the result into `CLAUDE.md`.

---

Package this repo so Claude Code (and Cursor) can pick up with full fidelity. Chat history will not transfer — everything that matters must land in Git.

1. Read existing agent docs (`AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, `README`, `.cursorrules`, `.cursor/rules/`, `.claude/`) and the current git status + diff. Do not invent architecture; extract from code and this conversation.

2. Make **`AGENTS.md`** the single source of truth. Include, pulled from the codebase:
   - One paragraph: what the project does and **who it's for**
   - Stack and pinned versions **only if pinned for a reason**
   - Important paths and what lives there
   - Architectural decisions and **why** (non-obvious / vs a typical setup)
   - What’s **shipped and working** (not in-flight work)
   - Gotchas and things that look like bugs but are intentional
   - Conventions: naming, formatting, styling/motion/content, testing, commit style, routing/auth
   - How to run / build / test
   - Conflict rule: implemented code wins over docs; update docs after

3. Ensure **`CLAUDE.md`** at the repo root contains **only**:
   ```
   @AGENTS.md
   ```
   Claude Code auto-loads `CLAUDE.md`. Do not duplicate rules there.

4. Keep Cursor files as thin shims, not a second spec:
   - `.cursorrules` / `.cursor/rules` point at `AGENTS.md`
   - Port Cursor-only “always apply” rules into `AGENTS.md` if they are **project** knowledge
   - Leave Cursor-only workflow extras (open the app, commit reminders) in `.cursor/`

5. Write **`HANDOFF.md`** for the *current* session only (not standing rules):
   - In-flight work and uncommitted files (path + why)
   - Broken/stubbed items and open questions / next steps
   - Commands to run
   - Files the next agent should read first (ranked, one-line why)
   - Anything in this chat that is not yet in `AGENTS.md`

6. Update **`DESIGN.md`** (or equivalent) if visual tokens changed. Content-only edits do not need agent-doc changes.

7. Do not commit unless asked. List what should be staged vs left untracked (secrets, `node_modules`, `.env`, scratch assets). Never copy `node_modules`, `.next`, or IDE chat transcripts.

Stop when those files are accurate. Then give a short “open in Claude Code” checklist.
