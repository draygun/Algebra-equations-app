// app.js — главный файл, инициализация роутера

document.addEventListener('DOMContentLoaded', () => {
  // Регистрируем маршруты
  router.add('/home', renderHomePage);
  router.add('/auth', renderAuthPage);
  router.add('/theory/:id', renderTheoryPage);
  router.add('/practice/:id', renderPracticePage);
  router.add('/practice/:id/:difficulty', renderPracticePage);
  router.add('/wordle', renderWordlePage);
  router.add('/wordle/daily', renderWordlePage);
  router.add('/profile', renderProfilePage);

  // Показываем навигацию и разрешаем текущий URL
  document.body.classList.remove('loading');
  router.resolve();
});
