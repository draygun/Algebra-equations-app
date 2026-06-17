// pages/practice.js — страница практики с ИИ

let currentPractice = {
  equation: '',
  correctAnswer: '',
  hintRevealed: false,
  eqTypeId: '',
};

function renderPracticePage(app, params, hash) {
  app.className = 'page page-practice';
  currentPractice.eqTypeId = params.id;
  currentPractice.hintRevealed = false;

  try {
    const equations = EQUATIONS_DATA;
    currentPractice.eqType = equations.find(e => e.id === params.id);

    app.innerHTML = `
      <div class="practice-container">
        <div class="practice-header">
          <h1>Практика: ${currentPractice.eqType ? currentPractice.eqType.name : ''}</h1>
          <button onclick="router.navigate('/theory/${params.id}')" class="btn btn-outline btn-sm">
            ← К теории
          </button>
        </div>
        <div id="practice-content">
          <div class="loading">Генерация уравнения...</div>
        </div>
      </div>
    `;

    generateNewEquation();
  } catch (err) {
    app.innerHTML = `<div class="error-msg">Ошибка: ${err.message}</div>`;
  }
}

async function generateNewEquation() {
  const content = document.getElementById('practice-content');
  if (!content) return;

  content.innerHTML = '<div class="loading">Генерация уравнения...</div>';

  try {
    const data = await generateEquation(currentPractice.eqType);
    currentPractice.equation = data.equation;
    currentPractice.correctAnswer = data.answer;
    currentPractice.hintRevealed = false;

    content.innerHTML = `
      <div class="practice-equation">
        <div class="equation-display">${data.equation}</div>
        <div class="difficulty-badge ${data.difficulty}">${data.difficulty}</div>
      </div>

      <div class="practice-input-area">
        <label for="answer-input">Введите ваш ответ:</label>
        <input type="text" id="answer-input" class="input" placeholder="Например: x = 3" autocomplete="off" />
        <div class="practice-buttons">
          <button onclick="submitAnswer()" class="btn btn-primary">Проверить</button>
          <button onclick="getHintAction()" class="btn btn-outline">Подсказка</button>
          <button onclick="generateNewEquation()" class="btn btn-outline">Сгенерировать другую</button>
        </div>
      </div>

      <div id="practice-result"></div>
      <div id="practice-hint"></div>
    `;

    const input = document.getElementById('answer-input');
    if (input) input.focus();
  } catch (err) {
    content.innerHTML = `
      <div class="error-msg">Ошибка генерации: ${err.message}</div>
      <button onclick="generateNewEquation()" class="btn btn-primary" style="margin-top:12px">Попробовать снова</button>
    `;
  }
}

async function submitAnswer() {
  const input = document.getElementById('answer-input');
  const resultDiv = document.getElementById('practice-result');
  const userAnswer = input ? input.value.trim() : '';

  if (!userAnswer) {
    resultDiv.innerHTML = '<div class="msg-warning">Введите ответ</div>';
    return;
  }

  resultDiv.innerHTML = '<div class="loading">Проверка...</div>';

  try {
    const data = await checkAnswer(currentPractice.equation, userAnswer, currentPractice.correctAnswer);

    const isCorrect = data.correct;
    resultDiv.innerHTML = `
      <div class="msg ${isCorrect ? 'msg-success' : 'msg-error'}">
        <strong>${isCorrect ? 'Верно!' : 'Неверно'}</strong>
        <p>${data.explanation || ''}</p>
        ${!isCorrect ? `<p class="correct-answer">Правильный ответ: ${currentPractice.correctAnswer}</p>` : ''}
      </div>
    `;

    await saveProgress(currentPractice.eqTypeId, isCorrect);
  } catch (err) {
    resultDiv.innerHTML = `<div class="msg msg-error">Ошибка проверки: ${err.message}</div>`;
  }
}

async function getHintAction() {
  const hintDiv = document.getElementById('practice-hint');
  const equation = currentPractice.equation;

  if (currentPractice.hintRevealed) {
    hintDiv.innerHTML = '<div class="msg msg-info">Подсказка уже показана. Попробуйте решить самостоятельно или запросите новую задачу.</div>';
    return;
  }

  hintDiv.innerHTML = '<div class="loading">Генерация подсказки...</div>';

  try {
    const hint = await getHint(equation);
    currentPractice.hintRevealed = true;
    hintDiv.innerHTML = `
      <div class="msg msg-info">
        <strong>Подсказка</strong>
        <p>${hint}</p>
      </div>
    `;
  } catch (err) {
    hintDiv.innerHTML = `<div class="msg msg-error">Ошибка: ${err.message}</div>`;
  }
}
