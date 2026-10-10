import { SHOP } from './config.js';
import { getWorkDays } from './common.js';

document.documentElement.classList.add('js');

// "Open now" badge (shop clock = browser clock; fine for a local shop)
const toMin = t => {
  const m = /(\d+)(?::(\d+))?\s*(am|pm)/i.exec(t);
  return (Number(m[1]) % 12 + (m[3].toLowerCase() === 'pm' ? 12 : 0)) * 60 + Number(m[2] || 0);
};
getWorkDays().then(days => {
  const open = toMin(SHOP.openTime), close = toMin(SHOP.closeTime);
  const now = new Date(), mins = now.getHours() * 60 + now.getMinutes();
  const el = document.getElementById('openStatus');
  const isOpen = days.includes(now.getDay()) && mins >= open && mins < close;
  el.classList.add(isOpen ? 'open' : 'closed');
  el.textContent = isOpen ? 'Open now · until ' + SHOP.closeTime : 'Closed now · opens ' + SHOP.openTime + ' on working days';
});

// "What would you like repaired?" picker
const ANSWERS = {
  grandfather: ['Grandfather clock: we come to you', 'Book a home visit. Please give your address when you book.', 'Book a home visit', '/book?type=big'],
  wall: ['Wall clock: we come to you', 'Book a home visit. Please give your address when you book.', 'Book a home visit', '/book?type=big'],
  mantel: ['Table or mantel clock: bring it to the shop', 'Book a drop-off time and bring your clock to our shop.', 'Book a drop-off', '/book?type=small'],
  watch: ['Watches: please visit the store', 'We look at every watch in person. See our hours and map.', 'See store hours and map', '/watches'],
};
const answer = document.getElementById('answer');
document.getElementById('picker').addEventListener('click', e => {
  const btn = e.target.closest('.pick');
  if (!btn) return;
  document.querySelectorAll('.pick').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  const [title, text, label, href] = ANSWERS[btn.dataset.kind];
  document.getElementById('answerTitle').textContent = title;
  document.getElementById('answerText').textContent = text;
  const a = document.getElementById('answerBtn');
  a.textContent = label; a.href = href;
  answer.hidden = false;
  answer.style.animation = 'none'; void answer.offsetWidth; answer.style.animation = '';
});

// Gentle reveal on scroll
const io = 'IntersectionObserver' in window && new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));
