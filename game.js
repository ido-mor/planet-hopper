(function () {
  'use strict';

  // ---- Planet colors (cycle for infinite levels) ----
  var PLANET_COLORS = [
    '#e8c040', // gold/yellow
    '#40c060', // green
    '#4080e0', // blue
    '#e08040', // orange
    '#a040e0', // purple
    '#e04050', // red
    '#40c0c0', // teal
    '#c06090', // pink
  ];

  var GROUND_COLOR = '#4a5a3a'; // earth green for level 1

  // ---- State ----
  var state = {
    phase: 'intro',
    currentStep: 0,
    lives: 3,
    currentProblem: null,
    userInput: '',
    lastProblem: null,
    level: 1,
    score: 0,
  };

  // ---- DOM refs ----
  var shipContainer = document.getElementById('shipContainer');
  var explosion = document.getElementById('explosion');
  var targetPlanet = document.getElementById('targetPlanet');
  var groundPlanet = document.getElementById('groundPlanet');
  var mathProblemEl = document.getElementById('mathProblem');
  var answerInputDisplay = document.getElementById('answerInputDisplay');
  var keypadEl = document.getElementById('keypad');
  var feedbackOverlay = document.getElementById('feedbackOverlay');
  var feedbackCheck = document.getElementById('feedbackCheck');
  var feedbackX = document.getElementById('feedbackX');
  var gameOverOverlay = document.getElementById('gameOverOverlay');
  var gameOverText = document.getElementById('gameOverText');
  var winOverlay = document.getElementById('winOverlay');
  var levelCompleteOverlay = document.getElementById('levelCompleteOverlay');
  var levelCompletePlanet = document.getElementById('levelCompletePlanet');
  var astronautDancing = document.getElementById('astronautDancing');
  var continueBtn = document.getElementById('continueBtn');
  var introOverlay = document.getElementById('introOverlay');
  var countdownOverlay = document.getElementById('countdownOverlay');
  var countdownNumber = document.getElementById('countdownNumber');
  var astronaut = document.getElementById('astronaut');
  var introStage = document.getElementById('introStage');
  var introRocket = document.getElementById('introRocket');
  var playAgainBtn = document.getElementById('playAgainBtn');
  var playAgainBtnWin = document.getElementById('playAgainBtnWin');
  var btnSubmit = document.getElementById('btnSubmit');
  var btnDelete = document.getElementById('btnDelete');
  var startSoundtrack = document.getElementById('startSoundtrack');
  var countdownSound = document.getElementById('countdownSound');
  var rocketLaunchSound = document.getElementById('rocketLaunchSound');
  var rocketSound = document.getElementById('rocketSound');
  var levelCompleteSound = document.getElementById('levelCompleteSound');
  var correctSound = document.getElementById('correctSound');
  var wrongSound = document.getElementById('wrongSound');
  var keypadClickSound = document.getElementById('keypadClickSound');
  var clickToStart = document.getElementById('clickToStart');
  var loadGameOverlay = document.getElementById('loadGameOverlay');
  var gameTitle = document.getElementById('gameTitle');
  var levelDisplayEl = document.getElementById('levelDisplay');
  var scoreDisplayEl = document.getElementById('scoreDisplay');

  function getPointsPerLevel(level) {
    return 10 + (level - 1) * 5;
  }

  function updateLevelDisplay() {
    if (levelDisplayEl) levelDisplayEl.textContent = 'Level ' + state.level;
  }

  function updateScoreDisplay() {
    if (scoreDisplayEl) scoreDisplayEl.textContent = formatNumber(state.score);
  }

  // Music stays on an <audio> element (long loop). Short SFX use Web Audio so
  // iOS can overlap them instead of cutting off the previous clip.
  var audioCtx = null;
  var audioUnlocked = false;
  var startSoundtrackDesired = true;
  var sfxBuffers = {};
  var sfxRaw = {};
  var sfxDecoding = {};
  var SFX_URLS = {
    countdown: 'sounds/3 2 1 go_noise-removal_equalized_lower.mp3',
    rocketLaunch: 'sounds/rocket_launch.wav',
    click: 'sounds/click_sound_6.mp3',
    correct: 'sounds/Picked Coin Echo 2.mp3',
    wrong: 'sounds/thunk.wav',
    levelComplete: 'sounds/newthingget.mp3'
  };

  function isLikelyIOS() {
    var ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }

  function encodeAssetUrl(path) {
    return path.split('/').map(function (part) {
      return encodeURIComponent(part);
    }).join('/');
  }

  function getAudioContext() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function decodeAudioData(ctx, data) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      function ok(buffer) {
        if (settled) return;
        settled = true;
        resolve(buffer);
      }
      function fail(err) {
        if (settled) return;
        settled = true;
        reject(err);
      }
      try {
        var result = ctx.decodeAudioData(data.slice(0), ok, fail);
        if (result && typeof result.then === 'function') {
          result.then(ok, fail);
        }
      } catch (err) {
        fail(err);
      }
    });
  }

  function decodeAndStore(name, data, ctx) {
    if (sfxBuffers[name]) return Promise.resolve(sfxBuffers[name]);
    if (!data || !ctx) return Promise.resolve(null);
    if (sfxDecoding[name]) return sfxDecoding[name];
    sfxDecoding[name] = decodeAudioData(ctx, data).then(function (buffer) {
      sfxBuffers[name] = buffer;
      sfxDecoding[name] = null;
      return buffer;
    }).catch(function () {
      sfxDecoding[name] = null;
      return null;
    });
    return sfxDecoding[name];
  }

  function prefetchSfx() {
    Object.keys(SFX_URLS).forEach(function (name) {
      fetch(encodeAssetUrl(SFX_URLS[name]))
        .then(function (res) {
          if (!res.ok) throw new Error('sfx fetch failed');
          return res.arrayBuffer();
        })
        .then(function (data) {
          sfxRaw[name] = data;
          if (audioCtx) decodeAndStore(name, data, audioCtx);
        })
        .catch(function () {});
    });
  }

  function loadSfxBuffers() {
    var ctx = getAudioContext();
    if (!ctx) return;
    Object.keys(SFX_URLS).forEach(function (name) {
      if (sfxRaw[name]) decodeAndStore(name, sfxRaw[name], ctx);
    });
  }

  function unlockAudio() {
    var ctx = getAudioContext();
    if (ctx) {
      try {
        var buf = ctx.createBuffer(1, 1, ctx.sampleRate);
        var src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      } catch (err) {}
    }
    if (!audioUnlocked) {
      audioUnlocked = true;
      loadSfxBuffers();
    }
  }

  function playHtmlSound(el, volume) {
    if (!el || !el.play) return;
    el.volume = volume;
    try { el.currentTime = 0; } catch (err) {}
    el.play().catch(function () {});
  }

  function playBuffer(buffer, volume) {
    var ctx = getAudioContext();
    if (!ctx || !buffer) return false;
    try {
      var src = ctx.createBufferSource();
      src.buffer = buffer;
      var gain = ctx.createGain();
      gain.gain.value = volume;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(0);
      return true;
    } catch (err) {
      return false;
    }
  }

  function getSfxBuffer(name) {
    var ctx = getAudioContext();
    if (!ctx) return Promise.resolve(null);
    if (sfxBuffers[name]) return Promise.resolve(sfxBuffers[name]);
    var ready = sfxRaw[name]
      ? Promise.resolve(sfxRaw[name])
      : fetch(encodeAssetUrl(SFX_URLS[name]))
          .then(function (res) {
            if (!res.ok) throw new Error('sfx fetch failed');
            return res.arrayBuffer();
          })
          .then(function (data) {
            sfxRaw[name] = data;
            return data;
          });
    return ready.then(function (data) {
      return decodeAndStore(name, data, ctx);
    }).catch(function () {
      return null;
    });
  }

  function playSfx(name, htmlEl, volume) {
    unlockAudio();
    var vol = volume == null ? 0.7 : volume;
    if (playBuffer(sfxBuffers[name], vol)) return;
    getSfxBuffer(name).then(function (buffer) {
      if (playBuffer(buffer, vol)) return;
      if (!isLikelyIOS()) playHtmlSound(htmlEl, vol);
    });
  }

  function playCorrectSound() {
    playSfx('correct', correctSound, 0.7);
  }

  function playWrongSound() {
    playSfx('wrong', wrongSound, 0.7);
  }

  function playKeypadClick() {
    playSfx('click', keypadClickSound, 0.9);
  }

  function problemStem(text) {
    return text.replace(/\s*\?\s*$/, '').trim();
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function formatNumber(n) {
    var s = n < 0 ? '-' + String(-n) : String(n);
    if (Math.abs(n) < 1000) return s;
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ---- Math problem by level ----
  // Level 1: single & two-digit, addition and subtraction
  // Level 2: add parentheticals, single & two-digit, answer max 99
  // Level 3: three-digit numbers; parentheticals max 999
  // Level 4: two-digit and four-digit add/subtract (comma in 4-digit)
  // Level 5: estimation only — round whole numbers (up to 900,000) to random place value
  // Level 6: single digit x two-digit
  // Level 7+: incremental (two-digit x two-digit, etc.); no division
  // Level 10+: division introduced
  var ROUND_PLACES = [
    { name: 'tens', divisor: 10 },
    { name: 'hundreds', divisor: 100 },
    { name: 'thousands', divisor: 1000 },
    { name: 'ten thousands', divisor: 10000 },
    { name: 'hundred thousands', divisor: 100000 }
  ];

  function generateProblem() {
    var level = state.level;
    var types = [];
    if (level === 5) {
      types = ['round'];
    } else {
      if (level >= 1) { types.push('add'); types.push('subtract'); }
      if (level >= 2) { types.push('paren_add_sub'); types.push('paren_mixed'); }
      if (level >= 6) { types.push('multiply'); types.push('multiply_two'); }
      if (level >= 7) types.push('multiply_two_two');
      if (level >= 10) types.push('divide');
    }

    var type = types[randomInt(0, types.length - 1)];
    var a, b, c, text, answer;
    var fmt = formatNumber;

    switch (type) {
      case 'add':
        if (level === 1) {
          a = randomInt(1, 99);
          b = randomInt(1, 99);
        } else if (level <= 3) {
          a = randomInt(1, level === 3 ? 999 : 99);
          b = randomInt(1, level === 3 ? 999 : 99);
          if (level === 2 && a + b > 99) return generateProblem();
        } else {
          var useFour = level >= 4 && Math.random() < 0.5;
          a = useFour ? randomInt(1000, 9999) : randomInt(10, 99);
          b = useFour ? randomInt(1000, 9999) : randomInt(10, 99);
          if (level === 4 && (a < 10 || b < 10)) return generateProblem();
        }
        answer = a + b;
        text = fmt(a) + ' + ' + fmt(b) + ' = ?';
        break;

      case 'subtract':
        if (level === 1) {
          a = randomInt(2, 99);
          b = randomInt(1, a - 1);
        } else if (level <= 3) {
          a = randomInt(level === 3 ? 100 : 10, level === 3 ? 999 : 99);
          b = randomInt(1, a - 1);
          if (level === 2 && a - b > 99) return generateProblem();
        } else {
          var useFourA = level >= 4 && Math.random() < 0.5;
          a = useFourA ? randomInt(1000, 9999) : randomInt(20, 99);
          var maxB = useFourA ? Math.min(9999, a - 1) : Math.min(99, a - 1);
          if (maxB < 10) return generateProblem();
          b = randomInt(10, maxB);
          if (a - b < 0) return generateProblem();
        }
        answer = a - b;
        text = fmt(a) + ' - ' + fmt(b) + ' = ?';
        break;

      case 'paren_add_sub':
        if (level === 2) {
          a = randomInt(1, 50);
          b = randomInt(1, 50);
          c = randomInt(1, Math.min(a + b, 99));
          answer = a + b - c;
          if (answer < 0 || answer > 99) return generateProblem();
          text = '(' + a + ' + ' + b + ') - ' + c + ' = ?';
        } else {
          a = randomInt(1, 400);
          b = randomInt(1, 400);
          c = randomInt(1, Math.min(a + b, 999));
          answer = a + b - c;
          if (answer < 0 || answer > 999) return generateProblem();
          text = '(' + fmt(a) + ' + ' + fmt(b) + ') - ' + fmt(c) + ' = ?';
        }
        break;

      case 'paren_mixed':
        if (level === 2) {
          a = randomInt(10, 80);
          b = randomInt(1, Math.min(40, a - 1));
          c = randomInt(1, 50);
          answer = (a - b) + c;
          if (answer > 99) return generateProblem();
          text = '(' + a + ' - ' + b + ') + ' + c + ' = ?';
        } else {
          a = randomInt(50, 600);
          b = randomInt(1, Math.min(200, a - 1));
          c = randomInt(1, 400);
          answer = (a - b) + c;
          if (answer > 999) return generateProblem();
          text = '(' + fmt(a) + ' - ' + fmt(b) + ') + ' + fmt(c) + ' = ?';
        }
        break;

      case 'multiply':
        a = randomInt(1, 9);
        b = randomInt(1, 9);
        answer = a * b;
        text = a + ' x ' + b + ' = ?';
        break;

      case 'multiply_two':
        a = randomInt(1, 9);
        b = randomInt(10, 99);
        answer = a * b;
        text = a + ' x ' + b + ' = ?';
        break;

      case 'multiply_two_two':
        a = randomInt(10, 99);
        b = randomInt(2, 9);
        answer = a * b;
        text = a + ' x ' + b + ' = ?';
        break;

      case 'divide':
        b = randomInt(2, level >= 11 ? 12 : 9);
        answer = randomInt(2, level >= 11 ? 99 : 12);
        a = answer * b;
        text = a + ' \u00F7 ' + b + ' = ?';
        break;

      case 'round':
        a = randomInt(1, 900000);
        var place = ROUND_PLACES[randomInt(0, ROUND_PLACES.length - 1)];
        answer = Math.round(a / place.divisor) * place.divisor;
        text = 'Round ' + fmt(a) + ' to the nearest ' + place.name + '.';
        break;

      default:
        return generateProblem();
    }

    answer = Math.floor(Number(answer));
    if (isNaN(answer) || !isFinite(answer) || answer < 0) return generateProblem();

    var problem = { text: text, answer: answer };
    if (state.lastProblem && state.lastProblem.text === text) return generateProblem();
    state.lastProblem = problem;
    return problem;
  }

  function updatePlanetColors() {
    var level = state.level;
    // Target planet = current level color
    var targetColor = PLANET_COLORS[(level - 1) % PLANET_COLORS.length];
    targetPlanet.style.background = targetColor;
    targetPlanet.style.borderRadius = '50%';

    // Ground = previous planet (level 1 = earth)
    if (level === 1) {
      groundPlanet.style.background = GROUND_COLOR;
      groundPlanet.style.borderRadius = '4px';
    } else {
      var prevColor = PLANET_COLORS[(level - 2) % PLANET_COLORS.length];
      groundPlanet.style.background = prevColor;
      groundPlanet.style.borderRadius = '50%';
    }

    if (levelCompletePlanet) {
      levelCompletePlanet.style.background = targetColor;
      levelCompletePlanet.style.borderRadius = '50%';
    }
  }

  function updateShipPosition() {
    if (!shipContainer || !groundPlanet || !targetPlanet) return;
    var diagram = shipContainer.parentElement;
    if (!diagram) return;
    var diagramRect = diagram.getBoundingClientRect();
    if (diagramRect.height < 8) return;
    var shipH = shipContainer.offsetHeight || 60;
    var groundTop = groundPlanet.getBoundingClientRect().top - diagramRect.top;
    var planetBottom = targetPlanet.getBoundingClientRect().bottom - diagramRect.top;
    var startTop = groundTop - shipH;
    var endTop = planetBottom;
    if (!isFinite(startTop) || !isFinite(endTop)) return;
    var step = Math.max(0, Math.min(10, state.currentStep));
    var topPx = startTop + (endTop - startTop) * (step / 10);
    shipContainer.style.top = Math.round(topPx) + 'px';
  }

  function scheduleShipPosition() {
    requestAnimationFrame(function () {
      updateShipPosition();
      requestAnimationFrame(updateShipPosition);
    });
  }

  function updateLives() {
    [1, 2, 3].forEach(function (i) {
      var el = document.getElementById('flame' + i);
      if (!el) return;
      el.classList.remove('life-rocket-full', 'life-rocket-empty');
      el.classList.add(state.lives >= i ? 'life-rocket-full' : 'life-rocket-empty');
    });
  }

  function renderProblemText() {
    if (state.currentProblem) {
      mathProblemEl.textContent = problemStem(state.currentProblem.text);
      if (answerInputDisplay) {
        answerInputDisplay.textContent = state.userInput;
        answerInputDisplay.classList.toggle('is-empty', !state.userInput);
      }
    }
    if (btnSubmit) {
      btnSubmit.disabled = !String(state.userInput || '').trim();
    }
  }

  function parseWholeNumber(str) {
    if (typeof str !== 'string') return NaN;
    var normalized = str.replace(/,/g, '').trim();
    if (!/^\d+$/.test(normalized)) return NaN;
    return Number(normalized);
  }

  function solveFromProblemText(text) {
    if (typeof text !== 'string') return null;

    var roundMatch = text.match(/^Round\s+([\d,]+)\s+to the nearest\s+(tens|hundreds|thousands|ten thousands|hundred thousands)\.$/);
    if (roundMatch) {
      var rawNum = parseWholeNumber(roundMatch[1]);
      if (!isFinite(rawNum)) return null;
      var placeMap = {
        'tens': 10,
        'hundreds': 100,
        'thousands': 1000,
        'ten thousands': 10000,
        'hundred thousands': 100000
      };
      var divisor = placeMap[roundMatch[2]];
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

  function showProblem() {
    state.currentProblem = generateProblem();
    state.userInput = '';
    renderProblemText();
  }

  function showFeedback(correct) {
    state.phase = 'feedback';
    if (correct) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    feedbackCheck.classList.remove('show');
    feedbackX.classList.remove('show');
    void feedbackOverlay.offsetWidth;
    if (correct) {
      feedbackCheck.classList.add('show');
    } else {
      feedbackX.classList.add('show');
    }

    setTimeout(function () {
      feedbackCheck.classList.remove('show');
      feedbackX.classList.remove('show');
      if (state.phase === 'gameOver' || state.phase === 'win' || state.phase === 'levelComplete') return;

      if (correct && state.currentStep >= 10) {
        state.phase = 'levelComplete';
        levelCompleteOverlay.classList.remove('hidden');
        updatePlanetColors();
        if (levelCompletePlanet) {
          levelCompletePlanet.style.background = PLANET_COLORS[(state.level - 1) % PLANET_COLORS.length];
          levelCompletePlanet.style.borderRadius = '50%';
        }
        playSfx('levelComplete', levelCompleteSound, 0.7);
        return;
      }
      if (!correct && state.lives <= 0) {
        state.phase = 'gameOver';
        gameOverOverlay.classList.remove('hidden');
        gameOverText.classList.add('flash');
        explosion.classList.add('active');
        if (startSoundtrack && startSoundtrack.play) {
          unlockAudio();
          startSoundtrack.currentTime = 0;
          startSoundtrack.volume = 0.6;
          startSoundtrack.play().catch(function () {});
        }
        setTimeout(function () {
          explosion.classList.remove('active');
        }, 1000);
        return;
      }

      state.phase = 'playing';
      showProblem();
    }, 1200);
  }

  function submitAnswer() {
    if (state.phase !== 'playing' || !state.currentProblem) return;
    if (btnSubmit && btnSubmit.disabled) return;
    var trimmed = String(state.userInput).trim();
    if (!trimmed) return;
    var num = trimmed === '' ? NaN : parseWholeNumber(trimmed);
    var expected = Number(state.currentProblem.answer);
    var solvedFromText = solveFromProblemText(state.currentProblem.text);
    if (solvedFromText !== null && isFinite(solvedFromText)) {
      expected = Number(solvedFromText);
    }
    var correct = trimmed !== '' && !isNaN(num) && num === expected && isFinite(expected);

    var points = getPointsPerLevel(state.level);
    if (correct) {
      state.currentStep = Math.min(10, state.currentStep + 1);
      state.score += points;
      shipContainer.classList.add('thrusting');
      updateShipPosition();
      setTimeout(function () {
        shipContainer.classList.remove('thrusting');
      }, 500);
    } else {
      state.currentStep = Math.max(0, state.currentStep - 1);
      state.lives -= 1;
      state.score -= points;
      updateLives();
      updateShipPosition();
    }
    updateScoreDisplay();
    showFeedback(correct);
  }

  function addDigit(d) {
    if (state.phase !== 'playing') return;
    if (state.userInput.length >= 7) return;
    state.userInput += String(d);
    renderProblemText();
  }

  function deleteDigit() {
    if (state.phase !== 'playing') return;
    state.userInput = state.userInput.slice(0, -1);
    renderProblemText();
  }

  var rocketSoundToken = 0;

  function stopRocketSound() {
    rocketSoundToken += 1;
    if (!rocketSound) return;
    rocketSound.pause();
    rocketSound.currentTime = 0;
  }

  function playRocketSound() {
    if (!rocketSound || !rocketSound.play) return;
    if (rocketSound.error || !(isFinite(rocketSound.duration) && rocketSound.duration > 0)) return;
    unlockAudio();
    var audio = rocketSound;
    var token = ++rocketSoundToken;
    audio.volume = 0;
    audio.currentTime = 0;
    audio.play().catch(function () {});

    var start = performance.now();
    var duration = 4000;
    var fadeIn = 300;
    var fadeOutStart = duration - 500;

    function tick(now) {
      if (token !== rocketSoundToken) return;
      var t = (now - start) / 1000;
      if (t >= duration) {
        audio.pause();
        audio.currentTime = 0;
        return;
      }
      if (t < fadeIn / 1000) {
        audio.volume = (t / (fadeIn / 1000)) * 0.6;
      } else if (t > fadeOutStart / 1000) {
        audio.volume = ((duration / 1000 - t) / (500 / 1000)) * 0.6;
      } else {
        audio.volume = 0.6;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function playRocketLaunchSound() {
    stopRocketSound();
    playSfx('rocketLaunch', rocketLaunchSound, 0.8);
  }

  // Astronaut needs to cross the gantry before the countdown starts; this
  // matches the walk beat in the reference sequence.
  var ASTRONAUT_WALK_MS = 7400;

  function resetIntroStage() {
    if (introRocket) {
      introRocket.classList.remove('is-igniting', 'is-launching');
      introRocket.style.removeProperty('--launch-dur');
    }
    if (astronaut) astronaut.classList.remove('is-walking');
  }

  function runIntro() {
    state.phase = 'intro';
    introOverlay.classList.remove('hidden');
    countdownOverlay.classList.add('hidden');
    if (introStage) introStage.classList.remove('hidden');
    resetIntroStage();

    setTimeout(function () {
      // Restart the walk cleanly even on a replay.
      void astronaut.offsetWidth;
      astronaut.classList.add('is-walking');
    }, 500);

    setTimeout(function () {
      countdownOverlay.classList.remove('hidden');
      runCountdown();
    }, 500 + ASTRONAUT_WALK_MS);
  }

  function launchDurationSec() {
    var launchBuffer = sfxBuffers.rocketLaunch;
    if (launchBuffer && launchBuffer.duration > 0) return launchBuffer.duration;
    if (rocketLaunchSound && isFinite(rocketLaunchSound.duration) && rocketLaunchSound.duration > 0) {
      return rocketLaunchSound.duration;
    }
    return 3.5;
  }

  function runCountdown() {
    state.phase = 'countdown';
    var steps = ['3', '2', '1', 'go'];
    var stepIndex = 0;
    countdownNumber.dataset.step = steps[0];
    fadeOutStartSoundtrack(null, 700);
    playRocketSound();
    playSfx('countdown', countdownSound, 0.8);

    function showNext() {
      stepIndex += 1;
      if (stepIndex >= steps.length) return;

      countdownNumber.dataset.step = steps[stepIndex];
      countdownNumber.style.animation = 'none';
      void countdownNumber.offsetWidth;
      countdownNumber.style.animation = 'countdownPop 1s ease-out';

      if (steps[stepIndex] !== 'go') {
        setTimeout(showNext, 1000);
        return;
      }

      // GO! is the ignition beat: the plume lights and the rocket leaves while
      // the word is still on screen.
      var durationSec = launchDurationSec();
      if (introRocket) {
        introRocket.style.setProperty('--launch-dur', durationSec + 's');
        introRocket.classList.add('is-igniting');
        void introRocket.offsetWidth;
        introRocket.classList.add('is-launching');
      }
      playRocketLaunchSound();
      setTimeout(function () {
        countdownOverlay.classList.add('hidden');
      }, 900);
      setTimeout(function () {
        introOverlay.classList.add('hidden');
        resetIntroStage();
        startLevel();
      }, durationSec * 1000);
    }
    setTimeout(showNext, 1000);
  }

  function startLevel() {
    state.phase = 'playing';
    state.currentStep = 0;
    state.lives = 3;
    state.score = 0;
    state.lastProblem = null;
    updatePlanetColors();
    scheduleShipPosition();
    updateLives();
    updateLevelDisplay();
    updateScoreDisplay();
    gameOverOverlay.classList.add('hidden');
    winOverlay.classList.add('hidden');
    levelCompleteOverlay.classList.add('hidden');
    gameOverText.classList.remove('flash');
    showProblem();
  }

  function continueToNextLevel() {
    state.level += 1;
    state.currentStep = 0;
    // Lives and score carry over from previous level
    state.lastProblem = null;
    levelCompleteOverlay.classList.add('hidden');
    updatePlanetColors();
    scheduleShipPosition();
    updateLives();
    updateLevelDisplay();
    state.phase = 'playing';
    showProblem();
  }

  function playAgain() {
    state.level = 1;
    if (startSoundtrack) {
      startSoundtrack.pause();
      startSoundtrack.currentTime = 0;
    }
    gameOverOverlay.classList.add('hidden');
    winOverlay.classList.add('hidden');
    levelCompleteOverlay.classList.add('hidden');
    runIntro();
  }

  function onFirstInteraction() {
    unlockAudio();
  }

  if (keypadEl) {
    keypadEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.keypad-btn');
      if (!btn) return;
      onFirstInteraction();
      if (btn === btnSubmit) {
        submitAnswer();
        return;
      }
      playKeypadClick();
      if (btn.classList.contains('num')) {
        var d = btn.getAttribute('data-digit');
        if (d != null) addDigit(parseInt(d, 10));
      } else if (btn === btnDelete) {
        deleteDigit();
      }
    });
  }

  continueBtn.addEventListener('click', continueToNextLevel);
  playAgainBtn.addEventListener('click', playAgain);
  playAgainBtnWin.addEventListener('click', playAgain);

  document.addEventListener('keydown', function (e) {
    if (e.key >= '0' && e.key <= '9') {
      onFirstInteraction();
      addDigit(parseInt(e.key, 10));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      onFirstInteraction();
      if (!(btnSubmit && btnSubmit.disabled)) submitAnswer();
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      onFirstInteraction();
      deleteDigit();
      e.preventDefault();
    }
  });

  function playStartSoundtrack() {
    if (!startSoundtrackDesired || !startSoundtrack || !startSoundtrack.play) return;
    startSoundtrack.loop = true;
    startSoundtrack.muted = false;
    startSoundtrack.volume = 0.6;
    if (!startSoundtrack.paused && !startSoundtrack.ended) return;
    try { startSoundtrack.currentTime = 0; } catch (err) {}
    var playPromise = startSoundtrack.play();
    if (playPromise && playPromise.catch) playPromise.catch(function () {});
  }

  function fadeOutStartSoundtrack(done, durationMs) {
    startSoundtrackDesired = false;
    if (!startSoundtrack || !startSoundtrack.play || startSoundtrack.paused || startSoundtrack.volume <= 0) {
      if (startSoundtrack) {
        startSoundtrack.pause();
        startSoundtrack.currentTime = 0;
      }
      if (done) done();
      return;
    }
    var startVol = startSoundtrack.volume;
    var duration = durationMs || 1200;
    var start = performance.now();
    function tick(now) {
      var elapsed = now - start;
      if (elapsed >= duration) {
        startSoundtrack.volume = 0;
        startSoundtrack.pause();
        startSoundtrack.currentTime = 0;
        if (done) done();
        return;
      }
      startSoundtrack.volume = Math.max(0, startVol * (1 - elapsed / duration));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function buildTitleLetters() {
    if (!gameTitle || gameTitle.querySelector('.title-letter')) return;
    var text = gameTitle.textContent;
    var chars = text.split('');
    var mid = (chars.length - 1) / 2;
    gameTitle.textContent = '';
    chars.forEach(function (ch, i) {
      var span = document.createElement('span');
      span.className = 'title-letter';
      span.textContent = ch;
      // Push each letter away from the centre, outer letters travel furthest.
      var offset = (i - mid) / mid;
      span.style.setProperty('--letter-fly', (offset * 70).toFixed(1) + 'vw');
      span.style.setProperty('--letter-rise', (Math.abs(offset) * -18 - 6).toFixed(1) + 'vh');
      span.style.setProperty('--letter-spin', (offset * 55).toFixed(1) + 'deg');
      span.style.setProperty('--letter-delay', Math.round(Math.abs(offset) * 90) + 'ms');
      gameTitle.appendChild(span);
    });
  }

  function restoreGameTitle() {
    if (!gameTitle) return;
    gameTitle.classList.remove('fade-out');
    buildTitleLetters();
  }

  var startPhase = 'load';
  var titleReadyAt = 0;

  function loadGameFromTap() {
    if (startPhase !== 'load') return;
    startPhase = 'title';
    titleReadyAt = Date.now() + 300;
    unlockAudio();
    startSoundtrackDesired = true;
    playStartSoundtrack();
    if (loadGameOverlay) loadGameOverlay.classList.add('hidden');
  }

  function startGameFromTitle() {
    if (startPhase !== 'title') return;
    if (Date.now() < titleReadyAt) return;
    if (clickToStart && clickToStart.classList.contains('hidden')) return;
    startPhase = 'starting';
    if (clickToStart) clickToStart.classList.add('hidden');
    unlockAudio();
    fadeOutStartSoundtrack(null);
    if (gameTitle) gameTitle.classList.add('fade-out');
    setTimeout(function () {
      runIntro();
    }, 720);
  }

  function handleIntroStart(e) {
    if (e && e.pointerType === 'mouse' && e.button !== 0) return;
    if (startPhase === 'load') {
      loadGameFromTap();
      return;
    }
    startGameFromTitle();
  }

  introOverlay.addEventListener('pointerdown', handleIntroStart);
  introOverlay.addEventListener('touchend', function (e) {
    if (startPhase === 'starting') return;
    e.preventDefault();
    handleIntroStart(e);
  }, { passive: false });
  introOverlay.addEventListener('click', handleIntroStart);

  updatePlanetColors();
  updateLevelDisplay();
  updateScoreDisplay();
  restoreGameTitle();
  if (loadGameOverlay) loadGameOverlay.classList.remove('hidden');
  if (clickToStart) clickToStart.classList.remove('hidden');
  introOverlay.classList.remove('hidden');
  countdownOverlay.classList.add('hidden');
  if (startSoundtrack) {
    startSoundtrack.loop = true;
    startSoundtrack.volume = 0.6;
    startSoundtrack.setAttribute('playsinline', '');
    startSoundtrack.playsInline = true;
  }
  prefetchSfx();
  scheduleShipPosition();
  window.addEventListener('resize', updateShipPosition);
  window.addEventListener('orientationchange', function () {
    setTimeout(updateShipPosition, 150);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateShipPosition);
  }
})();
