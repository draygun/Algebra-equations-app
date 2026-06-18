// pages/wordle.js — Wordle с математическими терминами

const WORDLE_MASCOT_PHRASES = {
  win: [
    'Потрясающе! Ты угадал! 🎉',
    'Верно! Отличный словарный запас! 💪',
    'Ура! Правильно! Ты — математический гений! ⭐',
    'Блестяще! Слово найдено! 🏆',
    'Молодец! Математика + слова — твой конёк! ✨',
  ],
  lose: [
    'В этот раз не получилось. Но в следующих попытках повезёт! 🤗',
    'Не расстраивайся! Завтра новое слово! 🌟',
    'Попробуй ещё раз — практика делает мастера! 💪',
  ],
  firstTry: [
    'С ПЕРВОЙ ПОПЫТКИ!!! Невероятно! 🎉🎉🎉',
    'Вау! С первой попытки! Ты читаешь мысли! 🔮',
    'Идеально! Быстрее некуда! ⚡',
  ],
  close: [
    'Так близко! Осталась всего одна буква! 🤏',
    'Уже почти! Соберись! 🎯',
  ],
  empty: [
    'Попробуй угадать математический термин! 📝',
    'Вводи буквы с клавиатуры! 🎮',
  ],
  hint: [
    'Вот подсказка! Одна буква открыта 🔍',
    'Используй эту букву с умом! 🤓',
    'Хорошая буква — хороший ход! 📌',
  ],
  giveUp: [
    'Не сдавайся! В следующий раз получится! 💪',
    'Сдаёшься? Ладно, это было сложное слово! 🤗',
    'Правильный ответ всё равно полезно узнать! 📖',
  ],
};

const WORDLE_KEYBOARD_ROWS = [
  'ЙЦУКЕНГШЩЗХЪ'.split(''),
  'ФЫВАПРОЛДЖЭ'.split(''),
  'ЯЧСМИТЬБЮ'.split(''),
];

const WORDLE_MAX_ATTEMPTS = 6;

let wordleState = {
  targetWord: '',
  targetObj: null,
  guesses: [],
  currentGuess: '',
  gameOver: false,
  won: false,
  wordLength: 0,
  isDaily: false,
  dailySeed: '',
  keyboardColors: {},
  revealedPositions: [],
  hintsRemaining: 3,
};

function renderWordlePage(app, params, hash) {
  app.className = 'page page-wordle';

  const isDaily = hash.includes('/daily');
  wordleState.isDaily = isDaily;

    app.innerHTML = `
    <div class="wordle-wrapper">
      <div class="wordle-container">
        <div class="wordle-header">
          <h1>${isDaily ? 'Ежедневное слово' : 'Wordle'}</h1>
          <p class="wordle-subtitle">Угадай математический термин</p>
        </div>
        <div id="wordle-hints"></div>
        <div id="wordle-board"></div>
        <div class="wordle-hint-btn-container">
          <button id="wordle-hint-btn" class="wordle-hint-btn" onclick="handleWordleHint()">💡 Подсказка (3)</button>
          <button id="wordle-giveup-btn" class="wordle-giveup-btn" onclick="handleWordleGiveUp()">Сдаюсь 😅</button>
        </div>
        <div id="wordle-keyboard"></div>
        <div id="wordle-message"></div>
        <div id="wordle-next"></div>
      </div>
      <div id="wordle-mascot" class="mascot mascot-visible">
        <div class="mascot-speech info"></div>
        <div class="mascot-character">
          <img class="mascot-img" src="data/character.png" alt="Помощник">
        </div>
      </div>
    </div>
  `;

  startWordleGame(isDaily);
}

