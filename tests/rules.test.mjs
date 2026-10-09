// Run: npm run test:rules  (needs Java 21+ for the Firestore emulator)
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';

const OWNER = 'owner@example.com';
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-clock-shop',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
after(() => env.cleanup());
beforeEach(() => env.clearFirestore());

const pub = () => env.unauthenticatedContext().firestore();
const owner = () => env.authenticatedContext('o1', { email: OWNER, email_verified: true }).firestore();
const stranger = () => env.authenticatedContext('s1', { email: 'x@y.com', email_verified: true }).firestore();
const unverified = () => env.authenticatedContext('o2', { email: OWNER, email_verified: false }).firestore();

const tomorrow = () => new Date(Date.now() + 36 * 3600e3);
const ymd = d => d.toISOString().slice(0, 10);
const booking = (o = {}) => ({
  name: 'Asha', phone: '9876543210', clockType: 'small',
  date: Timestamp.fromDate(tomorrow()), dateStr: ymd(tomorrow()),
  slot: 'Morning (9-12)', status: 'Booked', createdAt: serverTimestamp(), ...o,
});
const trackDoc = (b) => ({ status: 'Booked', dateStr: b.dateStr, slot: b.slot, clockType: b.clockType, createdAt: serverTimestamp() });

async function create(db, id, b) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'bookings', id), b);
  batch.set(doc(db, 'tracking', `${id}_${b.phone}`), trackDoc(b));
  return batch.commit();
}
const seed = (id = 'ABCD2345', b = booking()) =>
  env.withSecurityRulesDisabled(async c => {
    const db = c.firestore();
    await setDoc(doc(db, 'bookings', id), { ...b, createdAt: Timestamp.now() });
    await setDoc(doc(db, 'tracking', `${id}_${b.phone}`), { ...trackDoc(b), createdAt: Timestamp.now() });
  });

// ---- public can create a valid booking ----
test('public creates a valid small-clock booking', () => assertSucceeds(create(pub(), 'ABCD2345', booking())));
test('public creates a valid big-clock booking with address', () =>
  assertSucceeds(create(pub(), 'ABCD2346', booking({ clockType: 'big', address: '12 MG Road, Pune' }))));

// ---- public create must fail when invalid ----
test('big clock without address fails', () => assertFails(create(pub(), 'ABCD2347', booking({ clockType: 'big' }))));
test('small clock with address fails', () => assertFails(create(pub(), 'ABCD2348', booking({ address: 'x'.repeat(10) }))));
test('bad phone fails', () => assertFails(create(pub(), 'ABCD2349', booking({ phone: '12345' }))));
test('name too long fails', () => assertFails(create(pub(), 'ABCD2350', booking({ name: 'a'.repeat(61) }))));
test('address too long fails', () => assertFails(create(pub(), 'ABCD2351', booking({ clockType: 'big', address: 'a'.repeat(201) }))));
test('past date fails', () => assertFails(create(pub(), 'ABCD2352', booking({ date: Timestamp.fromDate(new Date(Date.now() - 864e5)) }))));
test('status other than Booked fails', () => assertFails(create(pub(), 'ABCD2353', booking({ status: 'Delivered' }))));
test('extra field (notes) fails', () => assertFails(create(pub(), 'ABCD2354', booking({ notes: 'hi' }))));
test('bad slot fails', () => assertFails(create(pub(), 'ABCD2355', booking({ slot: 'Midnight' }))));
test('bad booking id fails', () => assertFails(create(pub(), 'abc', booking())));
test('blocked date fails', async () => {
  await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'settings', 'availability'), { blocked: [ymd(tomorrow())] }));
  await assertFails(create(pub(), 'ABCD2356', booking()));
});
test('tracking doc with mismatched phone fails', () => {
  const db = pub(); const b = booking(); const batch = writeBatch(db);
  batch.set(doc(db, 'bookings', 'ABCD2357'), b);
  batch.set(doc(db, 'tracking', 'ABCD2357_1111111111'), trackDoc(b));
  return assertFails(batch.commit());
});

// ---- public cannot read / list / update / delete ----
test('public cannot read a booking', async () => { await seed(); await assertFails(getDoc(doc(pub(), 'bookings', 'ABCD2345'))); });
test('public cannot list bookings', () => assertFails(getDocs(collection(pub(), 'bookings'))));
test('public cannot update a booking', async () => { await seed(); await assertFails(updateDoc(doc(pub(), 'bookings', 'ABCD2345'), { status: 'Ready' })); });
test('public cannot delete a booking', async () => { await seed(); await assertFails(deleteDoc(doc(pub(), 'bookings', 'ABCD2345'))); });
test('public cannot read or list reminders', async () => {
  await assertFails(getDocs(collection(pub(), 'reminders')));
  await assertFails(getDoc(doc(pub(), 'reminders', 'r1')));
});
test('public cannot write reminders', () => assertFails(setDoc(doc(pub(), 'reminders', 'r1'), { text: 'x', dueAt: Timestamp.now(), done: false })));
test('random collection is denied', () => assertFails(getDoc(doc(pub(), 'secrets', 'a'))));

// ---- tracking ----
test('public can get tracking doc by exact id', async () => { await seed(); await assertSucceeds(getDoc(doc(pub(), 'tracking', 'ABCD2345_9876543210'))); });
test('public cannot list tracking', () => assertFails(getDocs(collection(pub(), 'tracking'))));
test('public cannot update tracking', async () => { await seed(); await assertFails(updateDoc(doc(pub(), 'tracking', 'ABCD2345_9876543210'), { status: 'Delivered' })); });

// ---- settings ----
test('public reads availability, cannot write it', async () => {
  await assertSucceeds(getDoc(doc(pub(), 'settings', 'availability')));
  await assertFails(setDoc(doc(pub(), 'settings', 'availability'), { blocked: [] }));
});

// ---- owner ----
test('owner reads/updates/deletes bookings', async () => {
  await seed();
  await assertSucceeds(getDocs(collection(owner(), 'bookings')));
  await assertSucceeds(updateDoc(doc(owner(), 'bookings', 'ABCD2345'), { status: 'Received', notes: 'spring broken' }));
  await assertFails(updateDoc(doc(owner(), 'bookings', 'ABCD2345'), { status: 'Nonsense' }));
  await assertSucceeds(deleteDoc(doc(owner(), 'bookings', 'ABCD2345')));
});
test('owner manages reminders and availability', async () => {
  await assertSucceeds(setDoc(doc(owner(), 'reminders', 'r1'), { text: 'Call Asha', dueAt: Timestamp.now(), done: false }));
  await assertSucceeds(setDoc(doc(owner(), 'settings', 'availability'), { blocked: [], maxHomeVisits: 3 }));
});
test('signed-in non-owner is denied', async () => {
  await seed();
  await assertFails(getDocs(collection(stranger(), 'bookings')));
  await assertFails(getDocs(collection(stranger(), 'reminders')));
});
test('owner e-mail without verification is denied', () => assertFails(getDocs(collection(unverified(), 'bookings'))));
