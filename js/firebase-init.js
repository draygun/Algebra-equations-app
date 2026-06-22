// firebase-init.js — инициализация Firebase

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded. Auth and progress disabled.');
    return null;
  }
  if (!APP_CONFIG || !APP_CONFIG.firebase || !APP_CONFIG.firebase.apiKey) {
    console.warn('Firebase not configured. Auth and progress disabled.');
    return null;
  }

  try {
    firebase.initializeApp(APP_CONFIG.firebase);
    const auth = firebase.auth();
    const db = firebase.firestore();
    auth.setPersistence('local');
    return { auth, db };
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
    return null;
  }
}

let firebaseAuth = null;
let firestore = null;
let firebaseReady = null;

const fb = initFirebase();
if (fb) {
  firebaseAuth = fb.auth;
  firestore = fb.db;

  firebaseReady = new Promise(resolve => {
    firebaseAuth.onAuthStateChanged(user => {
      window.currentUser = user;
      updateAuthUI(user);
      const hash = window.location.hash.slice(1);
      if (user && hash === '/auth') {
        router.navigate('/home');
      }
      resolve();
    });
  });
} else {
  firebaseReady = Promise.resolve();
}

function updateAuthUI(user) {
  const authLink = document.getElementById('nav-auth');
  const profileLink = document.getElementById('nav-profile');
  if (authLink) {
    authLink.innerHTML = user ? 'Выйти' : 'Войти';
    authLink.href = user ? '#/auth' : '#/auth';
  }
  if (profileLink) {
    profileLink.style.display = user ? '' : 'none';
  }
}
