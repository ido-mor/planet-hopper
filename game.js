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
  var introScene = document.getElementById('introScene');
  var blastOffScene = document.getElementById('blastOffScene');
  var countdownOverlay = document.getElementById('countdownOverlay');
  var countdownNumber = document.getElementById('countdownNumber');
  var astronaut = document.getElementById('astronaut');
  var doorLeft = document.getElementById('doorLeft');
  var doorRight = document.getElementById('doorRight');
  var playAgainBtn = document.getElementById('playAgainBtn');
  var playAgainBtnWin = document.getElementById('playAgainBtnWin');
  var btnSubmit = document.getElementById('btnSubmit');
  var btnDelete = document.getElementById('btnDelete');
  var startSoundtrack = document.getElementById('startSoundtrack');
  var countdownSound = document.getElementById('countdownSound');
  var rocketLaunchSound = document.getElementById('rocketLaunchSound');
  var rocketSound = document.getElementById('rocketSound');
  var blastOffRocket = document.getElementById('blastOffRocket');
  var levelCompleteSound = document.getElementById('levelCompleteSound');
  var correctSound = document.getElementById('correctSound');
  var wrongSound = document.getElementById('wrongSound');
  var clickToStart = document.getElementById('clickToStart');
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

  // Web Audio for ding (correct) and buzzer (wrong); unlocked on first user gesture
  var audioCtx = null;
  var audioUnlocked = false;

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    if (rocketSound && rocketSound.play) {
      rocketSound.volume = 0;
      rocketSound.currentTime = 0;
      rocketSound.play().then(function () {
        rocketSound.pause();
        rocketSound.currentTime = 0;
      }).catch(function () {});
    }
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function playCorrectSound() {
    unlockAudio();
    if (!correctSound || !correctSound.play) return;
    correctSound.volume = 0.7;
    correctSound.currentTime = 0;
    correctSound.play().catch(function () {});
  }

  function playWrongSound() {
    unlockAudio();
    if (!wrongSound || !wrongSound.play) return;
    wrongSound.volume = 0.7;
    wrongSound.currentTime = 0;
    wrongSound.play().catch(function () {});
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
    var pct = 88 - state.currentStep * 8;
    shipContainer.style.top = pct + '%';
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
    if (!state.currentProblem) return;
    var displayValue = state.userInput || '?';
    mathProblemEl.textContent = state.currentProblem.text.replace('?', displayValue);
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
        if (levelCompleteSound && levelCompleteSound.play) {
          unlockAudio();
          levelCompleteSound.currentTime = 0;
          levelCompleteSound.volume = 0.7;
          levelCompleteSound.play().catch(function () {});
        }
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
    var trimmed = String(state.userInput).trim();
    var num = trimmed === '' ? NaN : parseInt(trimmed, 10);
    var expected = Number(state.currentProblem.answer);
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

  function playRocketSound() {
    if (!rocketSound || !rocketSound.play) return;
    unlockAudio();
    var audio = rocketSound;
    audio.volume = 0;
    audio.currentTime = 0;
    audio.play().catch(function () {});

    var start = performance.now();
    var duration = 4000;
    var fadeIn = 300;
    var fadeOutStart = duration - 500;

    function tick(now) {
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

  function runIntro() {
    state.phase = 'intro';
    introOverlay.classList.remove('hidden');
    countdownOverlay.classList.add('hidden');
    if (introScene) introScene.classList.remove('hidden');
    if (blastOffScene) {
      blastOffScene.classList.add('hidden');
      blastOffScene.classList.remove('blast-off-active');
    }
    doorLeft.classList.remove('open');
    doorRight.classList.remove('open');
    astronaut.classList.remove('climb');
    astronaut.style.opacity = '1';

    setTimeout(function () {
      astronaut.classList.add('climb');
    }, 500);

    setTimeout(function () {
      doorLeft.classList.add('open');
      doorRight.classList.add('open');
    }, 2600);

    setTimeout(function () {
      doorLeft.classList.remove('open');
      doorRight.classList.remove('open');
      countdownOverlay.classList.remove('hidden');
      runCountdown();
    }, 3600);
  }

  function runCountdown() {
    state.phase = 'countdown';
    var steps = ['3', '2', '1', 'GO!'];
    var stepIndex = 0;
    countdownNumber.textContent = steps[0];
    countdownNumber.classList.remove('countdown-go');
    playRocketSound();
    if (countdownSound && countdownSound.play) {
      unlockAudio();
      countdownSound.currentTime = 0;
      countdownSound.volume = 0.6;
      countdownSound.play().catch(function () {});
    }

    function showNext() {
      stepIndex += 1;
      if (stepIndex < steps.length) {
        countdownNumber.textContent = steps[stepIndex];
        if (steps[stepIndex] === 'GO!') {
          countdownNumber.classList.add('countdown-go');
        } else {
          countdownNumber.classList.remove('countdown-go');
        }
        countdownNumber.style.animation = 'none';
        void countdownNumber.offsetWidth;
        countdownNumber.style.animation = 'countdownPop 1s ease-out';
        setTimeout(showNext, 1000);
      } else {
        countdownOverlay.classList.add('hidden');
        if (introScene) introScene.classList.add('hidden');
        if (blastOffScene) {
          blastOffScene.classList.remove('hidden');
          var durationSec = 3.5;
          var audio = rocketLaunchSound;
          var startBlastOff = function () {
            if (blastOffRocket) blastOffRocket.style.animationDuration = durationSec + 's';
            blastOffScene.classList.add('blast-off-active');
            if (audio && audio.play) {
              unlockAudio();
              audio.currentTime = 0;
              audio.volume = 0.8;
              audio.play().catch(function () {});
            }
            setTimeout(function () {
              introOverlay.classList.add('hidden');
              if (blastOffScene) {
                blastOffScene.classList.add('hidden');
                blastOffScene.classList.remove('blast-off-active');
              }
              if (blastOffRocket) blastOffRocket.style.animationDuration = '';
              if (introScene) introScene.classList.remove('hidden');
              startLevel();
            }, durationSec * 1000);
          };
          if (audio && isFinite(audio.duration) && audio.duration > 0) {
            durationSec = audio.duration;
            startBlastOff();
          } else if (audio) {
            var started = false;
            var onReady = function () {
              if (started) return;
              started = true;
              if (isFinite(audio.duration) && audio.duration > 0) durationSec = audio.duration;
              audio.removeEventListener('loadedmetadata', onReady);
              audio.removeEventListener('durationchange', onReady);
              startBlastOff();
            };
            audio.addEventListener('loadedmetadata', onReady);
            audio.addEventListener('durationchange', onReady);
            if (audio.readyState >= 1 && isFinite(audio.duration) && audio.duration > 0) {
              durationSec = audio.duration;
              onReady();
            } else {
              audio.load();
              setTimeout(function () { if (!started) onReady(); }, 500);
            }
          } else {
            startBlastOff();
          }
        } else {
          introOverlay.classList.add('hidden');
          startLevel();
        }
      }
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
    updateShipPosition();
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
    updateShipPosition();
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

  document.querySelectorAll('.keypad-btn.num').forEach(function (btn) {
    btn.addEventListener('click', function () {
      onFirstInteraction();
      var d = btn.getAttribute('data-digit');
      if (d != null) addDigit(parseInt(d, 10));
    });
  });
  btnDelete.addEventListener('click', function () { onFirstInteraction(); deleteDigit(); });
  btnSubmit.addEventListener('click', function () { onFirstInteraction(); submitAnswer(); });

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
      submitAnswer();
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      onFirstInteraction();
      deleteDigit();
      e.preventDefault();
    }
  });

  var openingSoundtrackStarted = false;

  function fadeOutStartSoundtrack(done) {
    if (!startSoundtrack || !startSoundtrack.play) {
      if (done) done();
      return;
    }
    var startVol = startSoundtrack.volume;
    if (startVol <= 0) {
      startSoundtrack.pause();
      startSoundtrack.currentTime = 0;
      if (done) done();
      return;
    }
    var duration = 1200;
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

  introOverlay.addEventListener('click', function startGame() {
    if (clickToStart && clickToStart.classList.contains('hidden')) return;
    if (!openingSoundtrackStarted) {
      unlockAudio();
      if (startSoundtrack && startSoundtrack.play) {
        startSoundtrack.volume = 0.6;
        startSoundtrack.currentTime = 0;
        startSoundtrack.play().catch(function () {});
      }
      openingSoundtrackStarted = true;
      if (clickToStart) clickToStart.textContent = 'Click to begin';
      return;
    }
    if (clickToStart) clickToStart.classList.add('hidden');
    fadeOutStartSoundtrack(runIntro);
  });

  updateShipPosition();
  updatePlanetColors();
  updateLevelDisplay();
  updateScoreDisplay();
  if (clickToStart) clickToStart.classList.remove('hidden');
  introOverlay.classList.remove('hidden');
  countdownOverlay.classList.add('hidden');
})();
