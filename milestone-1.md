# Milestone 1 — Finish vehicle registration

Last reviewed: **10 October 2026**.

This is the handoff for the next development session. Read this file alongside
[whatsleft.md](whatsleft.md), the relevant repository instructions, and the linked
implementation guides. Recheck repository and hosted setup state before continuing.

## Completion estimate and target

The previous 45–50% estimate is superseded by the concrete checklist below.
Evidence handling, finalization and independent review components are implemented.
The access/consent component is now implemented with password/TOTP, live session
checks and direct owner acceptance/withdrawal. Publishing real consent still
requires organization/authority/contact/retention details and final wording approval.
The seal backend component now implements signed batch issuance, independent
inspection and trusted seal receipts using SRS rules and safe defaults. Migration
019 is installed, with every verification result true as reported by the project
owner. Production storage/wizard integration and administrator seal controls are
now connected in source; apply 020 and follow
[the exact setup guide](docs/PRODUCTION-REGISTRATION-SETUP.md).
Local test keys and a synthetic upload pack are prepared. Real consent/domain
configuration and deferred manual acceptance remain. All payments are Milestone 3;
phone verification is Milestone 2. Their trusted activation prerequisites stay blocked
until those later integrations exist.

Milestone 1 covers registration preparation, consent, evidence, seals, independent
review and the gated finalizer/owner connection. Code completion and manual acceptance
are distinct from production activation, which also depends on Milestone 2 phone
proof and Milestone 3 payments. Samples and placeholder configuration never activate.

## What is done

- [x] NestJS backend and Supabase database foundation with restricted database
  roles, tenant isolation, row-level security and scoped audit events.
- [x] Development authentication, server identity checks, role loading and
  organization-scoped agent accreditation/access checks.
- [x] Agent enrollment drafts with vehicle details, owner selection, duplicate
  checks, revision conflicts and retry handling.
- [x] Encrypted sample owner details and versioned English/French sample consent.
- [x] Browser document/photo uploads, encrypted private storage, required evidence
  checklist and audited sample file reads. Saved evidence is not verified evidence.
- [x] Development assigned seal stock, QR/manual checks, reservations, provisional
  fitting records and fitting diagnostics.
- [x] Four saved sample seal location descriptions, bound to current draft and
  fitting revisions, with conflicts, exact retries and stale-data hiding.
- [x] Development evidence self-review: sample downloads, acceptable/correction
  decisions, four fixed correction reasons and append-only review history.
  Vehicle edits require fresh review; owner edits hide previous evidence.
- [x] Connected five-step agent wizard: Vehicle, Owner, Documents, Seals, Review.
- [x] Readiness checks that keep submission and activation disabled.
- [x] Owner vehicle list/detail reads already exist; activation must create the
  records that make newly registered vehicles appear there.
- [x] English/French resources for the connected enrollment features.
- [x] Technical setup guides and automated validation.
- [x] Encrypted native vehicle/seal and owner-form recovery, attachment and review
  retry journals, camera/sample selection and in-memory image viewing/review.
  Migration 015 is installed. Android PDF viewing is now implemented with a
  bundled renderer and automated real-PDF rendering checks; device acceptance
  remains pending. See [native implementation and limits](docs/DEVELOPMENT-NATIVE-EVIDENCE.md).
- [x] Submission/finalization component: trusted prerequisite checks, content
  snapshots, duplicate protection, exact retries and atomic vehicle/ownership/audit
  writes, connected to owner reads and the Review step. Migration 016 is installed
  and verified. Real activation still requires the remaining trusted integrations;
  isolated successful activation tests use synthetic privileged fixtures.

- [x] Independent TENANT_ADMIN review under the project owner's approved policy:
  separate reviewer access, audited image/PDF inspection, corrections, explicit
  replacement, append-only history, snapshot invalidation, agent feedback and
  trusted review/evidence confirmations. Migration 019 installation confirms its
  required 017/018 functions exist;
  approval now consumes the implemented independent production seal confirmation.
  See [setup and acceptance](docs/REGISTRATION-REVIEWS.md).

