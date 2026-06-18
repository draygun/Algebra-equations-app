// pages/profile.js — страница профиля и прогресса

async function renderProfilePage(app, params, hash) {
  app.className = 'page page-profile';

  if (!window.currentUser) {
    app.innerHTML = `
      <div class="profile-empty">
        <h2>Пожалуйста, войдите в систему</h2>
        <p>Чтобы отслеживать прогресс, необходимо авторизоваться.</p>
        <button onclick="router.navigate('/auth')" class="btn btn-primary">Войти</button>
      </div>
    `;
    return;
  }

  app.innerHTML = '<div class="loading">Загрузка прогресса...</div>';

  try {
    const progress = await getAllProgress();
    const equations = EQUATIONS_DATA;

    const getEqName = (id) => {
      const eq = equations.find(e => e.id === id);
      return eq ? eq.name : id;
    };

    let html = `
      <div class="profile-header">
        <div class="profile-avatar">${window.currentUser.email[0].toUpperCase()}</div>
        <h2>${window.currentUser.email}</h2>
      </div>
    `;

    if (progress.length === 0) {
      html += `
        <div class="profile-empty">
          <p>У вас пока нет решённых задач.</p>
          <button onclick="router.navigate('/home')" class="btn btn-primary">Начать практику</button>
        </div>
      `;
    } else {
      const totalAttempts = progress.reduce((s, p) => s + p.attempts, 0);
      const totalCorrect = progress.reduce((s, p) => s + p.correct, 0);
      const totalFirstAttempt = progress.reduce((s, p) => s + (p.solvedOnFirstAttempt || 0), 0);
      const percent = totalAttempts > 0 ? Math.round(totalCorrect / totalAttempts * 100) : 0;

      html += `
        <div class="stats-summary">
          <div class="stat-card">
            <div class="stat-value">${totalAttempts}</div>
            <div class="stat-label">Всего попыток</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalCorrect}</div>
            <div class="stat-label">Решено задач</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${percent}%</div>
            <div class="stat-label">Успешность</div>
          </div>
        </div>
        <div class="stats-summary" style="grid-template-columns: 1fr 1fr; margin-top: -16px;">
          <div class="stat-card">
            <div class="stat-value">${totalFirstAttempt}</div>
            <div class="stat-label">С первой попытки</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalCorrect - totalFirstAttempt}</div>
            <div class="stat-label">Со второй попытки</div>
          </div>
        </div>
        <h3>Прогресс по типам уравнений</h3>
        <div class="progress-list">
      `;

      progress.forEach(p => {
        const pct = p.attempts > 0 ? Math.round(p.correct / p.attempts * 100) : 0;
        html += `
          <div class="progress-item" onclick="router.navigate('/practice/${p.eqTypeId}')">
            <div class="progress-info">
              <span class="progress-name">${getEqName(p.eqTypeId)}</span>
              <span class="progress-stats">${p.correct}/${p.attempts}</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      });

      html += '</div>';
    }

    app.innerHTML = html;
  } catch (err) {
    app.innerHTML = `<div class="error-msg">Ошибка: ${err.message}</div>`;
  }
}
