import { db, $, el, startOfDay, addDays, dueBadge, requireOwner, showError } from './admin.js';
import { prettyDate, ymd } from './common.js';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

requireOwner(async () => { $('#dueDate').value = ymd(new Date()); await refresh(); });

async function refresh() {
  const snap = await getDocs(query(collection(db, 'reminders'), orderBy('dueAt')));
  const end = addDays(startOfDay(), 1);
  const list = $('#list');
  list.replaceChildren();
  const open = snap.docs.filter(d => !d.data().done);
  if (!open.length) list.append(el('p', { class: 'muted' }, 'No open reminders.'));
  for (const d of open) {
    const r = d.data();
    const due = r.dueAt.toDate();
    list.append(el('article', { class: 'card stack' },
      el('p', {}, r.text),
      el('p', { class: 'muted' }, due < end ? 'Due today or earlier · ' + prettyDate(due) : 'Due ' + prettyDate(due)),
      el('div', { class: 'row' },
        el('button', { class: 'btn btn-call', type: 'button', onclick: () => act(() => updateDoc(doc(db, 'reminders', d.id), { done: true })) }, 'Done'),
        el('button', { class: 'btn btn-danger', type: 'button', onclick: () => act(() => deleteDoc(doc(db, 'reminders', d.id))) }, 'Delete'))));
  }
  await dueBadge();
}

async function act(fn) {
  try { await fn(); await refresh(); } catch (e) { showError(e); }
}

$('#addForm').addEventListener('submit', e => {
  e.preventDefault();
  const text = $('#text').value.trim().slice(0, 200);
  const day = $('#dueDate').value;
  if (!text || !day) return;
  act(async () => {
    await addDoc(collection(db, 'reminders'), {
      text, dueAt: Timestamp.fromDate(new Date(day + 'T00:00:00')), done: false,
    });
    $('#text').value = '';
  });
});