Latest integration checks passed: backend build and **58 tests**;
mobile TypeScript, lint and **68 tests**, including the exact upload-pack PDFs.
Web and Android bundles exported successfully. The previous full baseline also passed
**123 isolated database foundation checks** and web and Android Hermes
exports. Offline dependency compatibility passed with the tool's reliability
warning. These checks do not establish signed-in browser or physical-device
acceptance. The full enrollment HTTP test uses Auth/Storage provider doubles.

## What is left

- [ ] Publish the real English/French consent after replacing placeholder values for
  the organization, authority, privacy contact and approved retention policy.
  Password/TOTP, current-session checks, production draft entrypoint, direct
  owner consent/withdrawal and trusted access receipts are implemented in source.
  See [exact instructions](docs/AGENT-ACCESS-CONSENT.md). SMS/phone OTP remains
  Milestone 2 and still gates activation.
- [ ] Final physical-device evidence/capture/PDF acceptance. Android handling,
  PDF viewing, encrypted recovery and automated checks are implemented;
  full offline operation belongs to Milestone 3.
- [x] Registration seal backend: signed batch issuance, authenticated identifiers,
  assigned stock, actual location validation, independent MFA inspection, rejection/
  revocation checks and atomic stock consumption. SRS OTHER is supported; provisional
  category positions cannot be approved. [Setup and limits](docs/PRODUCTION-REGISTRATION-SEALS.md).
- [x] Apply 019: project owner reports every hosted verification result true.
- [ ] Replace the reserved test HTTPS seal origin before production. Local signing
  and independent production encryption keys are securely generated; back them up.
- [ ] Apply 020 and create the separate production evidence bucket using the exact
  [setup instructions](docs/PRODUCTION-REGISTRATION-SETUP.md). Production wizard,
  storage contracts, owner-account consent and administrator seal controls are connected.
- [ ] Prepare separate authority-provisioned agent, owner and reviewer accounts
  for final acceptance. The approved reviewer policy remains enforced.
- [ ] Signed-in browser and Android acceptance, including failed uploads, expired
  sessions, revoked permissions, competing edits, retries and incomplete checks.
- [ ] Verify French wrapping, narrow screens, keyboard, touch and accessibility.

## Scope boundary

The remaining checklist above covers registration only. SMS and owner phone OTP
integration belong to Milestone 2. Full offline startup, automatic durable sync,
stock reconciliation, general administration, subscriptions and expanded billing
belong to Milestone 3. App-wide language/security acceptance, performance,
monitoring, backup/restore, production deployment and store release belong to
Milestone 4. Broader transfer and institutional connector work is outside this
registration milestone.

Registration consent and verification hooks remain in Milestone 1; they must
fail closed until Milestone 2 supplies trusted owner verification. Registration
payment-provider integration is deferred entirely to Milestone 3 by the project
owner. Its activation gate remains fail-closed. Workflow-specific permissions, audit records, bilingual copy and
browser/Android acceptance remain part of each milestone's own implementation.

## Current setup and decisions

- Eighteen migrations exist in source. Hosted development **011–016 are confirmed**
  by read-only inspection; do not replay them.
- New [migration 014](supabase/migrations/202610100014_development_evidence_reviews.sql)
  is **installed**, confirmed by read-only inspection on 10 October 2026.
  Review functions, forced RLS, append-only executor grants, denied client table
  access and the two executor policies passed verification. Do not replay it.
- No new credentials, bucket or environment setting is required for 013/014.
- [Migration 015](supabase/migrations/202610100015_native_evidence_uploads.sql)
  is installed, confirmed by read-only inspection on 10 October 2026. All setup
  checks pass, including restricted native upload bindings and function privileges.
  Do not replay it. Native uploads are ready for final manual acceptance.
- Migration 016 is installed and passed read-only hosted verification after the
  project owner ran it. The verified 019 installation requires 017/018 functions;
  do not reapply them because of older pending-installation notes.
- Migration 019 for signed registration seals is installed. The project owner
  ran the read-only verifier and reported every result true. Do not replay 019.
  Follow [the seal guide](docs/PRODUCTION-REGISTRATION-SEALS.md) for signing setup.
  Latest backend suite: **56 tests passed**, including signed issuance, inspection,
  reviewer integration and atomic sealed registration. No manual device claim.
