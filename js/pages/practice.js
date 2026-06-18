// pages/practice.js — страница практики с ИИ

const MASCOT_PHRASES = {
  correct: [
    'Верно! Молодец! 🎉',
    'Отлично! Так держать! 💪',
    'Правильно! Ты хорошо справляешься! ⭐',
    'Великолепно! Ты настоящий математик! 🏆',
    'Блестящий ответ! Продолжай в том же духе! ✨',
  ],
  correctAfterRetry: [
    'Со второй попытки, но справился! Умница! 👍',
    'Главное — не сдаваться! Верный ответ! 💪',
    'Исправил ошибку — это тоже успех! Молодец! 🌟',
    'Ошибка — часть обучения. Главное, что разобрался! 🎯',
  ],
  wrong: [
    'Не совсем так. Попробуй ещё раз! 🤔',
    'Подумай немного иначе. Ты сможешь! 💭',
    'Почти, но не точно. Давай ещё одну попытку! 📝',
    'Не сдавайся! Проверь свои вычисления. 🔍',
  ],
  hintRevealed: [
    'Подсказка уже была показана. Попробуй решить сам! ✏️',
  ],
  newEquation: [
    'Новое уравнение — новый вызов! Удачи! 🚀',
    'Свежая задача ждёт тебя! Поехали! 🎯',
  ],
  encourage: [
    'Ты хорошо справляешься! Продолжай в том же духе! 🌟',
    'У тебя отлично получается! Так держать! 💪',
    'Каждая решённая задача — шаг вперёд! ⭐',
  ],
};

function getRandomPhrase(category) {
  const phrases = MASCOT_PHRASES[category] || MASCOT_PHRASES.encourage;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function sanitizeHint(text) {
  return text
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\\(([^)]+)\\\)/g, '$1')
    .replace(/\\\[([^\]]+)\\\]/g, '$1');
}

let currentPractice = {
  equation: '',
  correctAnswer: '',
  hintRevealed: false,
  eqTypeId: '',
  solved: false,
  retryCount: 0,
  steps: [],
  difficulty: 2,
};

function renderPracticePage(app, params, hash) {
  app.className = 'page page-practice';
  currentPractice.eqTypeId = params.id;
  currentPractice.hintRevealed = false;
  currentPractice.solved = false;
  currentPractice.retryCount = 0;
  currentPractice.steps = [];
  currentPractice.difficulty = parseInt(params.difficulty, 10) || 2;

  try {
    const equations = EQUATIONS_DATA;
    currentPractice.eqType = equations.find(e => e.id === params.id);

    app.innerHTML = `
      <div class="practice-wrapper">
        <div class="practice-container">
          <div class="practice-header">
            <h1>Практика: ${currentPractice.eqType ? currentPractice.eqType.name : ''}</h1>
            <button onclick="router.navigate('/theory/${params.id}')" class="btn btn-outline btn-sm">
              ← К теории
            </button>
          </div>
          <div class="difficulty-selector">
            <span class="difficulty-label">Уровень сложности:</span>
            <button class="difficulty-btn" data-diff="1" onclick="selectDifficulty(1)">Базовый</button>
            <button class="difficulty-btn" data-diff="2" onclick="selectDifficulty(2)">Средний</button>
            <button class="difficulty-btn" data-diff="3" onclick="selectDifficulty(3)">Сложный</button>
          </div>
          <div id="practice-content">
            <div class="loading">Генерация уравнения...</div>
          </div>
        </div>
        <div id="mascot" class="mascot"></div>
      </div>
    `;

    updateDifficultyButtons();
    generateNewEquation(true);
  } catch (err) {
    app.innerHTML = `<div class="error-msg">Ошибка: ${err.message}</div>`;
  }
}

function updateDifficultyButtons() {
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    const diff = parseInt(btn.dataset.diff, 10);
    btn.classList.toggle('difficulty-btn-active', diff === currentPractice.difficulty);
  });
}

function selectDifficulty(diff) {
  currentPractice.difficulty = diff;
  updateDifficultyButtons();
  const id = currentPractice.eqTypeId;
  router.navigate(`/practice/${id}/${diff}`);
}

function showMascot(phrase, type) {
  const mascot = document.getElementById('mascot');
  if (!mascot) return;
  mascot.className = 'mascot mascot-visible';
  mascot.innerHTML = `
    <div class="mascot-speech ${type || ''}">${phrase}</div>
    <div class="mascot-character">
      <img class="mascot-img" src="data/character.png" alt="Помощник">
    </div>
  `;
  setTimeout(() => {
    const speech = mascot.querySelector('.mascot-speech');
    if (speech) speech.classList.add('mascot-fade-in');
  }, 10);
}

function hideMascot() {
  const mascot = document.getElementById('mascot');
  if (!mascot) return;
  mascot.className = 'mascot';
  mascot.innerHTML = '';
}

