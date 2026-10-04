# Stitch reference review

Reviewed 4 October 2026 against the supplied frontend plan and revision brief. This is a design/reference review, not contractual SRS acceptance.

## Source priority

Root `frontend.md`, `backend.md` and `supabase.md` are canonical. Their exported-folder copies currently have matching SHA-256 hashes.

Use `autoguardian_clean_trust_mobile_standard/DESIGN.md` for the revised visuals. The old `civic_trust_kinetic_shield/DESIGN.md` and `autoguardian_drc_vehicle_security_verification/code.html` contain rejected government/legal/security claims and unsupported features. Preserve them as historical references; do not implement them.

The subsequently supplied `two screens/stitch_autoguardian_unified_mobile_app/` is now the primary consumer/owner visual source. Its matching PNG/HTML pairs supersede those two references in the original export. Product behavior still follows the root plans. Its Clean Trust DESIGN.md has the same SHA-256 hash as the original Clean Trust document.

Stitch HTML is a browser prototype with CDN CSS, Google fonts and DOM controls, not React Native source.

## File findings

The table below records the original `stitch_autoguardian_unified_mobile_app/` export; the two new references are reviewed separately below.

| Reference | Finding | Use |
| --- | --- | --- |
| Consumer `screen.png` | 487 × 1547; transparent with no visible screen | Superseded by the new two-screen pair |
| Owner `screen.png` | 487 × 1473; transparent with no visible screen | Superseded by the new two-screen pair |
| Agent `screen.png` | 487 × 1853; visible revised seal step | Layout reference, normalized to 390 logical points |
| Institutional `screen.png` | 414 × 1600; older than its revised HTML, with mixed languages, combined police/registry, NFC/OCR and invented statute | Prefer revised HTML and apply corrections below |
| Brand logo `screen.png` | 640 × 165; usable transparent wordmark | Brand reference; not evidence of approved authority branding |

Both transparent exports were checked across every pixel: each has zero pixels with nonzero alpha.

Raster widths are not app layout dimensions. Recreate focused native screens instead of reproducing one extremely tall page.

## New two-screen references

Reviewed both visible PNGs, both HTML files and the included design document. Both HTML files differ from the corresponding original exports.

| Path under `two screens/stitch_autoguardian_unified_mobile_app/` | Finding | Implementation use |
| --- | --- | --- |
| `consumer_vehicle_check_verification/screen.png` and `code.html` | Visible 470 × 1600 design with identifier controls, fee summary, amber listing status, waiting notice and consumer tabs | Primary buyer-flow visual reference; split its combined page into focused screens |
| `owner_sale_authorization_alert/screen.png` and `code.html` | Visible 487 × 1600 design with request/vehicle summary, Yes/No actions, PIN keypad and missing-report follow-up | Primary owner-flow visual reference; separate answer selection, PIN submission and result |

Keep the shared navy header, white canvas, modest bordered cards and clear labeled navigation. Apply canonical colors, 16-point body text, 48-point touch targets and French wrapping instead of copying every HTML size.

Remaining issues in these new references:

- Owner silence is described as an automatic decline. Use NO RESPONSE / sale not confirmed, separately from explicit denial.
- The owner HTML's local refusal handler claims a National Registry block. Remove this unsupported outcome; local prototype interactions are not server authorization or institutional updates.
- The 4–6-digit PIN label is useful, but fixed dot/keypad simulation does not implement its policy. Add explicit answer-specific submission and server validation.
- Consumer notification copy claims encrypted SMS and presumes delivery/backup notification. Show only supported delivery states.
- The “Official DRC registration format” hint is unapproved; use neutral input guidance.
- Combined cancel/receipt actions, sample timers/fees/quota, 24-hour validity and raw emergency placeholder still need the existing corrections.
- Owner “Kinshasa Registry” branding is not approved authority identity. Treat vehicle/request/channel details as synthetic examples.

Use these findings in preference to obsolete consumer/owner-specific observations below when the new files already resolve an older issue (for example, the new consumer no longer imposes an eight-digit seal hint).

## Original export corrections and shared workflow rules

### Original consumer export
- Split input, fee/quota, payment, result, waiting and final outcome.
- Separate “Cancel check / View verification receipt” into appropriate actions.
- Remove the unapproved eight-digit manual seal restriction; agent examples use other formats.
- Prototype price/quota/timer values are examples, not server facts.
- FOR SALE is a listing, not approval. Enrollment is not title clearance.
- Show safety copy on progress/results. Use configured emergency contact, not a literal placeholder in finished UI.

### Original owner export
- Replace “Silence will automatically deny the sale” with “If you do not respond, the sale is not confirmed.” Explicit refusal and no response are distinct.
- Separate Yes/No selection and PIN validation; final action must identify the selected answer.
- Support required 4–6-digit PINs, not a fixed five-dot assumption.
- Treat 24-hour validity as a configurable source example. Show actual server expiry.
- Refusal does not automatically report theft; missing reporting stays separate.

### Agent
- Keep “Draft — not active” and separate connectivity/local-draft indicators.
- Hide internal `FOUR_ALARMS` code from customer-facing copy.
- Require all four placements before advancing; the example shows 3/4 with a proceed action.
- Seal positions, stock quantities and batch/vehicle details are synthetic examples.
- Do not claim encrypted offline storage is ready until BOTH database and attachment encryption are verified.
- Complete all wizard steps and NONE/Standard/One alarm/Four alarms choices; supplied reference covers only seal placement.

### Institutional
- Revised HTML still retains “BR-20,” “Legal registered owner,” “Configured validity: 48h” and HMAC security copy. Remove unsupported legal/security claims; validity comes from server/config.
- Hide identity until a reason has been submitted and access authorized.
- Separate lookup, consent/checks, issuance and consumption. Missing vehicles prevent issuance.
- Keep registry, police and insurer permissions distinct.
- Do not mark checks/consent passed without corresponding responses. A reference/authenticity QR is not a reusable bearer token.

### Shared
Some revised HTML still uses primary `#001632` and gold `#FECE4B`; generated design YAML includes extra Material palette values. Use the canonical white `#FFFFFF`, navy `#142B4A`, yellow `#F4C542` in `mobile/src/theme/tokens.ts`.

Use 16-point body text, minimum 48-point touch targets, clear labels/icons and French wrapping/text scaling. The four exports are incomplete examples: many authentication, payment, outcome, ownership, agent, administration and failure screens still need implementation.
