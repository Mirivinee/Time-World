# DESIGN.md — Clock & Watch Repair Shop

Feel: warm, classic, trustworthy. Like a well-kept workshop. Calm, minimal motion.

## Colour
| Token | Hex | Use |
|---|---|---|
| `--bg` | #FBF6EC | page background (warm cream) |
| `--card` | #FFFFFF | cards, inputs |
| `--ink` | #2E2118 | body text (contrast 14:1 on bg) |
| `--muted` | #6B5A4B | secondary text (5.6:1 on bg) |
| `--brass` | #8A5A12 | headings accent, links, borders (5.4:1 on bg) |
| `--call` | #1F5D4A | Call button (deep green, white text 7:1) |
| `--wa` | #167A3E | WhatsApp button (white text 5.3:1) |
| `--line` | #E3D6BF | borders, dividers |
| `--danger` | #A12B1F | errors, cancel |

## Type
- Headings: Georgia, "Times New Roman", serif. Body: system sans (`system-ui`). No web fonts (CSP, speed).
- Body 17px / 1.55. Inputs 17px (stops iOS zoom). h1 28px, h2 22px.

## Space and shape
- 8px grid. Page padding 16px, max width 640px, centred.
- Radius 12px. Cards: 1px `--line` border, soft shadow.
- Tap targets: min height **48px**, 8px apart.

## Components
- **Call / WhatsApp**: full-width buttons, always on screen: sticky bar at bottom of every public page.
- **Forms**: one column, label above field, big inputs, one primary button.
- **Status**: 5-step list (Booked → Received → Repairing → Ready → Delivered); current step bold with brass marker.
- **Motion**: gentle only: scroll reveal, hover lift, pulsing open dot. All disabled under `prefers-reduced-motion`.
- **Imagery**: real photographs only, no cartoon icons, no emoji. Photos live in `/img/photos`, all CC0 / public domain from Wikimedia Commons (grandfather: Lartington Station; wall: Antique wall clock; mantel: MET DP333812; watch: Mondaine Classic; movement: Mechanics movement feinmechanik; pendulum: Jacob Kock). Replace with the shop's own photos when available (same filenames).

## Rules
- Plain English. No jargon. Dates like "Mon 12 Oct".
- Never rely on colour alone (status has text).
- Works at 360px; no horizontal scroll.
