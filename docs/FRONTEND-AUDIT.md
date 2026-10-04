# AutoGuardian frontend review

Reviewed the local Gemini/Antigravity changes on 4 October 2026 against `frontend.md`
and `docs/GEMINI-FRONTEND-PROMPT.md`.

## Verdict

The frontend is a partial interactive design prototype. It is not complete and is
not ready for production. React Native/Expo is already the app implementation;
the web preview runs the same source, not a separate website.

## Preview

Open http://localhost:8081 while the Expo server is running. To restart, double-click
`Preview App.cmd` in the project root, or run `npm.cmd run web` inside `mobile`.
Use Account > Preview section to inspect agent, institutional and administration
screens. Fixtures are synthetic. No environment file or real credentials are needed.
Payment, authorization and authentication flows are demonstrations, not server
operations. Do not enter real PINs or private vehicle/identity information.

## Corrections made during this review

- Removed an invalid `react-router-native` import; this project uses Expo Router.
- Added missing badge styles that caused TypeScript errors.
- Hid consumer detail routes from the bottom tab bar; retained the four main tabs.
- Added the missing auth layout and blocked mock authentication in live/release mode.
- Replaced the nonexistent QR route with an explicit unavailable screen and manual
  code fallback. Camera scanning still needs implementation.
- Restored a visible synthetic-preview banner across the app.
- Corrected payment/PIN/OTP and draft messages that claimed real confirmation,
  delivery or persistence where none occurs.

## Scope still unfinished

| Area | Current implementation | Remaining frontend work |
| --- | --- | --- |
| Access | Phone, OTP, terms and PIN demo screens | Validated OTP/resend/error/lockout states; real consent controls; PIN confirmation policy; genuine logout/session cleanup; permissions and recovery |
| Buyer | Identifier, fixed fee, simulated payment, countdown and outcome pages | Camera QR scanning; configured quota/exemptions; unknown vehicle and seal states; vehicle-status step; pending/failed/refunded payment; server deadlines; expired confirmations; safety/reminder configuration |
| Owner | Static vehicles/detail, alerts, answer/PIN and listing demos | Missing report/lift, listing removal, per-request response state, expired/already-answered/incorrect-PIN states, photos/seal overview, history, subscriptions/installments/receipts |
| Transfer | No transfer routes | Invitation, buyer OTP and acceptance, identity pending, seller PIN, registry pending, refusal/completion and ownership/privacy changes |
| Delegation | No management flows | Seller mandates, backup invitations/acceptance/removal and delegated permissions; unresolved positive backup approval must remain disabled |
| Agent | Static list/stock and a three-step wizard | Persist entered form values into synthetic draft state; full owner/company/vehicle details; documents/photos; all four packages; four seal scans/positions/photos; OTP/payment/review/conflicts; sync/retry; replacement and assisted phone change |
| Institutional | Mock reason/lookup and static clearance list | Authority/role/organization scope; eligibility and consent; issuance/refusal/expiry/consumption; seal inspection; missing reports; incidents; scoped dashboards |
| Administration | Static dashboard/users | Working search/filter/detail/actions; organizations/accreditation, reviews, seal allocation, configuration, templates/connectors, incidents, reconciliation/refunds, audits, support and exceptional procedures |
| Localization | Translated navigation and some headings | Most new content and buttons are hardcoded English. French selection currently produces mixed-language screens |
| Shared states | Limited static/demo states | Consistent loading/empty/error/offline/permission handling, validation, keyboard/safe-area/text-scaling checks and minimum touch sizes |
| Basic-phone channels | No implementation annotations | SMS/USSD and notification message-flow annotations from frontend.md section 9 |

Specific inactive actions include Report Missing, Remove Listing, Backup Contacts,
Change PIN, agent draft rows, lost/damaged seals, Issue New Clearance and Add User.
The wizard's final button simply returns to the agent list; it does not save a draft.
The institutional mock combines traffic-stop and registry purposes and fabricates
eligibility; the final implementation must separate real role/authority scopes.

## Integrations still absent

Genuine authentication/role loading, backend API/domain operations, Supabase schema
and RLS, payment providers, notifications, server deadline/status updates, encrypted
offline database AND attachment storage, and institutional connectors remain pending.
SQLCipher plugin configuration alone does not establish encrypted offline storage.
New fixture data is mostly embedded directly in route components rather than typed
feature adapters. The existing four tests cover foundation access/fixture behavior;
they do not validate the new business flows.

## Verification and limits

- TypeScript: passed after the corrections.
- ESLint: zero errors, 22 existing warnings, primarily unused translation variables.
- Existing tests: 4/4 passed.
- Expo dependency compatibility: passed; Expo Doctor: 21/21 passed.
- Browser server: HTTP 200 at localhost:8081.
- Automated visual interaction was unavailable: the Windows computer-use tool
  stopped because it could not reliably determine the current browser URL.
  No claim is made about visual fidelity, mobile-width layout or complete interactions.
- Android bundling is distinct from an APK/device acceptance test.
- Web export and Android Hermes export both passed after the corrections.
- npm audit reported 29 advisories (10 moderate, 19 high). Suggested automatic
  fixes include incompatible major version changes/downgrades; no forced audit
  upgrades were applied. Expo compatibility passing does not clear these advisories.

The root and mobile README files describe the earlier foundation and predate Gemini's
screen changes. Use this review for the current frontend completion status.
