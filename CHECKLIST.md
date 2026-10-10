# Project checklist

`[x]` = done and verified here · `[~]` = written but not yet run/verified · `[ ]` = still to do (needs you or a tool we don't have yet)

## Build (CLAUDE.md section 14)
- [x] 1. `DESIGN.md` (warm, classic, trustworthy)
- [x] 2. `firestore.rules` written (deny by default, public create-only, owner allow-list + `email_verified`)
- [x] 2. Rules tests (`tests/rules.test.mjs`) **run in emulator: 33/33 pass** (Java 21 now installed)
- [x] 3. Public pages: `index`, `book`, `watches`, `track`
- [x] 4. Admin login + Bookings (day/week/all, call, WhatsApp, status, reschedule, cancel, days off, daily limit)
- [x] 5. Reminders (owner-made + auto for home visits, "due today" badge)
- [x] 6. Security headers in `firebase.json` (CSP, nosniff, DENY, referrer, permissions, HSTS)
- [ ] 6. Firebase App Check — code is ready; needs reCAPTCHA v3 site key in `config.js`
- [ ] 7. `tester` agent: Playwright tests (needs `playwright-cli` + emulator)
- [~] 7. UI: real-photo redesign done; all 4 public + 2 admin pages checked at 360px (no sideways scroll). `ui-reviewer` agent to re-run on final code
- [~] 8. `gitleaks` installed, history scan clean (12 commits). `security-reviewer` ran once (commit 2c6ac75); re-run on final code + `/security-review` still to do
- [ ] 9. Deploy to Firebase Hosting
- [ ] 10. Google Business Profile + Search Console

## Definition of done (section 15)
- [x] Works on a 360px phone (checked in Chrome, no horizontal scroll; admin logged-in view not checked)
- [x] Rules tested in emulator (33/33)
- [x] No `innerHTML` with user data (grep: 0 uses; all dynamic text via `textContent`/`createElement`)
- [x] Headers present in `firebase.json` (not yet checked on live URL)
- [ ] Playwright tests pass (no e2e specs written yet, only rules tests)
- [ ] ui-reviewer and security-reviewer have no open FAILs
- [x] Nothing secret committed (only the public Firebase web config placeholders)
- [x] No `console.log` in `/public`; only `/public` is deployed

## You need to do (I can't)
1. Set up App Check: get a reCAPTCHA v3 site key, put it in `RECAPTCHA_SITE_KEY` (`public/js/config.js`, currently empty), and restrict the API key to your `*.web.app` domain.
2. Confirm the FAQ wording on the home page is true for your shop (free booking; price told before work starts).
3. Say when to deploy; then Google Business Profile + Search Console.
(Done already: Firebase project linked, owner email set, shop details set, Java 21, gitleaks, GitHub remote.)

## Design decisions to know about
- **Track page**: Firestore Rules can't see the phone typed by a visitor, so the public reads a small `tracking/{bookingId}_{phone}` document (status, date, slot only; no name/address). You must know both the ID and phone to fetch it. Bookings stay unreadable to the public.
- **Daily visit limit** can't be enforced for the public (they can't read bookings). The dashboard flags days over the limit and you decide on the call-back. Blocked days **are** enforced in the rules.
- **Dates**: bookings are from tomorrow up to 90 days ahead.
