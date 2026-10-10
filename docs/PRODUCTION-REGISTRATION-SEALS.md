# Registration seals: implementation and setup

The backend implements milestone-one issuance, signed QR validation, placement
checks, independent physical inspection and atomic consumption at registration.
It uses the local [SRS](../srs.txt), F1 and section 8. General stock administration,
replacement workflows and consumer/police checks remain in their later milestones.
Production wizard/evidence-storage integration and administrator issuance/inspection
controls are now connected. Apply the forward-only 020 migration and follow
[registration setup](PRODUCTION-REGISTRATION-SETUP.md). Final device acceptance remains.

## Rules taken from the SRS

- Packages: NONE, four STANDARD, three STANDARD plus one ALARM, or four ALARM.
- Four different fitted IDs and four distinct staged image contents are required
  for a sealed package. Every location is recorded with a photo.
- IDs are generated in batches, with manufacturer, manufacture date, organization
  and accredited agent assignment. A tenant administrator attests the physical
  batch before issuance; software cannot certify manufacturing quality itself.
- QR: exact HTTPS verification origin, opaque alphanumeric ID and versioned HMAC.
  No owner, vehicle, location or alarm information appears in the QR. The readable
  code is available for manual fitting entry. An inspection scans each signed QR.
- Configurable category locations plus OTHER with a comment. NONE is allowed and
  needs an explicit independent decision, without any invented fitting/photo.
- Revoked IDs retain their status and reason; they cannot reactivate. Reusing a
  production ID on another draft is prohibited even after an earlier release.

## Defaults where the SRS is silent

The project owner delegated safe defaults. Issuance and physical inspection use a
current tenant-wide TENANT_ADMIN with password/TOTP MFA; the inspector must differ
from the enrolling agent. An approved inspection requires matching printed/QR IDs,
matching vehicle, intact seals and physically checked suitable surfaces. Each photo
must first be accepted by this inspector through the existing independent evidence
review workflow. A declaration alone cannot bypass the saved evidence or signature
checks. Accepted inspections generate only the SEALS prerequisite, valid one hour.

No exact vehicle mounting points are specified by the SRS. The four default preset
codes PROVISIONAL_POSITION_1–4 are visibly unapproved and cannot pass inspection.
Use the SRS OTHER option with four distinct **actual saved location descriptions**
until approved category presets exist. Inspectors assess material suitability,
heat/moving components, visibility and damage against the physical product's
instructions. The software does not invent safe mounting points for a manufacturer.
Preset codes can be configured by the authority in private.production_seal_locations;
unapproved/withdrawn presets cannot pass or retain approval.

## Apply the database migration

1. In the same Supabase project's SQL Editor, run any unapplied migrations 017 and
   018 first. Do not rerun migrations already installed.
2. Open [019](../supabase/migrations/202610100019_production_registration_seals.sql),
   copy the **entire file**, and run it once as postgres. “Success. No rows returned”
   is the expected installation result.
3. Run [verify-production-seals.sql](../supabase/verify-production-seals.sql).
   Every result should be true. This verification is read-only.

Migration 019 is now installed by the project owner, who reported every read-only
verification result true. Do not rerun it. No real stock or approval was created
automatically by the implementation.
Existing development stock remains development stock and cannot become genuine
production issuance merely by editing a draft.

## Backend configuration

In backend/.env configure these three server-only settings together:

```dotenv
AUTOGUARDIAN_SEAL_ORIGIN=https://YOUR-ACTUAL-VERIFICATION-HOST
AUTOGUARDIAN_SEAL_ACTIVE_KEY=v1
AUTOGUARDIAN_SEAL_KEYS_JSON={"v1":"YOUR-64-HEX-CHARACTER-RANDOM-SECRET"}
```