async function generateNewEquation(skipMascot) {
  const content = document.getElementById('practice-content');
  if (!content) return;

  currentPractice.solved = false;
  currentPractice.retryCount = 0;
  currentPractice.hintRevealed = false;
  currentPractice.steps = [];
  hideMascot();

  content.innerHTML = '<div class="loading">Генерация уравнения...</div>';

  try {
    const data = await generateEquation(currentPractice.eqType, currentPractice.difficulty);
    currentPractice.equation = data.equation;
    currentPractice.correctAnswer = data.answer;
    currentPractice.steps = data.steps || [];

    const diffLabels = ['', 'Базовый', 'Средний', 'Сложный'];

    content.innerHTML = `
      <div class="practice-equation">
        <div class="equation-display">${data.equation}</div>
      </div>

      <div class="practice-input-area">
        <label for="answer-input">Введите ваш ответ:</label>
        <input type="text" id="answer-input" class="input" placeholder="Например: x = 3" autocomplete="off" />
        <div id="character-area" class="character-area">
          <div class="practice-buttons">
            <button onclick="submitAnswer()" class="btn btn-primary">Проверить</button>
            <button onclick="getHintAction()" class="btn btn-outline">Подсказка</button>
            <button onclick="generateNewEquation()" class="btn btn-outline">Сгенерировать другую</button>
          </div>
        </div>
      </div>

      <div id="practice-result"></div>
      <div id="practice-hint"></div>
      <div id="practice-steps"></div>
    `;

    const input = document.getElementById('answer-input');
    if (input) input.focus();

    if (!skipMascot) {
      showMascot(getRandomPhrase('newEquation'), 'info');
    }
  } catch (err) {
    const isRateLimit = err.message.includes('429');
    content.innerHTML = `
      <div class="error-msg">${isRateLimit ? 'Сервер временно перегружен. Пожалуйста, подожди и попробуй снова.' : 'Ошибка генерации: ' + err.message}</div>
      <button onclick="generateNewEquation()" class="btn btn-primary" style="margin-top:12px">Попробовать снова</button>
    `;
  }
}

function renderSteps(steps) {
  if (!steps || !steps.length) return '';
  return `
    <div class="steps-list">
      <strong>Пошаговое решение:</strong>
      ${steps.map((step, i) => `<div class="step-item">${i + 1}. ${sanitizeHint(step)}</div>`).join('')}
    </div>
  `;
}

async function submitAnswer() {
  const input = document.getElementById('answer-input');
  const resultDiv = document.getElementById('practice-result');
  const userAnswer = input ? input.value.trim() : '';

  if (!userAnswer) {
    resultDiv.innerHTML = '<div class="msg-warning">Введите ответ</div>';
    return;
  }

  if (currentPractice.solved) {
    resultDiv.innerHTML = '<div class="msg msg-info">Вы уже решили это уравнение! Сгенерируйте новое.</div>';
    return;
  }

  resultDiv.innerHTML = '<div class="loading">Проверка...</div>';

  try {
    const data = await checkAnswer(currentPractice.equation, userAnswer, currentPractice.correctAnswer, currentPractice.steps);

    const isCorrect = data.correct;

    if (isCorrect) {
      currentPractice.solved = true;
      const isFirstAttempt = currentPractice.retryCount === 0;
      const phrase = isFirstAttempt
        ? getRandomPhrase('correct')
        : getRandomPhrase('correctAfterRetry');

      let html = `
        <div class="msg msg-success">
          <strong>${isFirstAttempt ? 'Верно!' : 'Верно! Со второй попытки!'}</strong>
          <p>${data.explanation || ''}</p>
        </div>
      `;

      if (data.steps) {
        html += renderSteps(data.steps);
      }

      resultDiv.innerHTML = html;
      showMascot(phrase, 'success');
      await saveProgress(currentPractice.eqTypeId, true, isFirstAttempt);
    } else {
      currentPractice.retryCount++;

      const showFirstStep = currentPractice.retryCount >= 1 && currentPractice.steps.length > 0;

      let html = `
        <div class="msg msg-error">
          <strong>Неверно</strong>
          <p>${data.explanation || ''}</p>
          ${currentPractice.retryCount >= 2 ? `<p class="correct-answer">Правильный ответ: ${currentPractice.correctAnswer}</p>` : ''}
          ${currentPractice.retryCount < 2 ? '<p class="text-muted" style="margin-top:8px">Попробуй ещё раз</p>' : ''}
        </div>
      `;

      if (showFirstStep) {
        html += `
          <div class="msg msg-hint">
            <strong>Подсказка — первый шаг:</strong>
            <p>${sanitizeHint(currentPractice.steps[0])}</p>
          </div>
        `;
        currentPractice.hintRevealed = true;
      }

      resultDiv.innerHTML = html;
      showMascot(getRandomPhrase('wrong'), 'error');
    }
  } catch (err) {
    const isRateLimit = err.message.includes('429');
    resultDiv.innerHTML = `<div class="msg msg-error">${isRateLimit ? 'Сервер временно перегружен. Пожалуйста, подожди и попробуй снова.' : 'Ошибка проверки: ' + err.message}</div>`;
  }
}

async function getHintAction() {
  const hintDiv = document.getElementById('practice-hint');
  const stepsDiv = document.getElementById('practice-steps');

  if (currentPractice.solved) {
    showMascot('Уравнение уже решено! Сгенерируй новое.', 'info');
    return;
  }

  if (currentPractice.hintRevealed) {
    hintDiv.innerHTML = '<div class="msg msg-info">Подсказка уже показана. Попробуйте решить самостоятельно или запросите новую задачу.</div>';
    showMascot(getRandomPhrase('hintRevealed'), 'info');
    return;
  }

  hintDiv.innerHTML = '<div class="loading">Генерация подсказки...</div>';

  try {
    const hint = await getHint(currentPractice.steps);
    currentPractice.hintRevealed = true;
    const cleanHint = sanitizeHint(hint);
    hintDiv.innerHTML = `
      <div class="msg msg-info">
        <strong>Подсказка — первый шаг</strong>
        <p>${cleanHint}</p>
      </div>
    `;
  } catch (err) {
    const isRateLimit = err.message.includes('429');
    hintDiv.innerHTML = `<div class="msg msg-error">${isRateLimit ? 'Сервер временно перегружен. Пожалуйста, подожди и попробуй снова.' : 'Ошибка: ' + err.message}</div>`;
  }
}
