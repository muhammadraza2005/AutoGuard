# AutoGuardian Stitch Revision Prompt

Use the existing AutoGuardian Stitch project and revise it. Keep its white, navy and yellow identity and shield logo direction. This is a correction and completion of the current design, not a request for a different product or separate apps.

## Source of truth

Use the supplied `AutoGuardian — Software Requirements Specification (EN).docx` for functionality and the current root `frontend.md`, `backend.md` and `supabase.md` for planning decisions. Do not use invented content in the current screenshots or `civic_trust_kinetic_shield/DESIGN.md` as a requirements source. Update that design-system document to agree with these corrections.

The selected direction is ONE React Native mobile app, Android first, with consumer, agent, institutional and administration sections restricted by assigned account roles. Shared identity does not give everyone institutional privileges. Design all screens at a consistent 390 px portrait width, with shared branding, native mobile navigation, safe areas and reusable components. No separate desktop portal or separate agent app in this design request.

All visible labels within the initial screen set must be English. Provide separate French variants after the English flows are coherent; do not mix English and French in one language-selected screen. Both languages remain required in the product.

## Keep and improve the visual identity

Keep pure white `#FFFFFF` as the main background, navy `#142B4A` as the primary color and yellow `#F4C542` as an accent. Preserve the readable sans-serif direction, restrained cards, consistent outline icons and clearly labeled buttons. Use navy text on yellow. Keep green/red for actual success/danger with text and icons, rather than using green to imply a vehicle is legally safe to buy.

Make the consumer experience calmer and simpler. Reduce uppercase labels, legal-looking banners, certification stamps, excessive nested borders and repeated headers. Use sentence-case titles, 16 px main body text, at least 48 logical-pixel touch targets, comfortable spacing and clear visual hierarchy. Supporting text may be smaller, but essential warnings and decisions must remain readable. Accommodate longer French translations without clipping.

Separate tasks into focused screens rather than one very tall page. The current consumer page combines input, vehicle result, waiting, warnings and actions; redesign that as a flow. Administrative tools may be denser, but must still use mobile lists, filters and detail pages.

Use the shield mark alone at a legible size in the compact header. Use the full wordmark on welcome/splash screens; do not shrink the complete wordmark into a tiny white square. Keep authority/country branding configurable. Do not make the app look like an officially endorsed government service unless approved authority branding is supplied.

## Remove unsupported additions throughout

Remove these from screenshots, copy, badges, component definitions and the design-system narrative:

- GPS/geolocation, buyer-location claims, geolocated seals and promises to transmit location to prosecutors. AutoGuardian explicitly does not track vehicles. An enrollment area label is administrative data, not a live position.
- Invented law references, government regulations and legal protocols: “Congolese Penal Code Art. 122,” “DRC-Certif,” “BR-20-410,” ministry/prosecutor claims and guarantees of legal finality. Use plain product explanations instead.
- Invented lien/title guarantees such as “GAGE VALIDÉ,” “official title,” “legally cleared” or “certified vehicle.” Enrollment is not proof of legal ownership clearance or transaction approval.
- Technical/security marketing claims such as “256-BIT SECURE,” “encrypted SMS,” “SHA-256 validated” and certified administrative-node timestamps. User screens should show supported workflow facts, not backend implementation claims.
- NFC scanning and plate OCR. The source requires QR scanning and plate/VIN/manual seal entry; do not add hardware or recognition features without a scope decision.
- Engine-block identifiers, mechanical reports, bank roles, impoundment/dispute statuses and permanent-purge actions that are not defined by the requirements.
- An assumed DRC plate pattern `0000AA00`. Use a neutral plate-input hint until the authority supplies approved validation formats.
- The hard-coded emergency number `112`. Use `{authority_emergency_number}` as a configuration placeholder in the design annotations; do not invent a replacement number.
- Claims that DGI/police connectors are already live. Design explicit disabled/not configured, awaiting official confirmation and confirmed-by-connected-source states, with the confirmed state only as a clearly annotated conditional example.

Do not add marketplaces, maps, buyer-owner chat, connected alarm monitoring, public owner identity or public alarm-seal positions. Physical alarm seals sound when torn; the app does not receive radio telemetry from them.