The origin must be exact HTTPS, without path/trailing slash. Generate an independent
32-byte cryptographically random secret for each key version; do not use the example
marker or an evidence/Auth key. Keep secrets out of mobile settings and git. Retain
old versions while printed labels using them remain valid. Missing settings return
SEAL_SIGNING_SETUP_REQUIRED for issuance/scanned inspection, rather than mock success.
The eventual public verification landing page is part of the consumer integration;
this task provides authenticated signature/stock verification without exposing a
public private-record endpoint.

From backend/ run `npm.cmd run build`, restart the existing backend, then
`npm.cmd start`. Do not start a second instance on an already occupied port.

## API sequence

All routes require a real bearer session with fresh password/TOTP proof. Changes
require a UUID Idempotency-Key header; keep the identical body/key after an uncertain
network outcome. GET/POST responses are no-store. Issuance, inspections, revocations
and confidential inspection reads have append-only records under forced tenant RLS.

1. Administrator: POST /v1/registration-seals/batches with this exact shape:

```json
{"organizationId":"ACTUAL-ORGANIZATION-UUID","agentId":"ACTUAL-AGENT-PROFILE-UUID","manufacturer":"Actual manufacturer","batch":"Actual batch reference","type":"STANDARD","quantity":4,"manufacturedOn":"2026-10-10","physicalBatchConfirmed":true}
```

The response supplies the generated readable codes and signed QR URLs for physical
printing. Retrying the same key/body returns the original IDs, not another batch.
ALARM classification remains confined to authorized operational data.

2. Agent: use existing fitting and location APIs to save the assigned IDs, four
   distinct SEAL_FITTING_PHOTO attachments, and four actual location descriptions.
   For no-seals, save package NONE with empty placements. Production encrypted
   upload/wizard configuration remains a separate integration dependency.
3. Inspector: use the existing independent review API to read/accept each fitted
   photo, then GET /v1/registration-seals/DRAFT-UUID/inspection. Use its current
   draftRevision, snapshotRevision and inspectionRevision in the next request.
4. Inspector: POST to that inspection route with action APPROVE or REJECT:

```json
{"expectedDraftRevision":1,"expectedSnapshotRevision":12,"expectedInspectionRevision":0,"action":"APPROVE","placements":[{"position":1,"location":"OTHER","comment":"Exact saved actual location description","qrUrl":"Actual signed URL scanned from this fitted seal","idMatches":true,"undamaged":true,"vehicleMatches":true,"safeSurface":true}]}
```

Supply four distinct positions for a sealed approval, not the single explanatory
example entry. NONE approval and REJECT use empty placements. A reject removes the
trusted seal confirmation; an old approval retry returns the current rejected state.
PhysicalVerified is calculated by the server, never accepted from request data.
5. POST /v1/registration-seals/verify with `{"qrUrl":"ACTUAL-SIGNED-QR-URL"}`
   verifies the HMAC and scoped issuance record. It returns status/availability,
   without alarm type, owner or private placement details.
6. Administrator: POST /v1/registration-seals/revocations with
   `{"code":"ACTUAL-READABLE-CODE","reason":"DAMAGED"}`. Allowed reasons are
   DAMAGED, REPLACED, LOST and FRAUD. Old QR codes remain recognizably revoked.

The existing registration reviewer and finalizer recheck current seal approval.
Changed fitting/evidence/snapshot, a later rejection, revoked stock, a withdrawn
location preset, or superseded photo acceptance blocks approval/activation.
Finalization consumes the four stock records to ACTIVE in the same transaction as
vehicle/ownership activation. Phone, consent, evidence, payment and independent
registration approval retain their separate prerequisites.

## Acceptance retained for the end

Local tests verify real HMACs and database behavior, not manufacturing or a device.
At final acceptance use separate agent, inspector and owner accounts; scan printed
QRs on Android and verify actual mounting/photo matches, tenant isolation, expiry,
damaged/duplicate/revoked IDs, concurrent edits and ambiguous retries. Do not treat
synthetic provider receipts in local activation tests as a configured payment/SMS
provider. Full audit chaining/retention and stock reconciliation remain later work.
