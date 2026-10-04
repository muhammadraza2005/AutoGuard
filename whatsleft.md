# AutoGuardian — What's built and what's left

Status reviewed: **5 October 2026**.

Based on the original Software Requirements Specification, the agreed single-app plan, and the current local code. This checklist records implementation status; a preview screen does not mean its real operation is complete.

## Current position

The Stitch-based frontend is in place across the main sections. Most backend functionality and external integrations still need development.

**Rough overall completion estimate: 15–25% built, 75–85% remaining.** This is a planning estimate, not a measured percentage of requirements or code. Visual UI progress is much further along than production functionality.

## Already built

- [x] One Expo / React Native app with consumer, agent, institutional, and administration sections.
- [x] Stitch-based navy headers, navigation, cards, forms, buttons, and bundled Public Sans font.
- [x] Welcome, phone/OTP, consent-preview, and PIN-setup screens.
- [x] Consumer check, fee, payment-preview, waiting, and outcome screens.
- [x] Owner vehicle list/detail, authorization/PIN, alerts, and listing-preview screens.
- [x] Agent enrollment list, five-step wizard UI, seal-installation panel, and stock screens.
- [x] Institutional lookup, access-reason, clearance, token-preview, and incident panels.
- [x] Administration dashboard, user search, and account/section-preview screens.
- [x] English/French resources for the new screens and shared navigation.
- [x] Development preview identities and section-navigation guards.
- [x] API request helper, optional Supabase client setup, and native session-storage adapter.
- [x] Typecheck, lint, existing four foundation tests, Expo dependency checks, and all 21 Expo Doctor checks passed after the UI work.
- [x] Web bundle exported successfully after the UI work.

**Still to verify:** final visual checks across screens, French wrapping, keyboard/accessibility behavior, and actual Android device acceptance. The latest Android export result was not confirmed before browser checking stopped. No production release is established by these checks.

## Remaining development

| Area | Current status | What's left |
| --- | --- | --- |
| Frontend | Main layouts and interactive previews built | Missing business workflows; complete validation; loading, empty, error, offline, expired, and permission states; accessibility and device checks. |
| Backend | API helper only | Server endpoints and business rules for enrollment, checks, authorization, deadlines, missing reports, billing, transfers, seals, and clearances; background jobs and retry handling. |
| Database | Supabase connection foundation only | Tables, relationships, migrations, constraints, tenant isolation, row-level security, private storage, audit records, and backup/restore. |
| Authentication | Preview flows and local navigation guards | Real phone OTP, resend/expiry/attempt limits, session refresh, logout cleanup, server PIN verification, staff two-factor authentication, and permissions for all 14 roles. |
| Payments and billing | Simulated payment UI | Mobile money/card providers, verified callbacks, quota/exemption rules, subscriptions/installments, receipts, refunds, reconciliation, professional packages, and revenue sharing. |
| Notifications | Example messages only | Push/SMS delivery, templates, delivery tracking, owner and backup escalation, and configured WhatsApp/email/voice integrations. |
| Owner operations | Main preview screens | Missing report/lift, listing removal/expiry, per-request response state, history, subscriptions, and already-answered/incorrect-PIN handling. |
| Delegation | Account entry points only | Backup invitations/acceptance/removal, seller mandates/acceptance/revocation, expiry, and scoped permissions. |
| Ownership transfer | Not implemented | Buyer invitation/OTP, identity review, seller confirmation, registry handling where configured, completion/refusal, and removal of former-owner access. |
| Agent enrollment | Wizard and sample seal UI | Full vehicle/individual/company details, documents/photos, four package choices, actual QR scans and fitting evidence, owner OTP, payment, review, duplicates/conflicts, and assisted phone changes. |
| Offline operation | In-memory examples only | Encrypted database **and attachment files**, offline access policy, persistent drafts, sync/retry, stock reconciliation, and safe conflict resolution. |
| Seals | Sample installation and stock panels | Real allocations, authenticated seal identifiers, inspection results, replacement/revocation, and lost/damaged handling. |
| Institutional operations | Registry/clearance previews | Separate police, registry, and insurer scopes; logged identity access; owner consent; real clearance issuance/refusal/expiry/consumption; missing reports; inspection and incident workflows. |
| Administration | Sample dashboard and user search | Organizations/accounts, accreditation/suspension, enrollment reviews, stock allocation, configuration/templates, incident queues, financial operations, audits, support procedures, and filtered CSV/PDF reports. |
| SMS/USSD | Not connected | Basic-phone menus, secure owner responses, request correlation, bilingual messages, and provider integration. |
| Institutional API/connectors | Planned only | Partner authentication/scopes, API contracts, webhooks, DGI/police/insurer adapters, and locks activated only when agreements permit. |
| Production release | Development checks only | Meaningful business/security tests, entry-level Android testing, performance, monitoring, recovery, signed builds, store publication, technical documentation, and bilingual role guides. |

## Suggested order and timeline

These are work groups for one complete product, not separate app versions. Estimates assume a small dedicated team, some overlapping work, timely decisions, and available provider access.

| Order | Work | Estimated duration |
| --- | --- | --- |
| 1 | Finish missing frontend flows and confirm business rules/provider choices | 2–3 weeks |
| 2 | Database, backend foundation, real authentication, and permissions | 4–6 weeks |
| 3 | Connect enrollment → payment/check → owner alert → response, including missing reports | 4–6 weeks |
| 4 | Offline enrollment, seals, subscriptions, delegation, and transfers | 4–6 weeks |
| 5 | Institutional/admin operations, SMS/USSD, and partner integrations | 4–7 weeks |
| 6 | Device testing, security, reliability, and release preparation | 3–4 weeks |

**Full-scope planning range: approximately 5–8 months.** A connected core journey could be available earlier, roughly **10–15 weeks**, assuming its required providers are accessible. These are estimates, not delivery commitments; staffing, discovered issues, and external waiting periods can change them.

## What we can build and what needs external input

We can implement the frontend workflows, backend, database, permissions, offline storage, integration adapters, tests, and deployment setup.

The following still need project-owner decisions or external access:

- [ ] SMS/USSD, mobile-money, card, and other messaging provider choices, accounts, credentials, and costs.
- [ ] USSD code allocation and basic-phone access arrangements.
- [ ] DGI, police, and insurer agreements, API access, and connector documentation.
- [ ] Final prices, revenue splits, quotas, deadlines, validity periods, review rules, and cash policy.
- [ ] Clarification of backup-contact sale approval, grouped requests, and secure SMS/USSD authorization rules.
- [ ] Approved terms, consent text, emergency contact, hosting/data-location requirements, and retention policy.
- [ ] Pilot area, release accounts, and final acceptance criteria.

## Scope used for this estimate

One **Android-first mobile app**, with consumer, agent, institutional, and administration functions inside role-based sections. Separate desktop portals and a later iOS release would add work and are not included in this estimate.

The supplied Stitch exports remain visual references. Existing planning documents remain the detailed requirements sources.