function getDailySeed() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function hashSeed(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickWordleWord(isDaily) {
  if (isDaily) {
    const seed = getDailySeed();
    const idx = hashSeed(seed) % WORDLE_WORDS.length;
    wordleState.targetObj = WORDLE_WORDS[idx];
  } else {
    wordleState.targetObj = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
  }
  wordleState.targetWord = wordleState.targetObj.word;
  wordleState.wordLength = wordleState.targetObj.length;
}

function startWordleGame(isDaily) {
  wordleState.guesses = [];
  wordleState.currentGuess = '';
  wordleState.gameOver = false;
  wordleState.won = false;
  wordleState.keyboardColors = {};
  wordleState.revealedPositions = [];
  wordleState.hintsRemaining = 3;

  pickWordleWord(isDaily);

  const board = document.getElementById('wordle-board');
  const keyboard = document.getElementById('wordle-keyboard');
  const msg = document.getElementById('wordle-message');
  const next = document.getElementById('wordle-next');
  if (msg) msg.innerHTML = '';
  if (next) next.innerHTML = '';

  renderWordleGrid(board);
  renderWordleHints();
  renderWordleKeyboard(keyboard);
  updateWordleHintButton();
  updateWordleGiveUpButton();
  showWordleMascot(getWordlePhrase('empty'), 'info');

  document.removeEventListener('keydown', handleWordlePhysicalKey);
  document.addEventListener('keydown', handleWordlePhysicalKey);
}

function renderWordleGrid(board) {
  const len = wordleState.wordLength;
  let html = `<div class="wordle-grid" style="grid-template-columns: repeat(${len}, 1fr);">`;
  for (let r = 0; r < WORDLE_MAX_ATTEMPTS; r++) {
    for (let c = 0; c < len; c++) {
      html += `<div class="wordle-tile" id="tile-${r}-${c}"></div>`;
    }
  }
  html += '</div>';
  board.innerHTML = html;
}

function renderWordleKeyboard(container) {
  let html = '<div class="wordle-keyboard">';
  WORDLE_KEYBOARD_ROWS.forEach((row, ri) => {
    html += '<div class="wordle-keyboard-row">';
    if (ri === 2) {
      html += `<button class="wordle-key wordle-key-wide" onclick="handleWordleKey('ENTER')">Enter</button>`;
    }
    row.forEach(ch => {
      const color = wordleState.keyboardColors[ch] || '';
      html += `<button class="wordle-key ${color}" onclick="handleWordleKey('${ch}')">${ch}</button>`;
    });
    if (ri === 2) {
      html += `<button class="wordle-key wordle-key-wide" onclick="handleWordleKey('DEL')">Del</button>`;
    }
    html += '</div>';
  });
  html += '</div>';
  if (container) container.innerHTML = html;
}

function updateWordleKeyboard() {
  const container = document.getElementById('wordle-keyboard');
  if (container) renderWordleKeyboard(container);
}

function updateWordleGrid() {
  const len = wordleState.wordLength;
  for (let r = 0; r < wordleState.guesses.length; r++) {
    const guess = wordleState.guesses[r];
    const colors = computeWordleColors(guess);

    for (let c = 0; c < len; c++) {
      const tile = document.getElementById(`tile-${r}-${c}`);
      if (!tile) continue;
      tile.textContent = guess[c];
      tile.className = `wordle-tile wordle-tile-${colors[c]}`;
      tile.style.animationDelay = `${c * 0.15}s`;
    }
  }

  const currentRow = wordleState.guesses.length;
  const currentGuess = wordleState.currentGuess;
  for (let c = 0; c < len; c++) {
    const tile = document.getElementById(`tile-${currentRow}-${c}`);
    if (!tile) continue;
    tile.textContent = currentGuess[c] || '';
    tile.className = currentGuess[c] ? 'wordle-tile wordle-tile-filled' : 'wordle-tile wordle-tile-empty';
  }
}

function computeWordleColors(guess) {
  const target = wordleState.targetWord;
  const len = target.length;
  const colors = new Array(len).fill('absent');
  const targetChars = target.split('');
  const guessChars = guess.split('');

  // First pass: find greens
  for (let i = 0; i < len; i++) {
    if (guessChars[i] === targetChars[i]) {
      colors[i] = 'correct';
      targetChars[i] = null;
      guessChars[i] = null;
    }
  }

  // Second pass: find yellows
  for (let i = 0; i < len; i++) {
    if (guessChars[i] === null) continue;
    const idx = targetChars.indexOf(guessChars[i]);
    if (idx !== -1) {
      colors[i] = 'present';
      targetChars[idx] = null;
    }
  }

  // Update keyboard colors
  for (let i = 0; i < len; i++) {
    const ch = guess[i];
    const current = wordleState.keyboardColors[ch];
    const newColor = colors[i] === 'correct' ? 'key-correct'
      : colors[i] === 'present' ? (current === 'key-correct' ? 'key-correct' : 'key-present')
      : (current === 'key-correct' || current === 'key-present') ? current : 'key-absent';
    wordleState.keyboardColors[ch] = newColor;
  }

  return colors;
}

function handleWordleKey(key) {
  if (wordleState.gameOver) return;

  if (key === 'ENTER') {
    submitWordleGuess();
    return;
  }

  if (key === 'DEL' || key === 'BACKSPACE' || key === 'Backspace') {
    if (wordleState.currentGuess.length > 0) {
      wordleState.currentGuess = wordleState.currentGuess.slice(0, -1);
      updateWordleGrid();
    }
    return;
  }

  // Ignore non-letter keys for physical keyboard
  const russianLetters = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  if (!russianLetters.includes(key)) return;

  if (wordleState.currentGuess.length < wordleState.wordLength) {
    wordleState.currentGuess += key;
    updateWordleGrid();
  }
}

function handleWordlePhysicalKey(e) {
  const key = e.key.toUpperCase();
  if (key === 'ENTER') {
    e.preventDefault();
    handleWordleKey('ENTER');
  } else if (key === 'BACKSPACE') {
    e.preventDefault();
    handleWordleKey('DEL');
  } else if (key.length === 1 && 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.includes(key)) {
    handleWordleKey(key);
  }
}

function submitWordleGuess() {
  const guess = wordleState.currentGuess;
  const len = wordleState.wordLength;

  if (guess.length !== len) {
    showWordleMessage('Слово должно быть ' + len + ' букв');
    return;
  }

  if (!WORDLE_WORDS.some(w => w.word === guess)) {
    showWordleMessage('Такого слова нет в списке');
    return;
  }

  wordleState.guesses.push(guess);
  wordleState.currentGuess = '';
  updateWordleGrid();
  updateWordleKeyboard();

  if (guess === wordleState.targetWord) {
    wordleState.gameOver = true;
    wordleState.won = true;
    wordleWin();
  } else if (wordleState.guesses.length >= WORDLE_MAX_ATTEMPTS) {
    wordleState.gameOver = true;
    wordleLose();
  } else {
    // Check if one letter off
    const colors = computeWordleColors(guess);
    const correctCount = colors.filter(c => c === 'correct').length;
    if (correctCount >= len - 1) {
      showWordleMascot(getWordlePhrase('close'), 'info');
    }
    showWordleMessage('');
  }
}

function updateWordleHintButton() {
  const btn = document.getElementById('wordle-hint-btn');
  if (!btn) return;
  if (wordleState.gameOver || wordleState.hintsRemaining <= 0) {
    btn.disabled = true;
    btn.textContent = wordleState.hintsRemaining <= 0 ? '💡 Подсказок нет' : '💡 Подсказка (0)';
    btn.classList.add('wordle-hint-btn-disabled');
  } else {
    btn.disabled = false;
    btn.textContent = `💡 Подсказка (${wordleState.hintsRemaining})`;
    btn.classList.remove('wordle-hint-btn-disabled');
  }
}

function updateWordleGiveUpButton() {
  const btn = document.getElementById('wordle-giveup-btn');
  if (!btn) return;
  if (wordleState.gameOver) {
    btn.style.display = 'none';
  } else {
    btn.style.display = 'inline-block';
  }
}

function handleWordleGiveUp() {
  if (wordleState.gameOver) return;
  wordleState.gameOver = true;
  wordleState.won = false;

  const msg = document.getElementById('wordle-message');
  if (msg) {
    msg.innerHTML = `
      <div class="msg msg-error">
        <strong>Правильный ответ:</strong>
        <p style="font-size:1.3em;font-weight:700;margin-top:4px">${wordleState.targetWord}</p>
      </div>
    `;
  }

  updateWordleHintButton();
  updateWordleGiveUpButton();
  showWordleMascot(getWordlePhrase('giveUp'), 'error');
  showWordleNextButton();
  saveWordleProgress(false, WORDLE_MAX_ATTEMPTS);
}

function renderWordleHints() {
  const container = document.getElementById('wordle-hints');
  if (!container) return;
  const len = wordleState.wordLength;
  const target = wordleState.targetWord;
  const revealed = wordleState.revealedPositions;

  if (revealed.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  let html = '<div class="wordle-hints-label">Подсказка:</div><div class="wordle-hints-row">';
  for (let i = 0; i < len; i++) {
    if (revealed.includes(i)) {
      html += `<div class="wordle-hint-tile wordle-hint-tile-revealed">${target[i]}</div>`;
    } else {
      html += `<div class="wordle-hint-tile wordle-hint-tile-hidden">?</div>`;
    }
  }
  html += '</div>';
  container.innerHTML = html;
}

function handleWordleHint() {
  if (wordleState.gameOver || wordleState.hintsRemaining <= 0) return;

  const len = wordleState.wordLength;
  const available = [];
  for (let i = 0; i < len; i++) {
    if (!wordleState.revealedPositions.includes(i)) {
      available.push(i);
    }
  }
  if (available.length === 0) return;

  const pos = available[Math.floor(Math.random() * available.length)];
  wordleState.revealedPositions.push(pos);
  wordleState.hintsRemaining--;

  const ch = wordleState.targetWord[pos];
  const current = wordleState.keyboardColors[ch];
  if (current !== 'key-correct') {
    wordleState.keyboardColors[ch] = 'key-correct';
    updateWordleKeyboard();
  }

  renderWordleHints();
  updateWordleHintButton();
  showWordleMascot(getWordlePhrase('hint'), 'info');
}

function wordleWin() {
  const attempts = wordleState.guesses.length;
  const phrase = attempts === 1 ? getWordlePhrase('firstTry') : getWordlePhrase('win');
  showWordleMascot(phrase, 'success');
  
  const msg = document.getElementById('wordle-message');
  if (msg) {
    msg.innerHTML = `
      <div class="msg msg-success">
        <strong>Поздравляем!</strong>
        <p>Ты угадал слово <strong>${wordleState.targetWord}</strong> за ${attempts} ${attempts === 1 ? 'попытку' : attempts < 5 ? 'попытки' : 'попыток'}!</p>
      </div>
    `;
  }

  updateWordleHintButton();
  showWordleNextButton();
  saveWordleProgress(true, attempts);
}

function wordleLose() {
  showWordleMascot(getWordlePhrase('lose'), 'error');
  updateWordleHintButton();

  const msg = document.getElementById('wordle-message');
  if (msg) {
    msg.innerHTML = `
      <div class="msg msg-error">
        <strong>Не угадал</strong>
        <p>Загаданное слово: <strong>${wordleState.targetWord}</strong></p>
      </div>
    `;
  }

  showWordleNextButton();
  saveWordleProgress(false, WORDLE_MAX_ATTEMPTS);
}

function showWordleNextButton() {
  const next = document.getElementById('wordle-next');
  if (!next) return;
  const isDaily = wordleState.isDaily;
  next.innerHTML = isDaily
    ? '<p class="wordle-daily-countdown">Завтра новое слово!</p>'
    : '<button onclick="startWordleGame(false)" class="btn btn-primary">Следующее слово</button>';
}

function showWordleMessage(text) {
  const msg = document.getElementById('wordle-message');
  if (!msg) return;
  if (text) {
    msg.innerHTML = `<div class="msg msg-warning">${text}</div>`;
  } else {
    msg.innerHTML = '';
  }
}

function showWordleMascot(phrase, type) {
  const mascot = document.getElementById('wordle-mascot');
  if (!mascot) return;
  mascot.className = 'mascot mascot-visible';
  mascot.innerHTML = `
    <div class="mascot-speech ${type || ''}">${phrase}</div>
    <div class="mascot-character">
      <img class="mascot-img" src="data/character.png" alt="Помощник">
    </div>
  `;
}

function getWordlePhrase(category) {
  const phrases = WORDLE_MASCOT_PHRASES[category] || WORDLE_MASCOT_PHRASES.empty;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

async function saveWordleProgress(won, attempts) {
  if (!firestore || !window.currentUser) return;
  try {
    const userId = window.currentUser.uid;
    const ref = firestore.collection('users').doc(userId).collection('wordle').doc('stats');
    const doc = await ref.get();
    const data = { gamesPlayed: 1, wins: won ? 1 : 0, totalAttempts: attempts };
    if (doc.exists) {
      const existing = doc.data();
      const newWins = (existing.wins || 0) + (won ? 1 : 0);
      const newGames = (existing.gamesPlayed || 0) + 1;
      let newStreak = won ? (existing.currentStreak || 0) + 1 : 0;
      await ref.update({
        gamesPlayed: newGames,
        wins: newWins,
        totalAttempts: (existing.totalAttempts || 0) + attempts,
        currentStreak: newStreak,
        maxStreak: Math.max(newStreak, existing.maxStreak || 0),
        lastPlayed: new Date().toISOString(),
      });
    } else {
      await ref.set({
        ...data,
        currentStreak: won ? 1 : 0,
        maxStreak: won ? 1 : 0,
        lastPlayed: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn('Failed to save wordle progress:', e);
  }
}
