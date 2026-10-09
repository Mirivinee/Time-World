# CLAUDE.md — Clock & Watch Repair Shop Website

## 1. Project in one line
A ₹0/month website for a small clock & watch repair shop. Customers book clock repairs or call; the owner manages bookings and reminders from a private dashboard.

## 2. Hard constraints
- **Zero running cost.** Firebase **Spark (free) plan only**. No Cloud Functions, no paid APIs, nothing that needs a credit card.
- **Simple.** Plain HTML + CSS + vanilla JavaScript (ES modules). No framework, no build step.
- **Mobile first.** Owner uses it on his phone. Every screen must work at 360px wide.
- **Plain English UI**, big tap targets, minimal typing.

## 3. Stack
| Part | Choice |
|---|---|
| Hosting | Firebase Hosting → `<shopname>.web.app` (free, public, indexed by Google) |
| Database | Cloud Firestore (free tier), locked by Security Rules |
| Owner login | Firebase Auth — Google sign-in, owner email allow-list |
| Code storage | Private GitHub repo (free) |
| Local discovery | Google Business Profile (free), links to the site |

## 4. Business rules
- **Big clocks** (grandfather, wall, cuckoo): book online → home visit. Address required.
- **Small clocks** (mantel, table, alarm): book online → drop-off at shop.
- **Watches**: NO online booking. "Visit the store" + hours + map + Call button.
- Booking form: name, phone, clock type (big/small), preferred date + slot, address (big only). **No problem description.** Owner calls back to confirm.
- **Call / WhatsApp buttons** are the main call-to-action on every page.

## 5. Pages
**Public:** `index.html` (home + call/WhatsApp), `book.html` (clock booking), `watches.html` (visit store), `track.html` (status by booking ID + phone).

**Owner (`/admin/`, login required):**
1. **Bookings** — day/week list, tap-to-call, confirm / reschedule / cancel, status (Booked → Received → Repairing → Ready → Delivered), block days off.
2. **Reminders** — owner-created + auto-created for upcoming home visits; "due today" badge on dashboard.

## 6. Folder structure
```
/public                → the ONLY folder deployed
  index.html  book.html  watches.html  track.html
  /admin  /css  /js  /img
/tests                 → Playwright tests
/.claude/agents        → subagent files (section 12)
firestore.rules        → access control (source of truth)
firestore.indexes.json
firebase.json          → hosting config + security headers
.mcp.json              → project MCP servers
.gitignore  .env.example
CLAUDE.md  DESIGN.md
```

## 7. Data model (Firestore)
- `bookings/{id}` — name, phone, clockType, date, slot, address?, status, createdAt, notes (owner only)
- `reminders/{id}` — text, dueAt, done, bookingId? — **owner only**
- `settings/availability` — working days/hours, max home visits/day, blocked dates — public read, owner write

## 8. Security rules (non-negotiable — check every change)
1. **Secrets:** the Firebase web `apiKey` is a public identifier, not a secret; protection comes from Rules + Auth. Real secrets (service-account keys, tokens) never committed, never in `/public`, never in client JS. `.gitignore` covers `.env*`, `*.key`, `serviceAccount*.json`, `firebase-debug.log`.
2. **Access control lives in `firestore.rules`**, never only in JS. Default: **deny all**.
   - Public may only **create** a booking: exact allowed keys, type checks, limits (name ≤ 60 chars, phone = 10 digits, address ≤ 200, date in future, status forced to "Booked").
   - Public cannot read/list/update/delete bookings. Track page reads one doc only when booking ID **and** phone match.
   - `reminders` and booking updates: owner only (`request.auth.token.email` in allow-list **and** `email_verified == true`).
3. **Admin routes:** every `/admin` page checks auth on load and redirects to login. Data stays protected by rules even if the page is opened directly.
4. **Passwords:** none stored — Google sign-in only. If email/password is ever added, Firebase Auth handles hashing. Never hash/store passwords ourselves.
5. **XSS:** never `innerHTML` with user data — use `textContent` / `createElement`. Validate + trim input on client **and** enforce in rules.
6. **Spam / rate limiting:** honeypot field + client cooldown; rules enforce field shapes; **Firebase App Check** (reCAPTCHA) on Firestore. Be honest: real server-side rate limiting needs paid Functions — App Check + rules is the free ceiling.
7. **Security headers** in `firebase.json`: CSP (self + Firebase/Google domains only), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, HSTS.
8. **CORS / API key:** no custom API; Firestore via Firebase SDK. Restrict the API key in Google Cloud Console to our hosting domains.
9. **No debug in production:** no data `console.log`, no emulator connections, no test accounts.
10. **Dependencies:** Firebase JS SDK from official CDN, pinned version. Remove anything unused.
11. **Exposed files:** only `/public` deployed; no `.git`, `.env`, rules, notes or backups inside it.
12. **Git history:** run `gitleaks` before first push and in every audit. A leaked secret must be **rotated**, not just deleted.

### Security audit (before every deploy)
Run the `security-reviewer` subagent + `/security-review`. It checks rules 1–12, tests rules in the Firestore emulator (public user reading bookings/reminders → must fail), Playwright XSS payloads in forms, headers on the live URL, `gitleaks detect`. Output = checklist of what was verified. Never claim "100% secure".

