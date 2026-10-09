import { SHOP } from './config.js';
import { db } from './firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const set = (sel, fn) => document.querySelectorAll(sel).forEach(fn);

set('[data-call]', a => { a.href = 'tel:' + SHOP.phone; });
set('[data-wa]', a => {
  a.href = 'https://wa.me/' + SHOP.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent('Hello, I need help with a clock.');
});
set('[data-map]', a => { a.href = SHOP.mapsUrl; });
set('[data-shop-name]', e => { e.textContent = SHOP.name; });
set('[data-shop-address]', e => { e.textContent = SHOP.address; });
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function hoursText(days) {
  const t = SHOP.openTime + ' – ' + SHOP.closeTime;
  const open = [...new Set(days)].filter(d => d >= 0 && d <= 6).sort();
  if (open.length === 7) return 'Open every day, ' + t + '.';
  if (open.length === 6 && !open.includes(0)) return 'Mon–Sat, ' + t + '. Sunday closed.';
  if (open.length === 0) return SHOP.hours;
  return open.map(d => DAY[d]).join(', ') + ', ' + t + '.';
}
set('[data-shop-hours]', e => { e.textContent = SHOP.hours; });
// Owner can change working days (e.g. open on Sundays) in the dashboard; show that here.
if (document.querySelector('[data-shop-hours]')) {
  getDoc(doc(db, 'settings', 'availability')).then(s => {
    const days = s.exists() && s.data().workDays;
    if (Array.isArray(days)) set('[data-shop-hours]', e => { e.textContent = hoursText(days); });
  }).catch(() => {});
}
set('[data-shop-phone]', e => { e.textContent = SHOP.phone; });

export function show(el, msg) {
  el.textContent = msg;
  el.hidden = false;
}

export const ymd = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const prettyDate = d => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