## Correct the existing consumer check screen

Replace “Citizen portal” and bureaucratic/legal headings with “Check a vehicle.” Use a short explanation: “Check the vehicle, then wait for the owner's confirmation before paying the seller.” Distinguish the verification-service fee from purchase money: a paid check can require a fee, but the buyer must not pay the seller before authorization.

Design this sequence as separate connected screens:

1. Entry: Plate / Chassis number / Seal QR, an editable input, manual seal-code fallback and one prominent “Check vehicle” action.
2. Fee/free allowance: configured price and eligible free check, followed by payment only when required. USD 2 and one free monthly check are annotated SRS defaults, not final fixed commercial terms.
3. Payment pending/failed/confirmed states. Do not reveal the paid vehicle result before confirmed payment.
4. Vehicle status: prominently show NOT FOR SALE, FOR SALE, SALE BY AUTHORIZED AGENT or REPORTED MISSING. Unknown vehicles get “Not protected by AutoGuardian.” Show only approved vehicle facts, trust level and legitimate scan results. Never show the owner's name, phone or address to a buyer.
5. Waiting for owner: clear progress, remaining time, backup-notified state when applicable, and a concise safety reminder.
6. Separate confirmed, denied, no response and expired-result screens. Confirmation is for this buyer, vehicle and validity period only; it does not transfer ownership.

“Enrolled” is a secondary record fact, not the main sale result. FOR SALE is not approval. Silence must display “Sale not confirmed: the owner did not respond,” not an explicit owner refusal.

A single scanned QR identifies a seal/vehicle. Do not show “4/4 active and intact” as proof from a single scan or imply the app remotely knows seals are physically intact. Full inspection requires the permitted role and the actual required reads; use “4 of 4 registered seals matched” only after that inspection. Public verification must not identify alarm placement.

Keep “Never confront the seller. If in doubt, contact the police.” Show the configured emergency contact. Replace the combined “Cancel / Receipt” button with separate actions appropriate to each state. Automatic status updates are the primary progress behavior; a manual retry can appear after connectivity failure.

Consumer navigation should follow Check / My vehicles / Alerts / Account, with only permitted sections shown. Do not highlight Seals while displaying an owner alert. A role switch appears only for roles already assigned to the account; it is not a public role-selection/signup control.

## Correct the existing owner alert screen

Use “Sale authorization request” and: “Someone is checking your vehicle for purchase. Did you authorize this sale?” Show vehicle/plate, request reference and server-backed remaining time. Remove the invented market location, lien badge, legal warning and buyer contact field; buyer contact is not required by this source workflow.

Use clear “Yes, I authorized this sale” and “No, I did not authorize it” actions. After selecting an answer, show a focused owner PIN challenge and a final button specific to that answer. Do not show a successful authorization before required PIN/server validation. Cover incorrect PIN, lockout, expired request, already answered and network failure.

Keep missing reporting separate. After a negative response, offer “Report vehicle missing” as the follow-up required by the source; refusing a sale must not automatically report theft. Preserve the distinction between missing reported by the owner and an official police report reference.

Show “Applies only to this transaction” and the configured validity on confirmed outcomes. If a source default such as 24 hours is used in a prototype, annotate it as configurable. Grouping notifications must not approve every buyer with one response. Do not assume backup contacts can give positive approval while that source conflict remains unresolved.

## Correct the existing agent enrollment screen

Keep the progress indicator, scanned-seal checklist, manual fallback, photos and explicit encrypted-draft action. Use English user-facing package names: No seals, Standard, One alarm and Four alarms. Internal codes such as FOUR_ALARMS belong in annotations, not as the primary customer-facing label.

Replace “Valid record” or equivalent success badges on incomplete/offline enrollment with “Draft — not active.” Separate actual network connectivity from the fact that encrypted offline storage is available. Allow agents to save encrypted drafts offline; OTP verification, central duplicate checks and provider payment confirmation require connectivity. Show “Internet connection required to verify the owner” when that step cannot continue. A synchronized draft may still await required checks or authority review.

