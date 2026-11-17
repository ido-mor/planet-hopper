// Planet Hopper — problem type registry.
//
// Shared by game.js (play) and editor.html (authoring). Every kind of math the
// game can ask lives here as one entry: a label and field schema for the
// editor, defaults, a generate() that returns a problem, and an independent
// solve() the grader cross-checks the stored answer against.
//
// levels.js picks from these by `type` and supplies `params`. To add a new kind
// of problem, add a define({...}) block below; nothing in game.js needs to
// change unless the answer stops being a non-negative whole number (the keypad
// only has digits).
(function (global) {
  'use strict';

  function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    if (max < min) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(list) {
    return list[randomInt(0, list.length - 1)];
  }

  function formatNumber(n) {
    var s = n < 0 ? '-' + String(-n) : String(n);
    if (Math.abs(n) < 1000) return s;
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function parseWholeNumber(str) {
    if (typeof str !== 'string') return NaN;
    var normalized = str.replace(/,/g, '').trim();
    if (!/^\d+$/.test(normalized)) return NaN;
    return Number(normalized);
  }

  // Smallest and largest whole number with exactly d digits (d=1 starts at 1).
  function digitRange(d) {
    d = Math.max(1, Math.min(7, Math.floor(d)));
    return d === 1 ? [1, 9] : [Math.pow(10, d - 1), Math.pow(10, d) - 1];
  }

  function randomWithDigits(d) {
    var r = digitRange(d);
    return randomInt(r[0], r[1]);
  }

  // Second, independent path to the answer for the text-based types: the
  // grader prefers this over the stored number when it parses.
  function solveFromProblemText(text) {
    if (typeof text !== 'string') return null;

    var roundMatch = text.match(/^Round\s+([\d,]+)\s+to the nearest\s+(tens|hundreds|thousands|ten thousands|hundred thousands)\.$/);
    if (roundMatch) {
      var rawNum = parseWholeNumber(roundMatch[1]);
      if (!isFinite(rawNum)) return null;
      var divisor = ROUND_DIVISORS[roundMatch[2]];
      if (!divisor) return null;
      return Math.round(rawNum / divisor) * divisor;
    }

    var parenMatch = text.match(/^\(([\d,]+)\s*([+\-])\s*([\d,]+)\)\s*([+\-])\s*([\d,]+)\s*=\s*\?$/);
    if (parenMatch) {
      var p1 = parseWholeNumber(parenMatch[1]);
      var p2 = parseWholeNumber(parenMatch[3]);
      var p3 = parseWholeNumber(parenMatch[5]);
      if (!isFinite(p1) || !isFinite(p2) || !isFinite(p3)) return null;
      var first = parenMatch[2] === '+' ? (p1 + p2) : (p1 - p2);
      return parenMatch[4] === '+' ? (first + p3) : (first - p3);
    }

    var basicMatch = text.match(/^([\d,]+)\s*([+\-x÷])\s*([\d,]+)\s*=\s*\?$/);
    if (basicMatch) {
      var b1 = parseWholeNumber(basicMatch[1]);
      var b2 = parseWholeNumber(basicMatch[3]);
      if (!isFinite(b1) || !isFinite(b2)) return null;
      switch (basicMatch[2]) {
        case '+': return b1 + b2;
        case '-': return b1 - b2;
        case 'x': return b1 * b2;
        case '÷': return b2 === 0 ? null : (b1 / b2);
        default: return null;
      }
    }

    return null;
  }

  var ROUND_DIVISORS = {
    'tens': 10,
    'hundreds': 100,
    'thousands': 1000,
    'ten thousands': 10000,
    'hundred thousands': 100000
  };
  var ROUND_PLACE_NAMES = Object.keys(ROUND_DIVISORS);

  // Problem text ends in "= ?" for equations; the cockpit shows it without the
  // question mark because the answer viewport underneath is the "?".
  function stem(text) {
    return text.replace(/\s*\?\s*$/, '').trim();
  }

  var TYPES = {};
  var ORDER = [];

  // Field kinds the editor knows how to render:
  //   int    - whole number, with min/max
  //   choice - one of options [[value, label], ...]
  //   multi  - any subset of options [[value, label], ...], at least one
  function define(type) {
    TYPES[type.key] = type;
    ORDER.push(type.key);
  }

  // ---- Add & subtract ----
  define({
    key: 'addsub',
    label: 'Add & subtract',
    fields: [
      { key: 'digits', label: 'Number sizes', kind: 'multi',
        options: [[1, '1 digit'], [2, '2 digits'], [3, '3 digits'], [4, '4 digits'], [5, '5 digits']],
        help: 'Each number in a problem is drawn with one of these digit counts.' },
      { key: 'ops', label: 'Operations', kind: 'choice',
        options: [['both', 'Add and subtract'], ['add', 'Add only'], ['sub', 'Subtract only']] }
    ],
    defaults: { digits: [1, 2], ops: 'both' },
    generate: function (p) {
      var a = randomWithDigits(pick(p.digits));
      var b = randomWithDigits(pick(p.digits));
      var op = p.ops === 'both' ? pick(['add', 'sub']) : p.ops;
      var text, answer;
      if (op === 'sub') {
        if (a < b) { var t = a; a = b; b = t; }
        if (a === b) return null;
        answer = a - b;
        text = formatNumber(a) + ' - ' + formatNumber(b) + ' = ?';
      } else {
        answer = a + b;
        text = formatNumber(a) + ' + ' + formatNumber(b) + ' = ?';
      }
      return { text: text, answer: answer };
    }
  });

  // ---- Parentheses ----
  define({
    key: 'paren',
    label: 'Parentheses',
    fields: [
      { key: 'maxAnswer', label: 'Largest answer', kind: 'int', min: 20, max: 99999,
        help: 'Problems look like (a + b) - c or (a - b) + c; every answer stays at or under this.' }
    ],
    defaults: { maxAnswer: 99 },
    generate: function (p) {
      var M = p.maxAnswer;
      var a, b, c, answer, text;
      if (Math.random() < 0.5) {
        a = randomInt(1, Math.max(1, Math.floor(M / 2)));
        b = randomInt(1, Math.max(1, Math.floor(M / 2)));
        c = randomInt(1, Math.min(a + b, M));
        answer = a + b - c;
        if (answer < 0 || answer > M) return null;
        text = '(' + formatNumber(a) + ' + ' + formatNumber(b) + ') - ' + formatNumber(c) + ' = ?';
      } else {
        a = randomInt(Math.max(2, Math.floor(M / 10)), Math.max(2, Math.floor(M * 0.8)));
        b = randomInt(1, Math.max(1, Math.min(Math.floor(M * 0.4), a - 1)));
        c = randomInt(1, Math.max(1, Math.floor(M / 2)));
        answer = (a - b) + c;
        if (answer < 0 || answer > M) return null;
        text = '(' + formatNumber(a) + ' - ' + formatNumber(b) + ') + ' + formatNumber(c) + ' = ?';
      }
      return { text: text, answer: answer };
    }
  });

  // ---- Rounding ----
  define({
    key: 'round',
    label: 'Rounding',
    fields: [
      { key: 'max', label: 'Largest number', kind: 'int', min: 20, max: 9999999 },
      { key: 'places', label: 'Round to the nearest', kind: 'multi',
        options: ROUND_PLACE_NAMES.map(function (n) { return [n, n]; }) }
    ],
    defaults: { max: 900000, places: ROUND_PLACE_NAMES.slice() },
    generate: function (p) {
      var usable = p.places.filter(function (name) {
        return ROUND_DIVISORS[name] && ROUND_DIVISORS[name] <= p.max;
      });
      if (!usable.length) usable = ['tens'];
      var place = pick(usable);
      var divisor = ROUND_DIVISORS[place];
      var a = randomInt(1, p.max);
      var answer = Math.round(a / divisor) * divisor;
      var text = 'Round ' + formatNumber(a) + ' to the nearest ' + place + '.';
      return { text: text, display: text, answer: answer };
    }
  });

  // ---- Multiply ----
  define({
    key: 'multiply',
    label: 'Multiply',
    fields: [
      { key: 'aMin', label: 'First number from', kind: 'int', min: 0, max: 9999 },
      { key: 'aMax', label: 'First number to', kind: 'int', min: 0, max: 9999 },
      { key: 'bMin', label: 'Second number from', kind: 'int', min: 0, max: 9999 },
      { key: 'bMax', label: 'Second number to', kind: 'int', min: 0, max: 9999 }
    ],
    defaults: { aMin: 1, aMax: 9, bMin: 1, bMax: 99 },
    validate: function (p) {
      var errs = [];
      if (p.aMin > p.aMax) errs.push('First number: "from" is larger than "to".');
      if (p.bMin > p.bMax) errs.push('Second number: "from" is larger than "to".');
      return errs;
    },
    generate: function (p) {
      var a = randomInt(p.aMin, p.aMax);
      var b = randomInt(p.bMin, p.bMax);
      return { text: formatNumber(a) + ' x ' + formatNumber(b) + ' = ?', answer: a * b };
    }
  });

  // ---- Divide ----
  define({
    key: 'divide',
    label: 'Divide',
    fields: [
      { key: 'divisorMin', label: 'Divide by, from', kind: 'int', min: 1, max: 999 },
      { key: 'divisorMax', label: 'Divide by, to', kind: 'int', min: 1, max: 999 },
      { key: 'quotientMin', label: 'Answer from', kind: 'int', min: 0, max: 9999 },
      { key: 'quotientMax', label: 'Answer to', kind: 'int', min: 0, max: 9999,
        help: 'The dividend is built as answer x divisor, so there is never a remainder.' }
    ],
    defaults: { divisorMin: 2, divisorMax: 9, quotientMin: 2, quotientMax: 12 },
    validate: function (p) {
      var errs = [];
      if (p.divisorMin > p.divisorMax) errs.push('Divide by: "from" is larger than "to".');
      if (p.quotientMin > p.quotientMax) errs.push('Answer: "from" is larger than "to".');
      return errs;
    },
    generate: function (p) {
      var b = randomInt(p.divisorMin, p.divisorMax);
      var answer = randomInt(p.quotientMin, p.quotientMax);
      var a = answer * b;
      return { text: formatNumber(a) + ' ÷ ' + formatNumber(b) + ' = ?', answer: answer };
    }
  });

  // ---- Area ----
  // Drawn, not just described: the figure carries the side lengths and the
  // text names the shape. Triangles are right triangles with an even
  // base x height so the answer stays whole.
  var SHAPE_LABELS = { rectangle: 'Rectangle', square: 'Square', triangle: 'Triangle' };

  define({
    key: 'area',
    label: 'Area',
    fields: [
      { key: 'shapes', label: 'Shapes', kind: 'multi',
        options: [['rectangle', 'Rectangle'], ['square', 'Square'], ['triangle', 'Right triangle']] },
      { key: 'minSide', label: 'Side length from', kind: 'int', min: 1, max: 999 },
      { key: 'maxSide', label: 'Side length to', kind: 'int', min: 1, max: 999 }
    ],
    defaults: { shapes: ['rectangle', 'square', 'triangle'], minSide: 2, maxSide: 12 },
    validate: function (p) {
      return p.minSide > p.maxSide ? ['Side length: "from" is larger than "to".'] : [];
    },
    generate: function (p) {
      var shape = pick(p.shapes);
      var w = randomInt(p.minSide, p.maxSide);
      var h = randomInt(p.minSide, p.maxSide);
      var answer;
      if (shape === 'square') {
        h = w;
        answer = w * w;
      } else if (shape === 'triangle') {
        if ((w * h) % 2 !== 0) return null;
        answer = (w * h) / 2;
      } else {
        if (w === h) return null;
        answer = w * h;
      }
      return {
        text: 'Area of ' + shape + ' ' + w + ' by ' + h + ' = ?',
        display: 'Area of the ' + shape + ' =',
        answer: answer,
        data: { shape: shape, w: w, h: h },
        figure: areaFigure(shape, w, h),
        figureLabel: SHAPE_LABELS[shape] + (shape === 'square'
          ? ' with sides of ' + w
          : (shape === 'triangle' ? ' with base ' + w + ' and height ' + h : ' ' + w + ' wide and ' + h + ' tall'))
      };
    },
    solve: function (problem) {
      var d = problem.data;
      if (!d) return null;
      if (d.shape === 'square') return d.w * d.w;
      if (d.shape === 'triangle') return (d.w * d.h) / 2;
      return d.w * d.h;
    }
  });

  function svgText(x, y, anchor, str) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '">' + str + '</text>';
  }

  function areaFigure(shape, w, h) {
    // viewBox 0 0 160 100. The drawing box leaves room for a label under the
    // base and one beside the vertical side; the triangle's height label sits
    // on the left so its drawing box starts further in.
    var left = shape === 'triangle' ? 40 : 16;
    var boxW = 122 - left;
    var boxH = 66;
    var top = 8;
    var ratio = Math.max(0.6, Math.min(1.8, w / h));
    var W, H;
    if (shape === 'square') {
      W = H = boxH;
    } else if (ratio >= 1) {
      W = boxW;
      H = Math.min(boxH, boxW / ratio);
      W = H * ratio;
    } else {
      H = boxH;
      W = boxH * ratio;
    }
    W = Math.round(W);
    H = Math.round(H);
    var x = left + Math.round((boxW - W) / 2);
    var y = top + Math.round((boxH - H) / 2);
    var bottom = y + H;
    var right = x + W;
    var parts = [];
    if (shape === 'triangle') {
      parts.push('<path d="M' + x + ' ' + bottom + ' L' + right + ' ' + bottom + ' L' + x + ' ' + y + ' Z"/>');
      // Right-angle marker.
      parts.push('<path class="mark" d="M' + x + ' ' + (bottom - 9) + ' h9 v9"/>');
      parts.push(svgText(x + Math.round(W / 2), bottom + 17, 'middle', w));
      parts.push(svgText(x - 6, y + Math.round(H / 2) + 4, 'end', h));
    } else {
      parts.push('<rect x="' + x + '" y="' + y + '" width="' + W + '" height="' + H + '"/>');
      parts.push(svgText(x + Math.round(W / 2), bottom + 17, 'middle', w));
      if (shape === 'rectangle') {
        parts.push(svgText(right + 7, y + Math.round(H / 2) + 4, 'start', h));
      }
    }
    return '<svg class="figure-svg" viewBox="0 0 160 100" width="160" height="100" ' +
      'xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      parts.join('') + '</svg>';
  }

  // ---- Solve for n ----
  // The unknown is n, not x: the game already uses x as the times sign.
  define({
    key: 'algebra',
    label: 'Solve for n',
    fields: [
      { key: 'forms', label: 'Equation forms', kind: 'multi',
        options: [['n+a=b', 'n + a = b'], ['an=b', 'an = b'], ['an+b=c', 'an + b = c']] },
      { key: 'maxN', label: 'Largest n', kind: 'int', min: 1, max: 9999 },
      { key: 'maxCoef', label: 'Largest multiplier', kind: 'int', min: 2, max: 99,
        help: 'The "a" in an = b and an + b = c.' }
    ],
    defaults: { forms: ['n+a=b', 'an=b', 'an+b=c'], maxN: 20, maxCoef: 9 },
    generate: function (p) {
      var form = pick(p.forms);
      var n = randomInt(1, p.maxN);
      var a, b, c, eq, data;
      if (form === 'an=b') {
        a = randomInt(2, p.maxCoef);
        b = a * n;
        eq = a + 'n = ' + formatNumber(b);
        data = { form: form, a: a, b: b };
      } else if (form === 'an+b=c') {
        a = randomInt(2, p.maxCoef);
        b = randomInt(1, p.maxN);
        c = a * n + b;
        eq = a + 'n + ' + formatNumber(b) + ' = ' + formatNumber(c);
        data = { form: form, a: a, b: b, c: c };
      } else {
        a = randomInt(1, p.maxN);
        b = n + a;
        eq = 'n + ' + formatNumber(a) + ' = ' + formatNumber(b);
        data = { form: 'n+a=b', a: a, b: b };
      }
      return {
        text: eq + ', n = ?',
        display: eq + '\nn =',
        answer: n,
        data: data
      };
    },
    solve: function (problem) {
      var d = problem.data;
      if (!d) return null;
      if (d.form === 'an=b') return d.a === 0 ? null : d.b / d.a;
      if (d.form === 'an+b=c') return d.a === 0 ? null : (d.c - d.b) / d.a;
      return d.b - d.a;
    }
  });

  // ---- Params and levels ----

  function coerceField(field, value) {
    if (field.kind === 'int') {
      var n = Math.floor(Number(value));
      if (!isFinite(n)) return null;
      if (field.min != null && n < field.min) return null;
      if (field.max != null && n > field.max) return null;
      return n;
    }
    var allowed = field.options.map(function (o) { return o[0]; });
    if (field.kind === 'choice') {
      return allowed.indexOf(value) === -1 ? null : value;
    }
    if (field.kind === 'multi') {
      if (!Array.isArray(value)) return null;
      var kept = allowed.filter(function (v) { return value.indexOf(v) !== -1; });
      return kept.length ? kept : null;
    }
    return null;
  }

  // Fills gaps from the type's defaults and drops anything out of range, so a
  // hand-edited levels.js degrades to a playable level rather than a crash.
  function normalizeParams(typeKey, params) {
    var type = TYPES[typeKey];
    if (!type) return null;
    var out = {};
    var src = params && typeof params === 'object' ? params : {};
    type.fields.forEach(function (field) {
      var v = src[field.key] != null ? coerceField(field, src[field.key]) : null;
      if (v === null) v = type.defaults[field.key];
      if (Array.isArray(v)) v = v.slice();
      out[field.key] = v;
    });
    return out;
  }

  // Human-readable problems with the level's params, or why it cannot run.
  function validateParams(typeKey, params) {
    var type = TYPES[typeKey];
    if (!type) return ['Unknown problem type "' + typeKey + '".'];
    var errs = [];
    type.fields.forEach(function (field) {
      var v = params ? params[field.key] : undefined;
      if (v == null || coerceField(field, v) === null) {
        errs.push(field.label + ' is missing or out of range.');
      }
    });
    if (!errs.length && type.validate) errs = errs.concat(type.validate(params));
    return errs;
  }

  function slugify(str) {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'level';
  }

  // Returns { levels, warnings }. Levels referring to unknown types are dropped
  // with a warning; everything else is filled in from defaults.
  function normalizeLevels(raw) {
    var warnings = [];
    var levels = [];
    var seen = {};
    if (!Array.isArray(raw)) {
      warnings.push('levels.js did not define an array; using the built-in fallback.');
      raw = [];
    }
    raw.forEach(function (entry, i) {
      if (!entry || typeof entry !== 'object') {
        warnings.push('Level ' + (i + 1) + ' is not an object; skipped.');
        return;
      }
      var type = TYPES[entry.type];
      if (!type) {
        warnings.push('Level ' + (i + 1) + ' uses unknown type "' + entry.type + '"; skipped.');
        return;
      }
      var id = typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : slugify(entry.name || type.key) + '-' + (i + 1);
      if (seen[id]) {
        var base = id, n = 2;
        while (seen[id]) id = base + '-' + (n++);
        warnings.push('Level ' + (i + 1) + ' repeated id "' + base + '"; renamed to "' + id + '".');
      }
      seen[id] = true;
      levels.push({
        id: id,
        name: typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : type.label,
        blurb: typeof entry.blurb === 'string' ? entry.blurb.trim() : '',
        type: type.key,
        params: normalizeParams(type.key, entry.params)
      });
    });
    if (!levels.length) {
      warnings.push('No usable levels; using the built-in fallback.');
      levels.push({
        id: 'fallback', name: TYPES.addsub.label, blurb: '',
        type: 'addsub', params: normalizeParams('addsub', null)
      });
    }
    return { levels: levels, warnings: warnings };
  }

  // Structure only: id, type and params in order. Renaming a level or editing
  // its blurb keeps saved progress; anything that changes what gets asked, or
  // where, resets it.
  function fingerprint(levels) {
    var s = JSON.stringify(levels.map(function (l) {
      return [l.id, l.type, l.params];
    }));
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(16) + '-' + levels.length;
  }

  function generate(typeKey, params) {
    var type = TYPES[typeKey];
    if (!type) return null;
    var p = normalizeParams(typeKey, params);
    for (var attempt = 0; attempt < 60; attempt++) {
      var out = type.generate(p);
      if (!out) continue;
      var answer = Math.floor(Number(out.answer));
      if (isNaN(answer) || !isFinite(answer) || answer < 0) continue;
      return {
        typeKey: typeKey,
        text: out.text,
        display: out.display != null ? out.display : stem(out.text),
        answer: answer,
        data: out.data || null,
        figure: out.figure || null,
        figureLabel: out.figureLabel || null
      };
    }
    return null;
  }

  // Independent re-solve for grading. null when no second path exists.
  function solve(problem) {
    if (!problem) return null;
    var type = TYPES[problem.typeKey];
    var v = null;
    if (type && type.solve) v = type.solve(problem);
    if (v === null || v === undefined || !isFinite(v)) v = solveFromProblemText(problem.text);
    return (v === null || v === undefined || !isFinite(v)) ? null : Number(v);
  }

  global.PlanetHopperProblems = {
    types: TYPES,
    order: ORDER,
    generate: generate,
    solve: solve,
    solveFromProblemText: solveFromProblemText,
    normalizeParams: normalizeParams,
    validateParams: validateParams,
    normalizeLevels: normalizeLevels,
    fingerprint: fingerprint,
    formatNumber: formatNumber,
    parseWholeNumber: parseWholeNumber,
    slugify: slugify
  };
})(typeof window !== 'undefined' ? window : this);
