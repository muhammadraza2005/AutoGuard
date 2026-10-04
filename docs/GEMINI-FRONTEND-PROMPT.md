# Gemini 3.1 / Antigravity frontend prompt

Open the whole AutoGuardian folder in Antigravity. Copy everything below the divider into Gemini.

---

Implement the AutoGuardian frontend in the existing `mobile/` React Native project. Codex has prepared the foundation. I want you to design and write a clean, cohesive mobile UI based on my updated Stitch references and `frontend.md`. Work on the files, run the app and verify the result. Do not stop at a plan, thumbnails or static mockups.

## Read first

- Root `frontend.md`: complete screen inventory, states, components and navigation.
- Relevant sections of root `backend.md` and `supabase.md`: domain rules, privacy, integration boundaries and pending decisions.
- `docs/STITCH-REVIEW.md`: export problems and corrections to apply.
- `two screens/stitch_autoguardian_unified_mobile_app/autoguardian_clean_trust_mobile_standard/DESIGN.md`: the design-system copy supplied with the new references (currently identical to the original Clean Trust document).
- Both `screen.png` AND `code.html` in `two screens/stitch_autoguardian_unified_mobile_app/consumer_vehicle_check_verification/`.
- Both `screen.png` AND `code.html` in `two screens/stitch_autoguardian_unified_mobile_app/owner_sale_authorization_alert/`.
- Agent `screen.png` and `code.html` in `stitch_autoguardian_unified_mobile_app/field_agent_vehicle_enrollment_wizard/`, and revised institutional `code.html` in `stitch_autoguardian_unified_mobile_app/institutional_counter_clearance/`.
- `mobile/README.md`, `mobile/AGENTS.md` and the existing source.
- The root English SRS when a requirement needs checking. The selected single-app delivery format is documented in the plans.

The new `two screens/` folder supersedes the original folder's consumer and owner visual references. Its PNGs are visible and its HTML differs from the earlier export. The original consumer/owner PNGs are still transparent; do not confuse them with the new files. For the institutional screen, the original PNG remains stale: prefer its revised HTML. Agent PNG is useful; the original brand-logo folder supplies the logo reference. Do not treat old Civic Trust design prose or old DRC verification HTML as requirements. Preserve all supplied exports and planning documents.

## How to use the new two-screen context

Use the PNGs to understand the intended appearance and the matching HTML for layout details. When their text or simulated behavior conflicts with the root plans or the review, keep the visual direction and correct the behavior. These two examples establish the shared consumer/owner design language; they do not replace the complete screen inventory.

Consumer reference: retain the compact navy shield header, language selector, white canvas, bordered identifier card, plate/VIN/QR selector, manual seal fallback, navy primary action, fee/allowance summary, amber NOT FOR SALE notice, neutral enrollment record, waiting card, safety reminder and labeled bottom tabs. Carry this visual treatment across separate input, fee/payment, status, waiting and outcome screens. Do not show a live result or a notified-owner state before the corresponding request/payment response.

Owner reference: retain the compact header, clear request heading, deadline notice, vehicle/request summary, prominent Yes/No choices, PIN keypad, transaction-validity notice and separate missing-report action. Keep Alerts selected for this flow. Present the PIN challenge after choosing an answer, with an explicit submit button naming that answer, and show success only after the required server response.

Apply these specific corrections to the new references:

- Replace “Silence will automatically decline this authorization” with a no-response explanation. Explicit refusal and timeout remain different results.
- Do not copy the HTML's simulated refusal alert claiming “Transaction blocked in the National Registry.” A refusal does not prove any institutional lock or registry update.
- Replace “encrypted SMS & Push” with an accurate notification delivery state. Do not invent SMS encryption or delivery success.
- Replace “Official DRC registration format” with a neutral identifier hint until approved formats exist.
- Separate “Cancel check / Receipt” into appropriate actions. Prefer automatic progress updates; provide retry/refresh when useful for connectivity recovery.
- The new owner HTML says 4–6-digit PIN, but its visual dots and keypad simulation are not the final validation policy. Implement the configured length, incorrect-PIN/lockout states and explicit submission; never authorize automatically when a dot count is reached.
- Treat the displayed fee, quota, timers, vehicle details, notification times, backup-notification status and 24-hour validity as synthetic examples. Compute countdowns from server deadlines; do not copy a demo interval as business logic.
- Remove unapproved “Kinshasa Registry” branding from the owner header. Resolve emergency contact from configuration rather than displaying its raw placeholder.
- Use the canonical theme tokens despite alternate navy/gold values in the HTML. Increase small reference text and short controls to the existing readability/touch standards.

The new screenshots are 470 × 1600 (consumer) and 487 × 1600 (owner). Those raster dimensions are references, not fixed native screen widths. Preserve hierarchy and spacing while adapting to 390/360 logical points, scrolling, safe areas, keyboard and French text.

## Technical scope

Extend ONE Android-first Expo/React Native TypeScript app in `mobile/`. Use the installed packages, npm and lockfile. No second app, Vite/Next.js website or desktop portal. Browser preview must use the same native source.

Routes are in `src/app/`; keep route files small. Put feature screens/logic in `src/features/`, shared UI in `src/components/`, tokens in `src/theme/` and adapters in `src/services/`. Replace the intentional foundation placeholders with finished UI.

Routing, theme, English/French resources, query provider, form/validation packages, optional Supabase setup, API boundary and camera/storage/image/document/push dependencies are prepared. Inspect installed SDK versions and matching official docs before native changes. Install additional packages only when needed using Expo compatibility tooling.

