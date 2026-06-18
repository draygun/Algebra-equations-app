// pages/home.js — главная страница с выбором типа уравнения

const HOME_MASCOT_PHRASES = [
  'Привет! Выбери тип уравнения и начнём! 📚',
  'Готов решать уравнения? Давай начнём! 🚀',
  'Алгебра — это интересно! Выбирай тему! ⭐',
  'Я помогу тебе разобраться с любым уравнением! 💪',
  'Не бойся сложных задач — вместе решим! 🤝',
  'Каждая решённая задача делает тебя умнее! 🧠',
];

function renderHomePage(app, params, hash) {
  app.className = 'page page-home';

  try {
    const equations = EQUATIONS_DATA;

    const byClass = {};
    equations.forEach(eq => {
      if (!byClass[eq.class]) byClass[eq.class] = [];
      byClass[eq.class].push(eq);
    });

    const classNames = {
      7: '7 класс',
      8: '8 класс',
      9: '9 класс',
    };

    let html = '<h1>Выберите тип уравнения</h1>';
    html += '<p class="subtitle">Изучите теорию и потренируйтесь решать уравнения с помощью ИИ</p>';

    for (const cls of [7, 8, 9]) {
      if (!byClass[cls]) continue;
      html += `<h2 class="class-header">${classNames[cls]}</h2>`;
      html += '<div class="eq-grid">';
      byClass[cls].forEach(eq => {
        html += `
          <div class="eq-card" onclick="router.navigate('/theory/${eq.id}')">
            <div class="eq-icon">${eq.icon}</div>
            <div class="eq-name">${eq.name}</div>
            <div class="eq-desc">${eq.description}</div>
            <span class="eq-difficulty ${eq.difficulty}">${eq.difficulty}</span>
          </div>
        `;
      });
      html += '</div>';
    }

    html += `
      <div class="home-mascot">
        <div class="mascot-speech info">${HOME_MASCOT_PHRASES[Math.floor(Math.random() * HOME_MASCOT_PHRASES.length)]}</div>
        <div class="mascot-character">
          <span class="paperclip-body">📎</span>
          <span class="mascot-face">
            <span class="eye left"></span>
            <span class="eye right"></span>
            <span class="smile"></span>
          </span>
        </div>
      </div>
    `;

    app.innerHTML = html;
  } catch (err) {
    app.innerHTML = `<div class="error-msg">Ошибка загрузки данных: ${err.message}</div>`;
  }
}
