// Shared admin helpers: auth guard, DOM helper, due-today badge, auto visit reminders.
// Real protection is firestore.rules; this guard is only for a friendly UI.
import { app, db } from './firebase.js';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { collection, query, where, getDocs, getDoc, doc, setDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

export { db };
export const auth = getAuth(app);
export const $ = (s, r = document) => r.querySelector(s);

// Safe element builder: text only, never innerHTML.
export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  n.append(...kids);
  return n;
}

export const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const digits = s => String(s).replace(/\D/g, '');

export function showError(e) {
  const box = $('#error');
  if (!box) return;
  box.textContent = e?.code === 'permission-denied'
    ? 'This Google account is not allowed to use the dashboard.'
    : 'Something went wrong. Please try again.';
  box.hidden = false;
}

// loginPage=true: show login box when signed out. Otherwise redirect to /admin/.
export function requireOwner(onOwner, { loginPage = false } = {}) {
  $('#loginBtn')?.addEventListener('click', () =>
    signInWithPopup(auth, new GoogleAuthProvider()).catch(showError));
  $('#logoutBtn')?.addEventListener('click', () => signOut(auth));
  onAuthStateChanged(auth, async user => {
    if (!user) {
      if (!loginPage) { location.replace('/admin/'); return; }
      $('#login').hidden = false; $('#app').hidden = true;
      return;
    }
    $('#login').hidden = true; $('#app').hidden = false;
    try { await onOwner(user); } catch (e) { showError(e); }
  });
}

export async function dueBadge() {
  const snap = await getDocs(query(collection(db, 'reminders'), where('done', '==', false)));
  const end = addDays(startOfDay(), 1);
  const n = snap.docs.filter(d => d.data().dueAt.toDate() < end).length;
  const b = $('#dueBadge');
  b.textContent = n;
  b.hidden = n === 0;
  b.setAttribute('aria-label', `${n} reminders due today`);
}

// Auto-create a reminder (once) for every home visit in the next 2 days.
export async function syncVisitReminders() {
  const from = startOfDay();
  const snap = await getDocs(query(collection(db, 'bookings'),
    where('date', '>=', Timestamp.fromDate(from)), where('date', '<', Timestamp.fromDate(addDays(from, 3)))));
  for (const d of snap.docs) {
    const b = d.data();
    if (b.clockType !== 'big' || b.status === 'Cancelled' || b.status === 'Delivered') continue;
    const ref = doc(db, 'reminders', 'visit_' + d.id);
    if ((await getDoc(ref)).exists()) continue;
    await setDoc(ref, {
      text: `Home visit ${b.dateStr}, ${b.slot}: ${b.name}, ${b.address}`,
      dueAt: Timestamp.fromDate(addDays(b.date.toDate(), -1)),
      done: false, bookingId: d.id, auto: true,
    });
  }
}