For the sealing step, retain configurable positions and photos; any sample positions are examples, not fixed requirements for every vehicle category. The selected FOUR_ALARMS package needs four placements. NONE skips seal placement; ONE_ALARM distinguishes its operational classification only for authorized roles. Remove geolocated cryptography and the invented DRC-Certif legal consequence.

Complete the wizard with vehicle details, owner individual/company details, ID plus registration certificate/purchase invoice, at least four vehicle views, plate/chassis photos, owner OTP, all four package choices, payment, review/submit and final active/pending-review states. Add duplicate plate/VIN, already-assigned/revoked seal, camera denied, partial photo upload and suspended-agent states. Keep conflicting drafts for resolution rather than replacing an existing vehicle.

Give the agent section role-appropriate navigation: Enrollments / New enrollment / Seal stock / Account. Reuse the app shell and components instead of creating a separate app.

## Correct the existing institutional clearance screen

Keep the mandatory access-reason field before owner identity is revealed. Show the actual active role; do not combine police and registry privileges by default. Hide audit-log navigation unless the account has a permitted audit/admin role. Different active roles expose only actions allowed by the SRS matrix.

Replace NFC/OCR actions with QR scan and manual plate/VIN/seal entry. Remove engine-block data and legal/security certification claims. Trust badges are conditional: awaiting official confirmation is different from government verification; a connector outage must not become a green official verification.

Separate vehicle lookup from clearance issuance. Clearance workflow: choose registration, insurance or transfer → identify requesting organization → request operation-specific owner consent → show subscription/seal/missing/active-record checks → issued or refused. Do not show an already valid token while also presenting an issuance action as though the prerequisites were complete.

Issued/refused/expired/consumed states must be distinct. Validity comes from configuration; remove the invented fixed 48 hours. If the SRS's seven-day report default is illustrated, annotate it as configurable. The token is single-use and bound to vehicle, operation and requesting organization. Display a reference and approved authenticity QR; do not expose a reusable secret token as general record metadata.

A NOT FOR SALE listing is not the same as clearance refusal for registration/insurance; clearance has its own operation consent and eligibility checks. REPORTED MISSING prevents token issuance. Use “Request clearance” and “Consume authorized token” in their correct workflow states, rather than an unexplained “Issue sale token.”

Use mobile lists/detail screens for anomalies. Separate incident submission from missing-report permission; registry and police actions are not interchangeable. Label icon actions such as receipt/export rather than relying on an unexplained print icon.

## Add the missing flows in manageable groups

First correct the existing four workflow designs. Then extend the same app in these groups; these are design tasks, not product releases:

1. **Consumer foundation:** welcome/language selection, phone OTP, terms/consent, owner PIN setup, My vehicles list/detail, Alerts list, account/preferences, agent-assisted phone-change instructions, camera/manual-entry and weak-network states.
2. **Consumer completion:** buyer fee/payment/results; missing report/lift with reason and police-reference distinction; list for sale and expiry; seller invitation/acceptance/revocation; backup contact invitation/acceptance and scoped actions; subscriptions/installments/reminders/receipts; ownership transfer invitation, identity validation, buyer acceptance and seller PIN confirmation.
3. **Agent completion:** all enrollment steps, encrypted drafts/sync queue, duplicate/conflict handling, seal stock/replacement/revocation and agent-assisted phone change. Show pending versus active enrollment explicitly.
4. **Institutional and administration:** corrected clearances, consent-scoped insurer workflows, role-scoped missing/incident handling, authority/org/agent management, enrollment review, pricing/templates/settings, payments/refunds/reconciliation, dashboards and authorized masked audit/export screens. Use mobile management screens inside this app.

Do not invent unspecified professional-package tiers, seal prices, revenue splits, emergency numbers, provider contracts or final response windows. Use configuration annotations and source defaults where appropriate. Keep inactive institutional integrations and role permissions visibly distinguishable in prototype states.

## Expected output

Return the revised English 390 px screens, named consistently and connected into flows, plus an updated design-system document. Include loading, empty, invalid input, payment failure, offline, permission denied, request expiry and success variants where applicable. Then provide separate French variants for the critical flows with layout expansion verified.

The design review is complete only when the consumer's next action and sale status are immediately clear, each privileged action is role-appropriate, no location/legal/government/security claims are invented, and every screen belongs to the same app.
