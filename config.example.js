// config.example.js
// 1. Скопируйте этот файл как config.js
// 2. Заполните свои ключи
// ВАЖНО: config.js добавлен в .gitignore и не попадёт в репозиторий

const APP_CONFIG = {
  openrouter: {
    apiKey: 'sk-or-v1-ВАШ_КЛЮЧ_OPENROUTER',
    model: 'google/gemma-4-31b-it:free',
  },
  firebase: {
    apiKey: 'ВАШ_FIREBASE_API_KEY',
    authDomain: 'ВАШ_PROJECT.firebaseapp.com',
    projectId: 'ВАШ_PROJECT_ID',
    storageBucket: 'ВАШ_PROJECT.appspot.com',
    messagingSenderId: 'ВАШ_SENDER_ID',
    appId: 'ВАШ_APP_ID',
  },
};
