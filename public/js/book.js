import { SLOTS } from './config.js';
import { show, ymd } from './common.js';
import { db } from './firebase.js';
import { doc, getDoc, writeBatch, serverTimestamp, Timestamp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const $ = id => document.getElementById(id);
const COOLDOWN_MS = 60000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars, no 0/1/I/O look-alikes
const form = $('bookForm');
const err = $('formError');
let avail = { workDays: [1, 2, 3, 4, 5, 6], blocked: [] };

for (const s of SLOTS) {
  const o = document.createElement('option');
  o.value = s; o.textContent = s;
  $('slot').append(o);
}

const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
$('date').min = ymd(day(1));
$('date').max = ymd(day(89));

const selected = () => form.querySelector('input[name="clockType"]:checked')?.value;
const syncAddress = () => { $('addressRow').hidden = selected() !== 'big'; };
form.querySelectorAll('input[name="clockType"]').forEach(r => r.addEventListener('change', syncAddress));
const pre = new URLSearchParams(location.search).get('type');
if (pre === 'big' || pre === 'small') { form.querySelector(`input[value="${pre}"]`).checked = true; syncAddress(); }

getDoc(doc(db, 'settings', 'availability')).then(s => {
  if (s.exists()) {
    const d = s.data();
    if (Array.isArray(d.workDays)) avail.workDays = d.workDays;
    if (Array.isArray(d.blocked)) avail.blocked = d.blocked;
  }
}).catch(() => {});

function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, b => ALPHABET[b % 32]).join('');
}

function check(v) {
  if (!v.name) return 'Please enter your name.';
  if (!/^[0-9]{10}$/.test(v.phone)) return 'Please enter a 10-digit mobile number.';
  if (!v.clockType) return 'Please choose big clock or small clock.';
  if (v.clockType === 'big' && (v.address.length < 5 || v.address.length > 200)) return 'Please enter your home address.';
  if (!v.dateStr) return 'Please choose a date.';
  const d = new Date(v.dateStr + 'T12:00:00');
  if (!(d > new Date())) return 'Please choose a date from tomorrow onwards.';
  if (avail.blocked.includes(v.dateStr)) return 'Sorry, we are closed on that day. Please choose another date.';
  if (!avail.workDays.includes(d.getDay())) return 'Sorry, we are closed on that day of the week. Please choose another date.';
  return '';
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  err.hidden = true;
  const v = {
    name: $('name').value.trim(),
    phone: $('phone').value.replace(/\s/g, ''),
    clockType: selected(),
    address: $('address').value.trim(),
    dateStr: $('date').value,
    slot: $('slot').value,
  };
  const problem = check(v);
  if (problem) return show(err, problem);

  const id = newId();
  if ($('website').value) return finish(id, v.phone); // honeypot: pretend success, save nothing

  try {
    if (Date.now() - (Number(localStorage.getItem('lastBooking')) || 0) < COOLDOWN_MS) {
      return show(err, 'Please wait a minute before sending another request.');
    }
  } catch { /* storage blocked: skip cooldown */ }

  $('submitBtn').disabled = true;
  const date = Timestamp.fromDate(new Date(v.dateStr + 'T12:00:00'));
  const booking = {
    name: v.name, phone: v.phone, clockType: v.clockType, date, dateStr: v.dateStr,
    slot: v.slot, status: 'Booked', createdAt: serverTimestamp(),
  };
  if (v.clockType === 'big') booking.address = v.address;

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'bookings', id), booking);
    batch.set(doc(db, 'tracking', `${id}_${v.phone}`), {
      status: 'Booked', dateStr: v.dateStr, slot: v.slot, clockType: v.clockType, createdAt: serverTimestamp(),
    });
    await batch.commit();
    try { localStorage.setItem('lastBooking', String(Date.now())); } catch { /* ignore */ }
    finish(id, v.phone);
  } catch {
    $('submitBtn').disabled = false;
    show(err, 'Sorry, we could not save your request. Please try again, or call us.');
  }
});

function finish(id) {
  form.hidden = true;
  $('bookingId').textContent = id;
  $('trackLink').href = '/track?id=' + encodeURIComponent(id);
  $('done').hidden = false;
  $('done').scrollIntoView();
}
