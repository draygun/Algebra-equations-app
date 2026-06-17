// pages/home.js — главная страница с выбором типа уравнения

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

    app.innerHTML = html;
  } catch (err) {
    app.innerHTML = `<div class="error-msg">Ошибка загрузки данных: ${err.message}</div>`;
  }
}
