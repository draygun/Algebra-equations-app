// pages/profile.js — страница профиля и прогресса

function donutGradient(value, total, colorA, colorB) {
  const pct = total > 0 ? value / total : 0;
  const angle = pct * 360;
  if (pct <= 0) return `${colorB} 360deg`;
  if (pct >= 1) return `${colorA} 360deg`;
  return `${colorA} 0deg ${angle}deg, ${colorB} ${angle}deg 360deg`;
}

function statsDonut(value, total, label, colorA, colorB, innerLabel) {
  const pct = total > 0 ? Math.round(value / total * 100) : 0;
  return `
    <div class="stats-donut-card">
      <div class="stats-donut" style="background: conic-gradient(${donutGradient(value, total, colorA, colorB)})">
        <div class="stats-donut-hole">
          <span class="stats-donut-value">${innerLabel || pct + '%'}</span>
        </div>
      </div>
      <div class="stats-donut-label">${label}</div>
    </div>
  `;
}

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
    const [progress, wordleStats] = await Promise.all([getAllProgress(), getWordleStats()]);
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

    // ─── Equation Stats ─────────────────────────────────
    if (progress.length > 0) {
      const totalAttempts = progress.reduce((s, p) => s + p.attempts, 0);
      const totalCorrect = progress.reduce((s, p) => s + p.correct, 0);
      const totalWrong = totalAttempts - totalCorrect;
      const totalFirstAttempt = progress.reduce((s, p) => s + (p.solvedOnFirstAttempt || 0), 0);
      const percent = totalAttempts > 0 ? Math.round(totalCorrect / totalAttempts * 100) : 0;

      html += `
        <div class="profile-section">
          <div class="profile-section-header">
            <span class="profile-section-icon">📐</span>
            <h3>Решение уравнений</h3>
          </div>
          <div class="stats-grid">
            ${statsDonut(totalCorrect, totalAttempts, 'Решено задач', '#6aaa64', '#e17055', percent + '%')}
            <div class="stats-mini-grid">
              <div class="stat-card-mini">
                <span class="stat-card-mini-value">${totalAttempts}</span>
                <span class="stat-card-mini-label">Всего попыток</span>
              </div>
              <div class="stat-card-mini">
                <span class="stat-card-mini-value">${totalCorrect}</span>
                <span class="stat-card-mini-label">Решено верно</span>
              </div>
              <div class="stat-card-mini">
                <span class="stat-card-mini-value">${totalWrong}</span>
                <span class="stat-card-mini-label">Ошибок</span>
              </div>
              <div class="stat-card-mini">
                <span class="stat-card-mini-value">${totalFirstAttempt}</span>
                <span class="stat-card-mini-label">С 1-й попытки</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ─── Wordle Stats ───────────────────────────────────
    html += `
      <div class="profile-section">
        <div class="profile-section-header">
          <span class="profile-section-icon">🎯</span>
          <h3>Wordle — угадай слово</h3>
        </div>
    `;

    if (wordleStats && wordleStats.gamesPlayed > 0) {
      const played = wordleStats.gamesPlayed || 0;
      const wins = wordleStats.wins || 0;
      const losses = played - wins;
      const winRate = played > 0 ? Math.round(wins / played * 100) : 0;
      const streak = wordleStats.currentStreak || 0;
      const maxStreak = wordleStats.maxStreak || 0;

      html += `
        <div class="stats-grid">
          ${statsDonut(wins, played, 'Побед', '#6aaa64', '#787c7e', winRate + '%')}
          <div class="stats-mini-grid">
            <div class="stat-card-mini">
              <span class="stat-card-mini-value">${played}</span>
              <span class="stat-card-mini-label">Всего игр</span>
            </div>
            <div class="stat-card-mini">
              <span class="stat-card-mini-value">${wins}</span>
              <span class="stat-card-mini-label">Побед</span>
            </div>
            <div class="stat-card-mini">
              <span class="stat-card-mini-value">${losses}</span>
              <span class="stat-card-mini-label">Поражений</span>
            </div>
            <div class="stat-card-mini">
              <span class="stat-card-mini-value">${winRate}%</span>
              <span class="stat-card-mini-label">Процент побед</span>
            </div>
          </div>
        </div>
        <div class="streak-grid">
          <div class="streak-card streak-card-current">
            <div class="streak-fire">🔥</div>
            <div class="streak-value">${streak}</div>
            <div class="streak-label">Текущая серия</div>
          </div>
          <div class="streak-card streak-card-max">
            <div class="streak-fire">🏆</div>
            <div class="streak-value">${maxStreak}</div>
            <div class="streak-label">Лучшая серия</div>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="profile-empty" style="padding:20px">
          <p>Вы ещё не играли в Wordle.</p>
          <button onclick="router.navigate('/wordle')" class="btn btn-primary btn-sm">Играть</button>
        </div>
      `;
    }

    html += '</div>';

    // ─── Progress by equation type ──────────────────────
    if (progress.length > 0) {
      html += `
        <div class="profile-section">
          <div class="profile-section-header">
            <span class="profile-section-icon">📊</span>
            <h3>Прогресс по типам уравнений</h3>
          </div>
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

      html += '</div></div>';
    }

    app.innerHTML = html;
  } catch (err) {
    app.innerHTML = `<div class="error-msg">Ошибка: ${err.message}</div>`;
  }
}