Convert Stitch layout into native View, Text, Pressable, TextInput, FlatList/ScrollView and native controls. Do not paste HTML into a WebView or use Tailwind CDN, browser DOM controls or remote Google fonts.

## Design

Use canonical white `#FFFFFF`, navy `#142B4A`, yellow `#F4C542`. Green/red need actual outcome labels/icons. Build calm, readable screens with restrained cards, modest rounding, clear hierarchy and prominent actions.

Use 390 logical points as the portrait reference, then verify 360-point width, safe areas, keyboard and enlarged text. Body text is 16 points; touch areas are at least 48 points. Accommodate French wrapping. Avoid excessive uppercase, certification stamps, decorative imagery and heavy animation. Bundle Public Sans if feasible; otherwise use consistent native fonts.

Full wordmark belongs on welcome; compact headers use a legible shield. Authority branding is configurable and must not imply approved government endorsement.

Create reusable buttons, inputs, phone/OTP/PIN fields, badges, vehicle summaries, wizard steps, payment/receipt cards, notices and confirmation sheets. All visible copy goes through English-keyed resources with complete French counterparts. Do not mix languages on a language-selected screen.

## Build order

These are work groups in one product, not separate releases. Continue through them and use frontend.md for the full inventory.

1. Welcome/language, phone OTP/resend/error, terms/consent, owner PIN setup, Account and permission states; consumer tabs Check / My vehicles / Alerts / Account.
2. Buyer: plate/chassis/seal QR/manual input → configured fee/free quota → payment when needed → vehicle status → waiting → distinct confirmed, denied, no-response and expired outcomes. Include unknown/missing vehicle, camera denied, revoked/unreadable seal, weak network and payment pending/failed.
3. Owner: vehicles/detail, Alerts, answer selection → PIN → outcome; separate missing/lift-with-reason, sale listing/expiry, seller mandate, backup invitations/permissions, subscriptions/installments/receipts.
4. Transfer: invitation, buyer OTP/acceptance, identity pending, seller PIN, configured registry/lock pending, refusal/completion; new owner starts NOT FOR SALE and cannot see former-owner private history.
5. Agent: Enrollments / New enrollment / Seal stock / Account; full wizard with owner/company details, documents, vehicle/photos, four package choices, seal placement/photos, OTP, payment, review, pending/active, conflicts, draft/sync states, stock/replacement and assisted phone change.
6. Institutional: separate role-scoped lookup and clearance; reason before identity access, operation-specific consent, eligibility, issuance/refusal/expiry/consumption. Administration: mobile management screens from frontend.md section 8, with distinct roles and organization scopes.
7. Finish French variants and loading/empty/error/offline/permission states throughout. Add SMS/USSD message-flow annotations from frontend.md section 9; smartphone screens do not replace basic-phone channels.

## Product rules

- FOR SALE is listed, not approved. Silence is no response, not explicit refusal. Enrollment is not legal title certification.
- Approval is bound to one buyer, vehicle, request and validity. Grouped alerts cannot approve all buyers.
- Paid results remain hidden until server payment confirmation. Separate service fees from seller purchase money.
- Buyers see no owner identity/contact/private documents or alarm-seal positions.
- Local PIN validation/button taps are not server authorization. Sensitive actions require validated authentication.
- No GPS/maps/tracking, marketplace, chat, NFC/OCR, connected alarm telemetry, invented statutes/bank roles or legal/security certification copy.
- One QR scan cannot prove all four seals are intact.
- Drafts are not active protection. Offline OTP/payment/provider confirmation cannot be invented.
- SQLCipher configuration does not encrypt photos/files. Until reviewed database AND attachment encryption exist, use only synthetic in-memory drafts.
- Registry/police/insurer actions differ. Clearance needs operation consent and eligibility; missing vehicles prevent issuance.
- Prices, validity, deadlines, emergency contacts, package definitions and connectors use configuration. Do not turn Stitch's 48-hour expiry or eight-digit seal hint into requirements.
- Unpaid subscriptions do not stop resale alerts.
- Backup positive approval remains unresolved; do not enable it by assumption. Honor the pending decision register.

## Preview and integration

Build an interactive preview without real accounts or provider credentials. Use typed synthetic fixtures/mock adapters under feature modules behind the existing development guard. Add development scenario controls where useful, outside production flows.

Account's preview-section selector is a developer tool, not public role signup or a production role switch. Real permissions come from verified server roles, tenant/org scope and authentication strength. Section navigation gates do not replace backend authorization.

Do not deploy services, create Supabase schema/RLS or send real payments/notifications. Use typed adapters aligned to planning documents and document missing integrations. Never place service-role keys, PINs or provider secrets in public environment variables/client storage/logs. No sensitive persistent query caches.

Live mode currently starts without a session or grants. Keep that fail-closed behavior until genuine auth/role loading exists. Do not implement fake successful login in live mode. Show unavailable/pending states for missing server behavior and demonstrate it separately through synthetic previews.

## Verify and deliver

Run `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npx.cmd expo install --check` and `npx.cmd expo-doctor`. Export Android and browser bundles. Use a native development build if tooling is available; browser checks alone do not establish Android acceptance.

Visually inspect principal English/French screens at 390/360 points with keyboard/text scaling. Check role restrictions, production fixture isolation, payment gating, no-response versus refusal and public-data privacy.

Deliver code, previews/screenshots, actual checks run and a clear list of unfinished screens, integrations and unresolved decisions. Do not describe placeholders or mock success as production completion.
