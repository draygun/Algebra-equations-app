// pages/auth.js — страница авторизации

function renderAuthPage(app, params, hash) {
  app.className = 'page page-auth';

  // Если Firebase не настроен
  if (!firebaseAuth) {
    app.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <h2>Авторизация недоступна</h2>
          <p class="text-muted">Для использования этой функции настройте Firebase в файле config.js.</p>
          <button onclick="router.navigate('/home')" class="btn btn-primary">На главную</button>
        </div>
      </div>
    `;
    return;
  }

  // Если пользователь уже вошёл
  if (window.currentUser) {
    app.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-avatar">${window.currentUser.email[0].toUpperCase()}</div>
          <h2>${window.currentUser.email}</h2>
          <p class="text-muted">Вы вошли в систему</p>
          <button onclick="logoutUser()" class="btn btn-danger">Выйти</button>
        </div>
      </div>
    `;
    return;
  }

  // Форма входа
  authMode = 'login';
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Добро пожаловать!</h2>
        <p class="text-muted">Войдите, чтобы отслеживать прогресс</p>
        <form id="auth-form" onsubmit="handleAuth(event)">
          <input type="email" id="auth-email" placeholder="Email" required class="input" />
          <input type="password" id="auth-password" placeholder="Пароль" required class="input" />
          <button type="submit" class="btn btn-primary" id="auth-submit-btn">Войти</button>
        </form>
        <p class="text-small">
          <a href="#" onclick="toggleAuthMode(event)">Нет аккаунта? Зарегистрироваться</a>
        </p>
        <button onclick="googleSignIn()" class="btn btn-google">Войти через Google</button>
        <div id="auth-error" class="error-msg"></div>
      </div>
    </div>
  `;
}

let authMode = 'login';

function toggleAuthMode(e) {
  e.preventDefault();
  authMode = authMode === 'login' ? 'register' : 'login';
  const btn = document.getElementById('auth-submit-btn');
  const title = document.querySelector('.auth-card h2');
  const link = e.target;
  if (authMode === 'register') {
    btn.textContent = 'Зарегистрироваться';
    title.textContent = 'Регистрация';
    link.textContent = 'Уже есть аккаунт? Войти';
  } else {
    btn.textContent = 'Войти';
    title.textContent = 'Добро пожаловать!';
    link.textContent = 'Нет аккаунта? Зарегистрироваться';
  }
  document.getElementById('auth-error').textContent = '';
}

async function handleAuth(e) {
  e.preventDefault();
  if (!firebaseAuth) return;

  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');
  errorEl.textContent = '';
  const btn = document.getElementById('auth-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Загрузка...';

  try {
    if (authMode === 'login') {
      await firebaseAuth.signInWithEmailAndPassword(email, password);
    } else {
      await firebaseAuth.createUserWithEmailAndPassword(email, password);
    }
    router.navigate('/home');
  } catch (err) {
    errorEl.textContent = getAuthErrorMessage(err.code);
  } finally {
    btn.disabled = false;
    btn.textContent = authMode === 'login' ? 'Войти' : 'Зарегистрироваться';
  }
}

async function googleSignIn() {
  if (!firebaseAuth) return;
  const errorEl = document.getElementById('auth-error');
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebaseAuth.signInWithPopup(provider);
    router.navigate('/home');
  } catch (err) {
    const msg = getAuthErrorMessage(err.code);
    if (errorEl) errorEl.textContent = msg;
    // Если popup заблокирован — пробуем редирект
    if (err.code === 'auth/popup-blocked') {
      try {
        await firebaseAuth.signInWithRedirect(provider);
      } catch (e2) {
        if (errorEl) errorEl.textContent = 'Редирект тоже не сработал. Разрешите всплывающие окна для этого сайта.';
      }
    }
  }
}

async function logoutUser() {
  if (!firebaseAuth) return;
  await firebaseAuth.signOut();
  router.navigate('/home');
}

function getAuthErrorMessage(code) {
  const messages = {
    'auth/user-not-found': 'Пользователь не найден',
    'auth/wrong-password': 'Неверный пароль',
    'auth/email-already-in-use': 'Email уже используется',
    'auth/weak-password': 'Пароль должен быть не менее 6 символов',
    'auth/invalid-email': 'Некорректный email',
    'auth/popup-closed-by-user': 'Вход отменён',
    'auth/popup-blocked': 'Всплывающее окно заблокировано. Разрешите всплывающие окна для этого сайта.',
    'auth/unauthorized-domain': 'Домен не авторизован в Firebase. Добавьте этот домен в консоли Firebase.',
    'auth/operation-not-allowed': 'Вход через Google не включён в консоли Firebase.',
    'auth/network-request-failed': 'Ошибка сети. Проверьте подключение к интернету.',
  };
  return messages[code] || 'Ошибка авторизации. Попробуйте снова.';
}
