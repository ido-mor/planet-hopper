// Planet Hopper — level curriculum.
//
// This is the play order. Each level asks one kind of problem (`type`, from
// problem-types.js) with its own settings (`params`). After the last level the
// game keeps going by revisiting earlier levels in a random order, each on a
// new planet colour.
//
// Edit by hand or open editor.html, which builds this file for you. Then:
//   1. replace this file,
//   2. bump CACHE_NAME in sw.js so installed copies pick it up,
//   3. commit and push.
//
// Changing a level's id, type, params or the order RESETS SAVED PROGRESS on
// every device the next time the game opens (the child sees "New missions!"
// and starts from planet 1). Renaming a level or editing its blurb is free.
window.PLANET_HOPPER_LEVELS = [
  {
    id: "add-sub-small",
    name: "Add & Subtract",
    blurb: "Add and subtract numbers up to 99.",
    type: "addsub",
    params: { digits: [1, 2], ops: "both" }
  },
  {
    id: "paren-small",
    name: "Parentheses",
    blurb: "Solve the brackets first. Answers up to 99.",
    type: "paren",
    params: { maxAnswer: 99 }
  },
  {
    id: "paren-big",
    name: "Big Parentheses",
    blurb: "Brackets with bigger numbers, up to 999.",
    type: "paren",
    params: { maxAnswer: 999 }
  },
  {
    id: "add-sub-big",
    name: "Thousands",
    blurb: "Add and subtract two- and four-digit numbers.",
    type: "addsub",
    params: { digits: [2, 4], ops: "both" }
  },
  {
    id: "rounding",
    name: "Rounding",
    blurb: "Round big numbers to the nearest place.",
    type: "round",
    params: { max: 900000, places: ["tens", "hundreds", "thousands", "ten thousands", "hundred thousands"] }
  },
  {
    id: "multiply-small",
    name: "Multiply",
    blurb: "Single digits times numbers up to 99.",
    type: "multiply",
    params: { aMin: 1, aMax: 9, bMin: 1, bMax: 99 }
  },
  {
    id: "multiply-big",
    name: "Big Multiply",
    blurb: "Two-digit numbers times a single digit.",
    type: "multiply",
    params: { aMin: 10, aMax: 99, bMin: 2, bMax: 9 }
  },
  {
    id: "divide-small",
    name: "Divide",
    blurb: "Divide by 2 to 9. No remainders.",
    type: "divide",
    params: { divisorMin: 2, divisorMax: 9, quotientMin: 2, quotientMax: 12 }
  },
  {
    id: "divide-big",
    name: "Big Divide",
    blurb: "Divide by up to 12. Answers up to 99.",
    type: "divide",
    params: { divisorMin: 2, divisorMax: 12, quotientMin: 2, quotientMax: 99 }
  },
  {
    id: "area",
    name: "Area",
    blurb: "Find the area of the shape.",
    type: "area",
    params: { shapes: ["rectangle", "square", "triangle"], minSide: 2, maxSide: 12 }
  },
  {
    id: "algebra",
    name: "Solve for n",
    blurb: "Find the number n that makes it true.",
    type: "algebra",
    params: { forms: ["n+a=b", "an=b", "an+b=c"], maxN: 20, maxCoef: 9 }
  }
];