- Integration follow-up: **58 backend tests and 68 mobile tests passed**; production
  owner/upload contracts, private bucket setup, QR input and physical inspection
  controls are connected. Migration 020 awaits your SQL Editor run. The exact
  [upload files](Milestone-1-Test-Uploads/README.md) and
  [setup steps](docs/PRODUCTION-REGISTRATION-SETUP.md) are ready. Local random test
  keys were generated in ignored backend/.env; no hosted writes or deployment.
- Backend and Metro were running at the last check: backend health on port 3000
  and agent route on port 8081 returned 200; unauthenticated review access returned
  401. Recheck on the next session; processes may have stopped.
- SMS and phone OTP integration are assigned to Milestone 2 by the project owner.
  Owner verification remains required before real activation. Staff now use
  password plus authenticator TOTP under the owner's delegated security choice.
- No payment provider has been selected, confirmed by the project owner in this
  session. Provider confirmation cannot be treated as implemented.
- Manual browser and Android acceptance should be performed at the end, per the
  project owner's instruction. Continue independent implementation work first.
- Android phone testing was deferred: the owner asked to finish the report and
  test the phone later. Do not report device acceptance as completed.
- Payment provider access is Milestone 3. Actual seal host and approved consent facts
  must replace the delegated placeholders before production. Staff authentication and the independent
  authority review policy have been resolved.
  Samples cannot produce production approval or activation.

## Next achievable steps

1. Apply 020 and the private production bucket setup using
   [the exact instructions](docs/PRODUCTION-REGISTRATION-SETUP.md).
   The integration and synthetic upload folder are prepared; use its README for
   final manual tests. Real consent/domain values are production configuration,
   while SMS/phone proof and payment providers remain Milestones 2 and 3.
2. Migration 019 is installed and verified by the project owner; do not replay it.
   Prior migration installation records may be stale; do not rerun 017/018 merely
   because older notes describe them as pending. Migrations 015–016 are complete.
   To recheck setup from `backend/`:

   ```powershell
   node --env-file=.env scripts/verify-enrollment-setup.cjs
   ```

   This script is read-only and prints setup booleans without credentials. It
   checks the established functions and restricted review tables. Use the new
   `verify-production-registration-integration.sql` to check 020 as well.
   Installation and metadata checks do not establish signed-in acceptance.
3. At final manual acceptance, open an enrollment's Review step in the signed-in
   development browser. Use
   fictional samples to test downloads, correction/acceptable decisions, refresh,
   exact retries, competing edits and draft/owner invalidation. Follow the guide
   below. Check that submission and activation stay disabled.
4. At final Android acceptance, follow the native guide for recovery, capture,
   encrypted retries, image review, conflicts, sign-out and cache cleanup.
   Do not enable real evidence based on Node tests or exports alone.

## Implementation references

- [Connected wizard](docs/CONNECTED-ENROLLMENT-WIZARD.md)
- [Evidence review API, setup and acceptance](docs/DEVELOPMENT-EVIDENCE-REVIEWS.md)
- [Seal locations](docs/DEVELOPMENT-SEAL-LOCATIONS.md)
- [Evidence checklist](docs/DEVELOPMENT-EVIDENCE-CHECKLIST.md)
- [Seal fitting validation](docs/DEVELOPMENT-SEAL-VALIDATION.md)
- [Enrollment verification report](docs/ENROLLMENT-VERIFICATION-2026-10-10.md)
- [Backend setup](backend/README.md) and [database setup](supabase/README.md)
- [Mobile instructions](mobile/AGENTS.md)

Current development routes include `/agent` and
`/agent/new-enrollment?id=<draft-uuid>&step=review`. Implementation lives in
`backend/src/`, `mobile/src/features/enrollment/` and `supabase/migrations/`.

When changing code, run the relevant backend/database checks and the mobile
typecheck, lint, tests and compatibility checks required by its instructions.
Update this handoff and `whatsleft.md` with verified results and remaining work.
Keep local secrets and real owner documents out of commits and test fixtures.
