# Handoff — current session

Scope: editable level content. Curriculum moved out of `game.js` into
`levels.js` (data) + `problem-types.js` (registry) + `editor.html` (laptop
editor). New types: `area` (drawn rectangle/square/right triangle) and
`algebra` (n + a = b, an = b, an + b = c; unknown is n, not x). Level title card, "Next: <name>" on
level complete, save `v: 2` with curriculum fingerprint and the
"New missions!" reset notice. Past the last level: deterministic random
revisits, no consecutive repeats. SW cache bumped to `planet-hopper-v22`.

Verified in the browser at 852x393: resume to level 10 (area figure renders,
grading correct), level 11 title card text, algebra grading, level complete.
Not yet checked by eye: title card at tablet/desktop sizes, the "New missions!"
notice screenshot, `editor.html` interaction, iPhone Safari.

Shipped-order change to flag: old levels 7–9 (three identical two-digit
multiply levels) collapsed to one entry; the infinite division tail is
replaced by the random revisit loop. Level 1 now includes single-digit sums.
Nothing committed.
