# Agent access and direct owner consent

Implemented 10 October 2026. Security method selected under the project owner's
instruction to choose secure defaults and continue. This completes the access
and consent component in source; it is not a production launch or completed
Milestone 1. Hosted installation, real wording and final browser/device acceptance
remain outstanding.

## Security policy

Staff use a confirmed email or phone, password and an authenticator-app TOTP.
Password and TOTP proofs must both be less than one hour old. Refreshing a token
does not extend this deadline. JWT signature, issuer, audience, role, subject,
anonymity and expiry are checked. The API also checks the live Supabase session,
its current verified TOTP factor and authentication-method timestamps. Logout,
factor removal, revoked/expired roles, suspended accounts/organizations and
expired accreditation block new privileged requests. A request already committed
before revocation is not undone. Production routes recheck session validity in
their database transactions; finalization rechecks security and consent under
the application lock.

TENANT_ADMIN reviewers remain independent of the enrolling agent. Public signup
provisions only VERIFIER. Metadata, an app section, MFA setup or an agent checkbox
never grants OWNER, ENROLLMENT_AGENT or TENANT_ADMIN. Authority administrators
grant roles/accreditation through controlled provisioning. Losing an authenticator
requires an administrator's verified recovery process and revocation of existing
sessions. The app provides no MFA bypass or self-service removal of verified factors.

Auth provider passwords, authenticator codes and setup secrets are never sent to
the AutoGuardian API or saved in its database. The setup key is displayed in memory
for manual entry in an authenticator app; secret/code views clear on background.
Tokens continue to use the existing Supabase session storage. HTTPS is required
outside the explicit local development exception. API responses use no-store.
Production browser origins must also use HTTPS; the server rejects an HTTP CORS
origin when the development exception is disabled.

The hosted managed Auth tables have provider-owned RLS with no application
policies. One Boolean-only, read-only gateway runs as the existing SQL Editor
migration administrator to check the requested session's metadata. It exposes no
session rows, passwords, refresh tokens or factor secrets. Only the restricted
access executor can call it; runtime/client roles receive no Auth table grants or
administrator membership. All private registration functions continue to use
restricted executors with forced RLS.

The development email/sample exception requires NODE_ENV=development,
ALLOW_DEV_EMAIL_AUTH=true and the AUTOGUARDIAN_DEV tenant. It cannot authorize a
production tenant. Production startup uses staff MFA automatically.

## Consent policy

An active OWNER signs in to their own confirmed account, opens an assigned
production application, reviews its vehicle details and the published English
or French text, and accepts. The enrolling agent cannot act as this owner. The
current direct-owner implementation supports a single PERSON owner record.
Company representatives require separately verified representation and are
denied by this consent path; typed representative details are not sufficient.

Published wording is immutable and carries separate SHA-256 hashes for both
languages, version, operator/authority, privacy contact, retention notice and
approval metadata. Changes require a new document/version. Acceptance records
actual owner/account/session, document hash, language, application revision,
owner generation and server time. History is append-only. Conflicting/stale
requests fail; exact retries return current state and cannot undo a later withdrawal.
Owner/vehicle edits require fresh consent. Uploading unrelated evidence does not
invalidate the wording agreement, though activation receipts remain snapshot-bound.

Withdrawal before activation is allowed even after submission, takes the same
application lock as activation and appends a rejected CONSENT receipt. After
activation, the owner is directed to the published privacy contact. Withdrawal
does not automatically erase retained audit history. Retiring the active agreement
also blocks finalization immediately. Neither consent nor staff MFA creates
OWNER_PHONE, SEALS, PAYMENT, PRODUCTION_EVIDENCE or REVIEW_POLICY confirmations.
SMS/owner phone-possession verification remains Milestone 2.

## What to run in Supabase

1. In SQL Editor, select the **postgres** role and open a **new query**. If 017
   has not been installed, run the whole
   [017 migration](../supabase/migrations/202610100017_independent_registration_reviews.sql)
   once first. Do not rerun already installed migrations 001–016.
2. Paste the whole
   [018 migration](../supabase/migrations/202610100018_staff_access_owner_consent.sql)
   into a new query and click **Run once**. “Success. No rows returned” is expected.
3. Run [verify-access-consent.sql](../supabase/verify-access-consent.sql) in a new
   query. All returned booleans should be true. Stop on any false/error.

018 creates no real consent wording, users, authority grants, owner eligibility
or production-enabled setting. Existing samples stay DEVELOPMENT. No hosted
database writes were performed by this implementation session.

Restart the local backend after installing 018 so it loads the built code. Start
it from backend with `npm.cmd start`; start the app from mobile with
`npm.cmd run web` (or the existing development-build workflow). If either server
is already running, stop that task's server first to avoid a port conflict.

Supabase authenticator MFA uses the provider's enrollment/challenge/verification
APIs. Verify email/password sign-in and confirmed staff accounts in the intended
project, require a minimum 12-character password, retain provider attempt limits
and disallow public privileged-role provisioning. These are hosted settings, not
settings that a code migration silently changes. Review TOTP setup and recovery
with the authority's administrator. [Supabase TOTP documentation](https://supabase.com/docs/guides/auth/auth-mfa/totp).

## Publishing the real agreement

The project owner still needs to supply four facts: operating organization,
registration authority, privacy contact and approved retention policy. Complete
and review the [English/French draft](AGENT-ACCESS-CONSENT-PROPOSAL.md) with those
facts. Do not publish invented details or an unapproved retention period.

After approval, fill every marked value in
[publish-registration-consent.sql](../supabase/publish-registration-consent.sql),
set wording_approved to true, and run the whole file once as postgres. Unfilled
fields fail without changes. Use a new version for each revision. The restricted
publisher can publish immutable wording and change the active document, but
cannot enable production, grant roles, read factor secrets or change consent events.

Production readiness also requires authority-controlled OWNER/private-owner
records and organization-scoped production_enrollment_owners eligibility, valid
agent accreditation and reviewer grants. production_enabled is a separate
administrator-controlled setting. The runtime/publisher cannot enable it.
Production encrypted owner/evidence storage and wizard contracts are now connected
using separate keys and a separate private bucket. Follow
[registration setup](PRODUCTION-REGISTRATION-SETUP.md) for migration 020, placeholder
details and final acceptance. Existing development records remain samples.

## Screens and acceptance

Live sign-in now accepts confirmed email/password. In **Account → Staff security**,
staff can enroll a TOTP authenticator or verify an existing factor. Success is
shown only after the backend verifies current staff access. Staff API requests
remain gated even if an app screen is opened directly.

In **Account → Registration consent**, eligible owners load assigned production
applications, review the chosen language, accept, withdraw before activation or
retry an uncertain choice with the same request key. Consent/vehicle views are
kept in memory and clear when backgrounded or the account/scope changes.

Manual acceptance is deferred until the end as requested: use separate agent,
reviewer and owner accounts; verify MFA failure/expiry/logout, account changes,
both languages, stale edits, exact retries, withdrawal before activation and
denied agent-as-owner acceptance. Also verify company representatives remain
blocked until their authority-backed representation workflow is available.
