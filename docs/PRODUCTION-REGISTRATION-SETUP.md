# Registration integration and test setup

## What is prepared

Upload files are in [Milestone-1-Test-Uploads](../Milestone-1-Test-Uploads/README.md).
The README maps each field to its exact file. These are synthetic JPEG/PDF files,
with separate negative cases; never approve them as genuine vehicle evidence.
Use the normal isolated development wizard for the first upload test.

Production mode is connected to organization-scoped eligible owners, separately
encrypted owner details and evidence, actual owner-account consent, issued seal
stock, signed QR validation and independent administrator inspection. Agent sample
consent is denied for production applications. The administrator's registration
review screen includes batch issuance and physical inspection; accept current seal
photos before inspection, then approve the application after all checks pass.
OTHER uses the four actual descriptions saved by the agent. Unapproved provisional
mounting positions cannot pass. NONE requires an explicit independent inspection
decision without invented seals or photos.

The SRS supplies the name **AutoGuardian**, the packages and signed QR rules. It does
not supply the real legal operator, privacy contact, retention policy or HTTPS host.
Those defaults are recorded in [registration-setup-placeholders.json](registration-setup-placeholders.json).
The bilingual wording draft remains [AGENT-ACCESS-CONSENT-PROPOSAL.md](AGENT-ACCESS-CONSENT-PROPOSAL.md).
Placeholders remain visibly unapproved. No agreement, privileged account or
production-enabled database setting was created by this setup.

## Your immediate Supabase steps

019 is already installed and verified by you. **Do not rerun it or earlier installed migrations.**

1. Open SQL Editor with the postgres role. Copy the entire
   [020 migration](../supabase/migrations/202610100020_production_registration_integration.sql)
   into a new query and run once. `Success. No rows returned` is expected.
2. Run the entire [integration verifier](../supabase/verify-production-registration-integration.sql).
   Every returned Boolean must be true.
3. For production-mode encrypted uploads, run
   [setup-production-evidence-storage.sql](../supabase/setup-production-evidence-storage.sql)
   once. It creates the separate private ciphertext-only bucket. It refuses to
   overwrite unexpected existing settings or silently add broad client access.
   If it reports existing Storage policies, inspect their bucket scope before
   enabling this bucket. The API also checks bucket settings before upload/read.

No hosted SQL was run by this implementation session. The ordinary development
upload test continues to use its existing private bucket and development key.

## Local server settings

The test setup script has generated missing values in ignored `backend/.env`:

- `PRODUCTION_OWNER_KEY_HEX` and `PRODUCTION_EVIDENCE_KEY_HEX`: independent random
  32-byte keys. They must also differ from the existing development key.
- `PRODUCTION_EVIDENCE_BUCKET=registration-enrollment-evidence`.
- Seal origin `https://seals.autoguardian.invalid`, active version `test-v1`, and
  an independent random HMAC key ring. Existing nonblank values are preserved.

To repeat missing-key setup from `backend/`, run
`node scripts/prepare-registration-test-config.cjs`. It prints no private keys and
never enables production. Preserve/back up the keys securely: replacing an encryption
key makes existing ciphertext unreadable; retain signing versions for printed labels.
Never put these keys in git or `EXPO_PUBLIC_*` settings.

Restart the existing backend after building with `npm.cmd run build`; use
`npm.cmd start` from `backend/`. Restart the existing app with `npm.cmd run web`
from `mobile/`. Stop existing task servers first to avoid a second instance on
the same port. This implementation has not restarted or deployed your servers.

## Before using real registration

Replace all placeholder facts and approve the bilingual agreement before running
[publish-registration-consent.sql](../supabase/publish-registration-consent.sql).
Its approval flag stays false until that review. A placeholder origin is allowed
for isolated signing tests; production startup rejects reserved `.invalid`, `.test`
and `.example` origins. Configure the actual HTTPS origin and independent production
key version before printing genuine labels. No public verification site was deployed.

Use authority-provisioned agent, owner and independent TENANT_ADMIN accounts,
agent accreditation and scoped production-owner eligibility. Staff require fresh
password/TOTP proof. Production enrollment is deliberately disabled until the
authority configures its real tenant and enables it. Do not change the development
tenant to production just to turn test files into real evidence.

**SMS/owner phone proof is Milestone 2. All payment-provider integration is
Milestone 3, as agreed.** Registration activation still requires their trusted
confirmations. These are later integration dependencies, not unfinished Milestone 1
payment work. A complete upload/review journey cannot manufacture those confirmations.

## Final manual acceptance

Automated verification passed: 58 backend tests, 68 mobile tests, TypeScript/lint,
web export and Android Hermes export. The two supplied PDFs parse and render with
their synthetic labels using the app's bundled renderer. The Storage setup's private
settings, repeat run and rejection of broad client policies were checked in isolated
PostgreSQL. Dependency compatibility passed using offline metadata, with the tool's
offline reliability warning. None of these results replaces signed-in/device testing.

Use the upload README to test uploads, reopen/decrypt, PDF display, corrections,
duplicate photos, stale edits and retries. Then use separate controlled accounts
to test MFA expiry, owner-only consent/withdrawal, administrator review/inspection
and tenant isolation. Check English/French layout and Android camera/QR/PDF behavior.
Actual physical mounting and authentic evidence require actual vehicles/documents;
the synthetic pack only tests software behavior. Full activation is tested after
the later phone/payment integrations are available.
