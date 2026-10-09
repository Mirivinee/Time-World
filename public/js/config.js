// Edit these values for the real shop. None of these are secrets.
export const SHOP = {
  name: 'Skanda Sai Time World',
  phone: '+917899235968',
  whatsapp: '917899235968',
  address: '8A, 1st Main Rd, near Motappa Park, Manjunath Nagar, HMT Housing Colony, Bengaluru, Karnataka 560010',
  hours: 'Mon–Sat, 10 am – 7 pm. Sunday closed.',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Skanda%20Sai%20Time%20World%2C%208A%2C%201st%20Main%20Rd%2C%20Manjunath%20Nagar%2C%20Bengaluru%20560010',
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
