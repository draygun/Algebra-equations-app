// services/storage.js — работа с Firestore (сохранение прогресса)

async function saveProgress(eqTypeId, correct) {
  if (!firestore || !window.currentUser) return;

  try {
    const userId = window.currentUser.uid;
    const ref = firestore.collection('users').doc(userId).collection('progress').doc(eqTypeId);
    const doc = await ref.get();

    const data = {
      eqTypeId,
      attempts: 1,
      correct: correct ? 1 : 0,
      lastAttempt: new Date().toISOString(),
    };

    if (doc.exists) {
      const existing = doc.data();
      await ref.update({
        attempts: existing.attempts + 1,
        correct: existing.correct + (correct ? 1 : 0),
        lastAttempt: new Date().toISOString(),
      });
    } else {
      await ref.set(data);
    }
  } catch (e) {
    console.warn('Failed to save progress:', e);
  }
}

async function getProgress(eqTypeId) {
  if (!firestore || !window.currentUser) return null;
  try {
    const userId = window.currentUser.uid;
    const ref = firestore.collection('users').doc(userId).collection('progress').doc(eqTypeId);
    const doc = await ref.get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.warn('Failed to get progress:', e);
    return null;
  }
}

async function getAllProgress() {
  if (!firestore || !window.currentUser) return [];
  try {
    const userId = window.currentUser.uid;
    const snapshot = await firestore.collection('users').doc(userId).collection('progress').get();
    return snapshot.docs.map(d => d.data());
  } catch (e) {
    console.warn('Failed to get all progress:', e);
    return [];
  }
}