## 9. Working style (token saving)
- Read only the files needed. Don't re-read files just edited.
- Small focused edits, not full rewrites. Don't paste whole files into chat.
- Short answers, no step-by-step recaps.
- Ask only when truly unclear; otherwise pick the simplest option and note it.
- Use subagents for reviews so their long output stays out of the main context.

## 10. Plugins & skills
| Name | Type | When to use |
|---|---|---|
| **ponytail** | Plugin (always on, `full` mode) | Write the least code that works. **Never apply shortcuts to security code** (rules, validation, auth checks, headers). Use `/ponytail-review` on diffs. |
| **taste-skill** (`design-taste-frontend`) | Skill | Before building any page. Calm, trustworthy, classic-craft feel; minimal motion. |
| **image-to-code** (taste-skill repo) | Skill | When the user shares a sketch or screenshot. |
| **web-design-guidelines** (Vercel agent-skills) | Skill | UI review after each page is built. |
| **DESIGN.md** (own file, awesome-design-md format) | Project file | Follow it for colours, type, spacing. |
| **playwright-cli** | CLI + skill | All browser testing (preferred over Playwright MCP — fewer tokens). |
| **/security-review** | Built-in Claude Code command | Part of every audit. |

**Not used:** omniroute (sends code through third-party providers — not acceptable), graphify (project too small), other Vercel agent-skills (React-specific).

## 11. MCP servers (`.mcp.json`)
| Server | Purpose |
|---|---|
| **firebase** | Firestore rules, emulator, hosting, project config |
| **context7** (optional) | Up-to-date Firebase docs, avoids outdated code |

Keep MCP servers to these. Every extra server costs tokens on every message.

## 12. Subagents (`.claude/agents/`)
Subagents review and test; **the main session makes all code changes.**

| Agent | Tools | Job |
|---|---|---|
| **security-reviewer** | Read, Grep, Glob, Bash | Runs section 8 audit, reports PASS/FAIL per rule with file:line |
| **ui-reviewer** | Read, Grep, Glob, Bash | 360px layout, tap targets ≥ 44px, contrast, readability, web-design-guidelines review |
| **tester** | Read, Write, Edit, Bash | Writes/runs Playwright tests in `/tests` for public + admin flows |

Files to create (copy as-is):

`.claude/agents/security-reviewer.md`
```markdown
---
name: security-reviewer
description: Security audit of the repo or a diff against CLAUDE.md section 8. Use before every deploy and after any change to rules, forms, auth or firebase.json.
tools: Read, Grep, Glob, Bash
---
You are a strict security reviewer. Read-only: never edit files.
Check every item in CLAUDE.md section 8. For each, output PASS / FAIL / NOT CHECKED with file:line evidence.
Always: grep for innerHTML, console.log, apiKey, secrets; read firestore.rules and firebase.json headers;
run `gitleaks detect` if installed; confirm only /public is deployed.
End with a short list of fixes, most serious first. Never say "fully secure".
```

`.claude/agents/ui-reviewer.md`
```markdown
---
name: ui-reviewer
description: Reviews pages for mobile usability and design quality. Use after building or changing any page.
tools: Read, Grep, Glob, Bash
---
You review UI only. Read-only: never edit files.
Check against DESIGN.md and the web-design-guidelines skill: works at 360px, no horizontal scroll,
tap targets >= 44px, readable font sizes, good contrast, Call/WhatsApp buttons visible above the fold,
forms short and clear. Use playwright-cli for 360px screenshots when useful.
Output findings as file:line + one-line fix, most important first.
```

`.claude/agents/tester.md`
```markdown
---
name: tester
description: Writes and runs Playwright tests for the booking flow, track page, admin login redirect and form security. Use after features are built.
tools: Read, Write, Edit, Bash
---
You write tests only in /tests. Never change app code; report bugs instead.
Cover: booking big + small clock, validation errors, honeypot, XSS payloads rendered as text,
track page with wrong phone (must fail), /admin redirect when logged out, 360px viewport.
Use the Firebase emulator, never the live database. Report pass/fail summary + failing details.
```

## 13. One-time setup commands
```bash
# Tools
npm install -g firebase-tools @playwright/cli@latest
playwright-cli install --skills
# gitleaks: download from github.com/gitleaks/gitleaks/releases

# Plugins (inside Claude Code)
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail

# Skills
npx skills add https://github.com/Leonxlnx/taste-skill
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines

# MCP servers
claude mcp add firebase -- npx -y firebase-tools@latest mcp
claude mcp add context7 -- npx -y @upstash/context7-mcp   # optional
```
Check each project's README if a command fails — commands change over time.

## 14. Build order
1. `DESIGN.md` (warm, classic, trustworthy look) → 2. Firebase project + `firestore.rules` + rules tests → 3. Public pages → 4. Admin login + Bookings → 5. Reminders → 6. Headers + App Check → 7. `tester` + `ui-reviewer` → 8. `security-reviewer` + `/security-review` → 9. Deploy → 10. Google Business Profile + Search Console.

## 15. Definition of done
Works on a 360px phone, rules tested in emulator, no `innerHTML` with user data, headers present, Playwright tests pass, ui-reviewer and security-reviewer have no open FAILs, nothing secret committed.
