// Edit these values for the real shop. None of these are secrets.
export const SHOP = {
  name: 'Your Shop Name',
  phone: '+910000000000',
  whatsapp: '910000000000',
  address: 'Shop address, City, State PIN',
  hours: 'Mon–Sat, 10 am – 7 pm. Sunday closed.',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Your+Shop+Name',
};

// Firebase web config (public identifiers, protected by Rules + Auth). Fill from Firebase console.
export const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};

// reCAPTCHA v3 site key for Firebase App Check (public). Leave empty until App Check is set up.
export const RECAPTCHA_SITE_KEY = '';

// Must match the slots allowed in firestore.rules
export const SLOTS = ['Morning (9-12)', 'Afternoon (12-4)', 'Evening (4-7)'];
