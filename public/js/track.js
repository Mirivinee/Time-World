import { show, prettyDate } from './common.js';
import { db } from './firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const $ = id => document.getElementById(id);
const STEPS = ['Booked', 'Received', 'Repairing', 'Ready', 'Delivered'];
const err = $('trackError');

const pre = new URLSearchParams(location.search).get('id');
if (pre && /^[A-Za-z0-9]{1,8}$/.test(pre)) $('bid').value = pre.toUpperCase();

$('trackForm').addEventListener('submit', async e => {
  e.preventDefault();
  err.hidden = true;
  $('result').hidden = true;
  const bid = $('bid').value.trim().toUpperCase();
  $('bid').value = bid;
  const phone = $('phone').value.replace(/\s/g, '');
  if (!/^[A-Z2-9]{8}$/.test(bid)) return show(err, 'Booking ID should be 8 letters/numbers.', $('bid'));
  if (!/^[0-9]{10}$/.test(phone)) return show(err, 'Please enter a 10-digit mobile number.', $('phone'));

  let snap;
  try {
    snap = await getDoc(doc(db, 'tracking', `${bid}_${phone}`));
  } catch {
    return show(err, 'Sorry, something went wrong. Please try again, or call us.');
  }
  if (!snap.exists()) return show(err, 'We could not find a booking with these details. Please check and try again.');

  const d = snap.data();
  $('resultTitle').textContent = d.status === 'Cancelled' ? 'This booking was cancelled' : 'Status: ' + d.status;
  $('resultWhen').textContent = `${d.clockType === 'big' ? 'Home visit' : 'Shop drop-off'} · ${prettyDate(new Date(d.dateStr + 'T12:00:00'))} · ${d.slot}`;
  const list = $('steps');
  list.replaceChildren();
  if (d.status !== 'Cancelled') {
    const at = STEPS.indexOf(d.status);
    STEPS.forEach((s, i) => {
      const li = document.createElement('li');
      li.textContent = s;
      if (i < at) li.className = 'done';
      if (i === at) li.className = 'current';
      list.append(li);
    });
  }
  $('result').hidden = false;
  $('resultTitle').focus();
});
