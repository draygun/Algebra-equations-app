// pages/theory.js — страница теории

function renderTheoryPage(app, params, hash) {
  app.className = 'page page-theory';
  const eqId = params.id;

  try {
    const equations = EQUATIONS_DATA;
    const theory = THEORY_DATA[eqId];
    const eqMeta = equations.find(e => e.id === eqId);

    if (!theory || !theory.title) {
      app.innerHTML = '<div class="error-msg">Теория для этого типа уравнений пока не добавлена</div>';
      return;
    }

    let html = `<div class="theory-header">
      <h1>${theory.title}</h1>
      ${eqMeta ? `<span class="class-badge">${eqMeta.class} класс</span>` : ''}
    </div>`;

    theory.sections.forEach(section => {
      const lines = section.content.split('\n').filter(l => l.trim());

      let body = '';
      let inList = false;

      lines.forEach(line => {
        if (line.startsWith('•')) {
          if (!inList) { body += '<ul>'; inList = true; }
          body += `<li>${line.slice(1).trim()}</li>`;
        } else {
          if (inList) { body += '</ul>'; inList = false; }
          body += `<p>${line}</p>`;
        }
      });
      if (inList) body += '</ul>';

      html += `<div class="theory-section">
        <h2>${section.heading}</h2>
        ${body}
      </div>`;
    });

    html += `<div class="theory-actions">
      <button onclick="router.navigate('/practice/${eqId}')" class="btn btn-primary btn-lg">
        Перейти к практике
      </button>
      <button onclick="router.navigate('/home')" class="btn btn-outline">
        ← К списку уравнений
      </button>
    </div>`;

    const mascotPhrases = [
      'Изучи теорию, а потом пробуй решать на практике! 📚',
      'Понимание теории — ключ к успеху! 🔑',
      'Разобрался? Теперь попробуй решить уравнение! 💪',
      'Запомни алгоритм — он пригодится на практике! ⭐',
    ];

    html += `
      <div class="home-mascot">
        <div class="mascot-speech info">${mascotPhrases[Math.floor(Math.random() * mascotPhrases.length)]}</div>
        <div class="mascot-character">
          <img class="mascot-svg" src="data/character.svg" alt="Помощник">
        </div>
      </div>
    `;

    app.innerHTML = html;
  } catch (err) {
    app.innerHTML = `<div class="error-msg">Ошибка загрузки теории: ${err.message}</div>`;
  }
}
