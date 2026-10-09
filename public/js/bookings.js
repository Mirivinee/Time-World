import { db, $, el, startOfDay, addDays, digits, dueBadge, syncVisitReminders, requireOwner, showError } from './admin.js';
import { SLOTS } from './config.js';
import { prettyDate, ymd } from './common.js';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, setDoc, writeBatch, Timestamp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const STATUSES = ['Booked', 'Received', 'Repairing', 'Ready', 'Delivered', 'Cancelled'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let range = 'today';
let settings = { workDays: [1, 2, 3, 4, 5, 6], blocked: [], maxHomeVisits: 3 };

requireOwner(async () => {
  await Promise.all([dueBadge(), loadSettings()]);
  await load();
  syncVisitReminders().then(dueBadge).catch(() => {});
}, { loginPage: true });

document.querySelectorAll('[data-range]').forEach(b => b.addEventListener('click', () => {
  range = b.dataset.range;
  document.querySelectorAll('[data-range]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  load().catch(showError);
}));

async function load() {
  const start = startOfDay();
  const parts = [where('date', '>=', Timestamp.fromDate(start))];
  if (range === 'today') parts.push(where('date', '<', Timestamp.fromDate(addDays(start, 1))));
  if (range === 'week') parts.push(where('date', '<', Timestamp.fromDate(addDays(start, 7))));
  const snap = await getDocs(query(collection(db, 'bookings'), ...parts, orderBy('date'), limit(100)));

  const bigPerDay = {};
  snap.docs.forEach(d => { const b = d.data(); if (b.clockType === 'big' && b.status !== 'Cancelled') bigPerDay[b.dateStr] = (bigPerDay[b.dateStr] || 0) + 1; });

  const list = $('#list');
  list.replaceChildren();
  if (snap.empty) list.append(el('p', { class: 'muted' }, 'No bookings for this period.'));
  snap.docs.forEach(d => list.append(card(d.id, d.data(), bigPerDay[d.data().dateStr] > settings.maxHomeVisits)));
}

function card(id, b, overLimit) {
  const phone = digits(b.phone);
  const when = el('p', {}, `${prettyDate(b.date.toDate())} · ${b.slot}`);
  const status = el('select', { 'aria-label': 'Status' }, ...STATUSES.map(s => {
    const o = el('option', { value: s }, s); o.selected = s === b.status; return o;
  }));
  status.addEventListener('change', () => save(id, b, { status: status.value }));

  const newDate = el('input', { type: 'date', 'aria-label': 'New date', min: ymd(new Date()) });
  const newSlot = el('select', { 'aria-label': 'New time' }, ...SLOTS.map(s => el('option', { value: s }, s)));
  const resched = el('div', { class: 'stack', hidden: '' }, newDate, newSlot,
    el('button', { class: 'btn btn-primary', type: 'button', onclick: () => {
      if (!newDate.value) return;
      save(id, b, { date: Timestamp.fromMillis(Date.parse(newDate.value + 'T06:30:00Z')), dateStr: newDate.value, slot: newSlot.value });
    } }, 'Save new time'));

  const cancel = el('button', { class: 'btn btn-danger', type: 'button' }, 'Cancel booking');
  cancel.addEventListener('click', () => {
    if (cancel.dataset.sure) return save(id, b, { status: 'Cancelled' });
    cancel.dataset.sure = '1'; cancel.textContent = 'Tap again to cancel';
  });

  return el('article', { class: 'card booking stack' },
    el('h3', {}, el('span', {}, b.name), el('span', { class: 'tag' }, b.clockType === 'big' ? 'Home visit' : 'Drop-off')),
    when,
    overLimit ? el('p', { class: 'tag tag-warn' }, 'More home visits than your daily limit') : '',
    b.address ? el('p', { class: 'muted' }, b.address) : '',
    el('p', { class: 'muted' }, `ID ${id}`),
    el('div', { class: 'row' },
      el('a', { class: 'btn btn-call', href: 'tel:' + phone }, 'Call ' + phone),
      el('a', { class: 'btn btn-wa', href: 'https://wa.me/91' + phone, rel: 'noopener' }, 'WhatsApp')),
    el('label', {}, 'Status', status),
    el('div', { class: 'row' },
      el('button', { class: 'btn', type: 'button', onclick: () => { resched.hidden = !resched.hidden; } }, 'Reschedule'),
      cancel),
    resched);
}

async function save(id, b, fields) {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'bookings', id), fields);
    const track = {};
    for (const k of ['status', 'dateStr', 'slot']) if (k in fields) track[k] = fields[k];
    batch.update(doc(db, 'tracking', `${id}_${b.phone}`), track);
    await batch.commit();
    await load();
  } catch (e) { showError(e); }
}

// ---- days off / availability ----
async function loadSettings() {
  const s = await getDoc(doc(db, 'settings', 'availability'));
  if (s.exists()) settings = { ...settings, ...s.data() };
  $('#maxVisits').value = settings.maxHomeVisits;
  const days = $('#workDays');
  days.replaceChildren(...DAY_NAMES.map((n, i) => {
    const cb = el('input', { type: 'checkbox', value: String(i) });
    cb.checked = settings.workDays.includes(i);
    return el('label', {}, cb, n);
  }));
  renderBlocked();
}

function renderBlocked() {
  const ul = $('#blockedList');
  ul.replaceChildren(...[...settings.blocked].sort().map(d => el('li', {}, d,
    el('button', { class: 'btn btn-small', type: 'button', 'aria-label': 'Remove ' + d, onclick: () => { settings.blocked = settings.blocked.filter(x => x !== d); renderBlocked(); } }, '✕'))));
}

$('#addBlocked').addEventListener('click', () => {
  const v = $('#blockDate').value;
  if (v && !settings.blocked.includes(v)) { settings.blocked.push(v); renderBlocked(); }
});

$('#saveSettings').addEventListener('click', async () => {
  try {
    settings.workDays = [...document.querySelectorAll('#workDays input:checked')].map(c => Number(c.value));
    settings.maxHomeVisits = Math.max(1, Math.min(20, Number($('#maxVisits').value) || 3));
    await setDoc(doc(db, 'settings', 'availability'), {
      workDays: settings.workDays, blocked: settings.blocked, maxHomeVisits: settings.maxHomeVisits,
    });
    $('#saved').hidden = false;
    setTimeout(() => { $('#saved').hidden = true; }, 3000);
    await load();
  } catch (e) { showError(e); }
});
