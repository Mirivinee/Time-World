# Project checklist

`[x]` = done and verified here · `[~]` = written but not yet run/verified · `[ ]` = still to do (needs you or a tool we don't have yet)

## Build (CLAUDE.md section 14)
- [x] 1. `DESIGN.md` (warm, classic, trustworthy)
- [x] 2. `firestore.rules` written (deny by default, public create-only, owner allow-list + `email_verified`)
- [~] 2. Rules tests written (`tests/rules.test.mjs`, 30 cases) — **not run**: emulator needs Java 21+, this PC has Java 8
- [x] 3. Public pages: `index`, `book`, `watches`, `track`
- [x] 4. Admin login + Bookings (day/week/all, call, WhatsApp, status, reschedule, cancel, days off, daily limit)
- [x] 5. Reminders (owner-made + auto for home visits, "due today" badge)
- [x] 6. Security headers in `firebase.json` (CSP, nosniff, DENY, referrer, permissions, HSTS)
- [ ] 6. Firebase App Check — code is ready; needs reCAPTCHA v3 site key in `config.js`
- [ ] 7. `tester` agent: Playwright tests (needs `playwright-cli` + emulator)
- [ ] 7. `ui-reviewer` agent: 360px review (needs a running site)
- [ ] 8. `security-reviewer` agent + `/security-review` + `gitleaks` (gitleaks not installed)
- [ ] 9. Deploy to Firebase Hosting
- [ ] 10. Google Business Profile + Search Console

## Definition of done (section 15)
- [~] Works on a 360px phone (CSS is mobile-first; not yet checked in a browser)
- [~] Rules tested in emulator (tests written, not run)
- [x] No `innerHTML` with user data (grep: 0 uses; all dynamic text via `textContent`/`createElement`)
- [x] Headers present in `firebase.json` (not yet checked on live URL)
- [ ] Playwright tests pass
- [ ] ui-reviewer and security-reviewer have no open FAILs
- [x] Nothing secret committed (only the public Firebase web config placeholders)
- [x] No `console.log` in `/public`; only `/public` is deployed

## You need to do (I can't)
1. Create a Firebase project (Spark plan), enable **Firestore** and **Auth → Google**, add a web app, paste the config into `public/js/config.js`.
2. Put the owner's Google email into `firestore.rules` (replace `owner@example.com`, line 8).
3. Edit shop name, phone, WhatsApp, address, hours, map link in `public/js/config.js`.
4. Install Java 21+ (for emulator tests), `firebase-tools`, `gitleaks`, `playwright-cli`.
5. Set up App Check (reCAPTCHA v3) and restrict the API key to your `*.web.app` domain.
6. Give me the GitHub URL and push (`git push -u origin main`).

## Design decisions to know about
- **Track page**: Firestore Rules can't see the phone typed by a visitor, so the public reads a small `tracking/{bookingId}_{phone}` document (status, date, slot only; no name/address). You must know both the ID and phone to fetch it. Bookings stay unreadable to the public.
- **Daily visit limit** can't be enforced for the public (they can't read bookings). The dashboard flags days over the limit and you decide on the call-back. Blocked days **are** enforced in the rules.
- **Dates**: bookings are from tomorrow up to 90 days ahead.
