import { SHOP } from './config.js';

const set = (sel, fn) => document.querySelectorAll(sel).forEach(fn);

set('[data-call]', a => { a.href = 'tel:' + SHOP.phone; });
set('[data-wa]', a => {
  a.href = 'https://wa.me/' + SHOP.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent('Hello, I need help with a clock.');
});
set('[data-map]', a => { a.href = SHOP.mapsUrl; });
set('[data-shop-name]', e => { e.textContent = SHOP.name; });
set('[data-shop-address]', e => { e.textContent = SHOP.address; });
set('[data-shop-hours]', e => { e.textContent = SHOP.hours; });
set('[data-shop-phone]', e => { e.textContent = SHOP.phone; });

export function show(el, msg) {
  el.textContent = msg;
  el.hidden = false;
}

export const ymd = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const prettyDate = d => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
