# AutoGuardian Supabase Data and Infrastructure Plan

Planning date: 4 October 2026. This is a proposed database, authentication and storage plan. No Supabase project, migration, bucket or production credential has been created.

## 1. Scope and selected direction

The requirements source is `AutoGuardian — Software Requirements Specification (EN).docx`, dated 2 October 2026, especially sections 4–5 and 7–14. **One React Native mobile app with role-based consumer, agent, institutional and administration sections**, English-first designs, Supabase and a single product plan without release labels are the user's selected directions. Functional capabilities remain represented; separate mobile apps and desktop websites are outside the current target. This delivery-format change from the SRS is recorded under D01 in `backend.md` for client reconciliation. Agreements and unresolved rules remain dependencies.

Use Supabase for PostgreSQL, phone authentication and private object storage. The proposed NestJS API and worker processes enforce domain workflows, provider integrations, sensitive-read auditing and authorization. Supabase is not a free substitute for SMS/USSD delivery, payment processing, an application host, workers or a backup service.

Proposed implementation details below are not final database DDL. Resolve the shared D01–D12 decision register in `backend.md` before freezing affected constraints, authentication rules or production configuration.

## 2. Free-tier development and production limits

Starting development on Free is the user's preference. Real phone OTP still needs a separate SMS provider or custom Send SMS Hook; delivery costs and DRC coverage must be confirmed. Use explicit development test numbers/provider mocks for local tests; never enable a bypass for real production accounts. [Phone sign-in](https://supabase.com/docs/guides/auth/phone-login), [Send SMS Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook).

The official pricing page currently lists 500 MB database storage, 1 GB file storage, no automatic backups, inactivity pausing, and a limit of two active Free projects. Those limits make Free a development starting point, not evidence that the SRS's photo volume, daily encrypted backups, availability and capacity targets are met. Recheck limits and costs at implementation. [Supabase pricing](https://supabase.com/pricing).

Primary phone OTP and phone second-factor MFA are different. Phone MFA is a paid feature; role-specific password/OTP and institutional two-factor requirements need an approved implementation. The source's SMS-for-everyone wording cannot be silently replaced with a cheaper factor. Session expiry and remote revocation may also require backend controls when native plan features are unavailable. See D04 and D12.

Proposed environments are local development, isolated staging and production. Local development can use the Supabase CLI and a local container runtime after setup. Cloud staging/production need separate projects, keys, buckets and provider credentials; Free project limits do not remove the requirement for environment separation.

Choose the production region only after authority data-localization requirements are known. A hosted region selection alone is not proof of legal compliance. Self-hosting or another deployment arrangement may be necessary if hosted regions cannot satisfy the authority; do not promise a DRC location without verifying one. [Region documentation](https://supabase.com/docs/guides/platform/regions).

## 3. Schemas and identity boundaries

Proposed schemas:

| Schema | Contents | Client access |
| --- | --- | --- |
| `auth` | Supabase-managed identities, credentials, sessions and factors | Auth API only; no custom client SQL |
| `app` | Authorities, relationships, vehicles, seals, workflows and billing metadata | Backend database role only |
| `private` | Owner identity, document references, PIN hashes and exceptional access records | Restricted backend functions/repositories |
| `audit` | Immutable events and integrity checkpoints | Restricted append/read procedures |
| `ops` | Proposed outbox, idempotency and provider processing metadata | API/workers with narrowly scoped privileges |
| `storage` | Supabase-managed bucket/object metadata | Storage API under approved policies |

Keep domain schemas out of exposed Data API schemas. Revoke default anonymous/authenticated grants rather than relying on schema names alone. If the application does not need the Data API, disable it while retaining the required Auth/Storage services. No consumer SDK writes directly to the domain tables. [Securing Supabase data](https://supabase.com/docs/guides/database/secure-data).

**Proposed normalization:** Supabase auth identities are global to a project, while an application user profile/membership belongs to an authority. A single verified phone identity can have multiple tenant profiles and multiple role assignments without exposing one authority's records to another. Tenant-owned `user_id` relationships reference that authority's profile, linked to `auth_user_id`.

The SRS describes User.phone as unique and assigns tenant metadata to entities. Resolve that combination with a global verified-phone identity plus scoped profiles; do not create independent conflicting phone credentials per authority. Keep the phone in its protected identity representation, not in public vehicle rows. Final mapping and account recovery must be reviewed before schema acceptance.

Business-role assignment is separate from the PostgreSQL/Supabase database roles `anon`, `authenticated` and `service_role`. Client-editable auth user metadata never grants a business role. All app sections share the same identity and scoped database; a section switch must recheck current role/scope and required authentication strength. It does not create a second account or grant new access.

## 4. Base columns and conventions

Every tenant-owned domain entity includes `id` UUID, `tenant_id`, `created_at`, `updated_at`, `created_by` and nullable `deleted_at`, following SRS section 9. Provider-managed auth rows, the Tenant root and proposed global platform infrastructure need explicit exceptions rather than a fabricated parent tenant. Immutable audit entries never change their update/delete fields after append.

- Store timestamps as UTC `timestamptz`; display and calculate authority periods using configured time zones. The SRS proposes `Africa/Kinshasa` initially.
- Store category, status and operation values as controlled lists; reject unknown transitions server-side and through database write procedures where practical.
- Use `numeric` or integer minor units for money, with explicit currency and provider currency precision; do not use floating-point amounts.
- Normalize international phone numbers and vehicle identifiers under documented rules; do not assume every chassis number has a modern fixed VIN length.
- Use typed columns for searchable identifiers/statuses/relationships. Use JSONB for settings, template parameters and minimized variable metadata, not as a substitute for referential integrity.
- Composite `(tenant_id, id)` keys/foreign keys prevent a tenant-A child from referring to tenant-B domain data.
- Logical deletion is the default. Legally required erasure is an audited, retention-aware exception. Do not set the source's proposed ten-year retention as a legally approved policy.
- Append versioned configuration history with `valid_from`, version and author. Bind operations to the applicable setting/template/pricing version so changes affect new operations only.

## 5. Required domain entities

Names below are proposed SQL names for the SRS entities. Additional normalization does not add product functionality.

| SRS entity | Proposed table | Main fields and relationships |
| --- | --- | --- |
| Tenant | `app.tenants` | FR/EN name, acronym, country, currency, time zone, phone prefix, logo reference, colors, default/active languages, status |
| TenantSetting | `app.tenant_settings` | Key, JSONB value, version, valid_from, changed_by; immutable versions |
| User | `app.users` with protected identity fields in `private` | Tenant profile, auth_user_id, email/phone reference, preferred_language, status, last_login_at; names and pin_hash private |
| Role assignment | `app.role_assignments` | user_id, role, tenant/org scope, granted_by, valid_from/to |
| Organization | `app.organizations` | Type, name, trust level, contract reference, status |
| Agent | `app.agents` | user_id, organization_id, accreditation number/status/times, suspension reason |
| Owner | `private.owners` | Tenant user or legal entity, company/registration details, ID type/number and protected document references |
| Vehicle | `app.vehicles` | Unique chassis identifier, current plate, category/make/model/year/color, photo references, sale/record statuses, trust level, seal_package |
| Ownership | `app.ownerships` | vehicle_id, owner_id, start_at, end_at, source; current owner through active relationship |
| BackupContact | `app.backup_contacts` | owner_id, user_id, invitation/acceptance, can_respond_to_alerts, can_report_missing; revocation metadata proposed |
| SaleMandate | `app.sale_mandates` | vehicle_id, mandatary_user_id, start_at/end_at/revoked_at; acceptance proof proposed |
| Enrollment | `app.enrollments` | vehicle_id, agent/org, document references, review state/reviewer, location_label |
| Seal | `app.seals` | code/signature, key version proposed, type, batch/manufacturer, status, org/agent assignment |
| SealPlacement | `app.seal_placements` | seal/vehicle, position/photo, placed_by/at, revoked_at/reason |
| VerificationRequest | `app.verification_requests` | Nullable vehicle_id, verifier, channel, query type/value, scanned seals/result, payment, status/result, expiry |
| OwnerAlert | `app.owner_alerts` | verification relationship, recipient, channel, sent/delivered/read times, grouped_count |
| OwnerResponse | `app.owner_responses` | alert/request relationship, responder, YES/NO, channel, server response time |
| MissingReport | `app.missing_reports` | vehicle, reporter/time, incident time, police reference, lifted_at/by/reason |
| OwnershipTransfer | `app.ownership_transfers` | vehicle, old/new owner reference, initiator, buyer/seller confirmations, registry validator, status |
| ClearanceToken | `private.clearance_tokens` | vehicle, operation, requesting org, token_hash, issued/expiry/used timestamps, refusal reason |
| Incident | `app.incidents` | Type, priority, vehicle/seal, description, state, assignee and resolution |
| Subscription | `app.subscriptions` | Vehicle, plan, annual price, installments, period and status |
| Payment | `app.payments` | Payer, purpose, amount/currency/method, provider reference, status/refund time |
| ProPackage | `app.pro_packages` | User/org, total/used credits, valid_until |
| RevenueShare | `app.revenue_shares` | Payment, beneficiary, amount and settlement time |
| Notification | `app.notifications` | Recipient, template/version, language/channel, minimized payload, delivery state/provider reference |
| MessageTemplate | `app.message_templates` | English key, language/channel/text, version |
| Consent | `app.consents` | User, consent type/version, accepted/withdrawn timestamps |
| AuditLog | `audit.events` | Actor/role, action/entity/id, minimized before/after, reason/channel/IP, server timestamp and hash chain |

Proposed supporting tables needed to implement the required workflows:

| Supporting table | Purpose |
| --- | --- |
| `app.vehicle_plate_history` | Retain plate changes without overwriting history |
| `app.seal_batches` and `app.seal_allocations` | Manufacturer batches, stock ownership and assignment history |
| `private.documents` | Private object references, evidence type, owner/enrollment link, checksum and access classification |
| `app.vehicle_photos` and `app.seal_positions` | Typed vehicle/placement photos and category-specific positions |
| `ops.enrollment_drafts` and `ops.sync_operations` | Server-side staged metadata, client operation IDs, attachment state and replay resolution |
| `app.alert_groups` and `app.alert_group_members` | Group delivery while retaining individual verification binding |
| `app.verification_usage` | Atomic monthly allowance/daily cap accounting and reservations |
| `app.subscription_installments` | Individual due dates/amounts, payment application and grace tracking |
| `app.refunds`, `app.reconciliation_runs`, `app.reconciliation_items` | Refund reason/provider state and daily discrepancy records |
| `app.cash_collections` and `app.cash_remittances` | Conditional organization cash tracking when enabled |
| `app.connector_configurations` and `ops.connector_exchanges` | Adapter/config versions, secret references and minimized exchange outcomes |
| `app.api_accounts` and `app.webhook_subscriptions` | Institutional client/org scopes, allow-lists and partner events |
| `ops.outbox_events`, `ops.provider_events`, `ops.idempotency_records` | Durable tasks, callback replay protection and request deduplication |
| `private.action_challenges` and `private.session_controls` | Action-bound PIN proof, application revocation and attempt limits |
| `audit.checkpoints` | Chain validation references and separately protected checkpoint receipts |

Do not store card numbers/CVV, plaintext PINs, OTPs, provider credentials or raw clearance tokens in business tables. Protect HMAC signing keys in the secret manager; the printed QR signature is not the secret key. Some connector exchange records may need encrypted restricted evidence, but redact before general operational logging.

## 6. Source enums and lifecycle enforcement

| Field | Source values |
| --- | --- |
| sale_status | NOT_FOR_SALE, FOR_SALE, AGENT_SALE, REPORTED_MISSING |
| record_status | PENDING_REVIEW, ACTIVE, SUSPENDED_UNPAID, BLOCKED, ARCHIVED |
| verification_status | CREATED, PAID, OWNER_NOTIFIED, BACKUP_NOTIFIED, CONFIRMED, DENIED, NO_RESPONSE, EXPIRED |
| seal_status | IN_STOCK, ACTIVE, REVOKED, DESTROYED |
| seal_package | NONE, STANDARD, ONE_ALARM, FOUR_ALARMS |
| seal_type | STANDARD, ALARM |
| subscription_status | ACTIVE, DUE, GRACE, SUSPENDED, CLOSED |
| clearance operation | REGISTRATION, INSURANCE, TRANSFER |
| vehicle category | Motorcycle, ketch, car, light commercial; exact English SQL codes to be finalized |

The SRS does not define every transition for record/payment/transfer/review state or the unknown/free verification path. Do not invent those as source enums. Resolve D09 and document any approved additions before writing migrations.

A UI label such as “local draft,” “payment pending” or “needs sync” describes workflow state and is not automatically a new vehicle record enum. Subscription suspension must not remove the vehicle from safe verification or suppress owner alerts.

## 7. Integrity constraints indexes and atomic operations

Required integrity:

1. Global chassis/VIN uniqueness according to BR-01 and the source model; cross-tenant duplicate errors must reveal no other owner's identity.
2. Active plate uniqueness according to BR-11. Approve the country/registry namespace before defining the final index; do not silently allow the same active record to be duplicated under another authority. Retain plate history.
3. At most one active ownership per vehicle, with transactional activation guaranteeing exactly one for an active vehicle. A partial unique index alone enforces only “at most one.”
4. One live placement per seal, no reactivation after revocation, and the required four placements for sealed packages at activation. Stock consumption and placements must be atomic.
5. Tenant-consistent foreign keys for every domain relationship; role scopes and organization allocation cannot point across authorities.
6. Unique idempotency keys scoped to tenant, actor and operation with a stored request hash; replaying a key with different input is an error.
7. Unique provider event identity/reference in the provider's proper account namespace; duplicated callbacks cannot create duplicate payment/usage/share effects.
8. One effective response per verification; response versus timeout handled under a lock with authoritative server time.
9. One token consumption with an atomic conditional update, bound org/operation and valid deadline. Store hash only.
10. Immutable setting/template history, append-only audit and reason requirements for specified actions.

Proposed indexes: tenant/status/update-time vehicle lists; current and historical plates; VIN; tenant/verifier/time checks; recipient/pending-deadline alerts; tenant/status/priority incidents; org/status seal stock; tenant/actor/entity/time audit retrieval; provider reference and payment state; token hash/expiry; ownership vehicle/end_at; outbox availability/status.

Use short PostgreSQL transactions for enrollment activation, owner response, missing reporting, transfer, token consumption, quota/credit consumption, payment accounting and setting-version creation. Do not hold a transaction while waiting on SMS, payment or an external registry. Retain durable outbox entries within the same transaction as the domain change, then dispatch after commit.

Load-test real query plans on synthetic 100,000-vehicle data and realistic bursts. Evaluate partitioning for high-volume audit/verification/notification histories when measurements justify it. Preserve uniqueness and retention guarantees when partitioning; do not partition first merely for appearance.

## 8. Row level security and backend access

RLS is defense in depth alongside API RBAC. Enable it for tenant tables and deny unscoped access. Client grants and policies must both be reviewed. Supabase service-role credentials bypass RLS and must never be treated as tenant-limited credentials. [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

Proposed database access pattern:

1. Migration/administrative credentials are separate from runtime credentials and never loaded into the mobile app.
2. The API uses a non-owner, non-superuser, non-BYPASSRLS database role with minimal table/function grants; apply FORCE ROW LEVEL SECURITY on appropriate domain tables.
3. The authenticated API resolves a current actor and permitted tenant/scope. Inside each transaction, it sets transaction-local verified tenant/actor context for policies. Never trust a client-supplied tenant header by itself.
4. Policies enforce tenant isolation; sensitive repositories/functions enforce role, ownership, organization, consent, step-up and reason. SQL queries include explicit scopes as well as RLS.
5. Transaction-local context prevents pooled connections leaking prior tenants. Test missing context, mismatched actor and cross-tenant joins.
6. Worker credentials have only the functions/data needed for a validated tenant-scoped task. Cross-tenant administration uses explicit audited procedures rather than routine unrestricted runtime access.

If a privileged Supabase SDK call is needed for Auth administration or Storage operations, isolate it behind a server-only adapter and perform scope/permission checks first. Its service key bypasses relevant policy protections. Do not put it in an `EXPO_PUBLIC_*` or web-public environment variable.

Database role creation and deployment must be validated against hosted Supabase privileges during the foundation milestone. Choose the documented connection/pooler mode for the API/worker deployment; transaction pooling requires transaction-local context and connection-aware driver configuration. [Connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres).

| Actor | Data projection |
| --- | --- |
| Verifier/professional | Status, approved trust/inspection result and own transaction; no owner identity or alarm details |
| Owner | Current owned vehicle data and permitted personal history; after transfer, former-owner access is removed |
| Backup contact | Accepted relationship, delegated alert/report actions; no ownership privilege |
| Authorized seller | Accepted active mandate and allowed transfer initiation; no owner approval right |
| Agent | Enrollment evidence and seals within current accreditation/assignment; no blanket browsing of old identity records |
| Organization manager | Organization-scoped rights from the matrix |
| Police/registry | Mission/authority-scoped identity after logged reason and required authentication |
| Insurer | Insured-vehicle scope with explicit owner consent |
| Tenant admin | Authority-scoped rights, with reasons for identity access |
| Support/auditor | Source-specific masked/read-only projection; support refund capability is separately checked |
| Platform admin | Infrastructure/configuration and designated cross-tenant access; emergency procedure for personal data |

This is a summary, not a replacement for the complete SRS role/action matrix. Generate allow/deny cases from that matrix before implementation.

PostgreSQL RLS does not automatically audit SELECTs. Route personal-data/document reads through backend functions/gateway operations that require reasons and append the access event before returning data. Masking belongs in projection code or restricted views; never return raw rows and rely on the UI to hide fields.

## 9. Authentication setup plan

Enable phone login and configure provider/hook only in the intended environment. Verify hook authenticity and replay handling, redact OTP-bearing payloads, send localized messages and apply OTP request/verification limits. Supabase verifies primary OTP; backend authorization is still required for domain actions.

Enrollment phone verification is distinct from agent sign-in. The agent workflow must not retain or expose an owner's authenticated session after confirming phone possession. Invitations to backup contacts/sellers must be bound to the invitation and confirmed phone identity, not accepted merely by knowing an invitation UUID.

Public registration cannot grant OWNER, ENROLLMENT_AGENT or institutional roles. Privileged creation uses server-only administration and appropriate organizational approval. Phone change is an agent-assisted flow with proof and audit; do not expose a generic client phone-change shortcut that defeats BR-17.

Store PIN hashes and challenge state privately; verify server-side with lockout and action-bound expiry. Decide PIN recovery, SMS/USSD sensitive authentication, recent-SIM-change integration and exact role MFA under D04/D07/D08. Institutional API `client_credentials` needs a separate compatible OAuth service; Supabase's documented OAuth server does not support that grant. [OAuth flows](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows).

## 10. Private storage and attachments

Proposed private buckets:

| Bucket | Contents | Access rule |
| --- | --- | --- |
| `identity-documents` | Owner ID, registration certificate/purchase invoice and exceptional supporting evidence | Restricted audited evidence access |
| `vehicle-photos` | Vehicle/plate/chassis images | Scoped access; no blanket public photo listing |
| `seal-photos` | Installed seal evidence | Authorized operational inspection; confidentiality applied |
| `generated-documents` | Reports, receipts and certificates | Authorized recipient and operation scope |

Authority branding can use a separately scoped non-sensitive asset path after review; it must not share a publicly readable identity bucket. All sensitive buckets remain private. Private bucket access can use authenticated requests or temporary signed links; public bucket settings must never be applied to evidence. [Bucket guidance](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Storage access controls](https://supabase.com/docs/guides/storage/security/access-control).

Object paths use opaque tenant/entity/document UUIDs, not phone numbers, names or plates. Database references retain bucket/path/type/checksum/size and owning relationship; never persist a temporary URL as the canonical reference. Apply allowed MIME types, size limits, checksum validation, image compression and malware/content validation appropriate to uploaded evidence. Remove GPS EXIF metadata rather than introducing location collection.

The proposed upload flow obtains a narrowly authorized short-lived upload target, uploads/retries the file, then finalizes metadata after server validation. An unvalidated upload is staged and cannot activate enrollment. Cleanup of abandoned staging objects follows an approved retention rule; legally relevant accepted evidence is not deleted by a generic cleanup task. Within the shared app, encrypted agent drafts and attachment keys must remain isolated from ordinary consumer caches and other account/authority contexts, with appropriate locking on logout or privileged-section exit.

For especially sensitive identity evidence, use an audited backend download gateway so each disclosure is recorded and current permission is checked. Short-lived signed links for other approved assets are bearer capabilities until expiry; they are not instant permission-revocation guarantees. Keep TTLs short and never include them in public verification responses or general logs.

Verify encryption-at-rest for database, storage and backups under the approved deployment. If additional application-level encryption is required, approve key management/recovery and rendering implications before adding it. Encrypted offline agent attachments are a separate requirement from encrypted hosted objects.

## 11. Audit retention and recovery

Audit data includes every write and personal-data read, attributable actor/role, reason, channel, protected technical address, timestamp and chain hash. Restrict UPDATE/DELETE and append through a controlled routine with serialized chain order. Prefer per-authority chains with protected cross-authority administration records; final topology is a proposed implementation decision.

Anchor periodic checkpoints outside the mutable database in protected immutable storage. Hash chaining inside the same database cannot alone prevent a privileged administrator rewriting both records and hashes. Verification must detect missing/reordered/tampered entries and produce scoped judicial exports. Keep private values minimized or protected rather than duplicating identity documents into audit JSON.

Retention is configured only after legal validation: the SRS's ten years is a proposed default, not a legal conclusion. Cover vehicles, ownership history, identity evidence, payments/taxes, provider payloads, abandoned drafts, audit and backups separately. Versioned consent withdrawal must affect future insurer disclosure without erasing records that must legally be retained.

The SRS requires encrypted daily backups, monthly restore tests and recovery under four hours. Plan database, object bytes, auth-recovery configuration, private-schema data, role configuration, templates and relevant key recovery. Supabase database backups contain Storage metadata, not the object bytes; back up evidence objects separately. [Backup documentation](https://supabase.com/docs/guides/platform/backups).

On Free, arrange development exports because automatic backups are not included. Production backup design and hosting budget remain pending. Do not treat Redis as authoritative: recover durable work from PostgreSQL outbox/schedule records. Restore object references and files consistently, verify hashes/audit chains, restore custom role credentials securely and reconcile provider callbacks before resuming processing.

## 12. Migration and setup order

These are implementation steps for later, not commands executed during planning.

1. Confirm data location, chosen environment arrangement, global identity mapping and unresolved uniqueness/lifecycle rules.
2. Install/validate Node/npm, the Supabase CLI and local container runtime; create a local Supabase setup with synthetic data.
3. Create schemas, separate owner/runtime database roles and deny-default grants. Confirm the restricted runtime connection works with RLS and pooling.
4. Migrate authorities/settings/templates, tenant profiles, organizations/roles/agents, private identities and consent.
5. Migrate vehicles/plate history/ownership/enrollment, seal batches/placements and associated constraints.
6. Migrate verifications/groups/alerts/responses, missing/incidents, usage accounting and persisted deadlines.
7. Migrate subscriptions/installments/payments/shares/refunds/reconciliation/cash and pricing snapshots.
8. Migrate mandates/transfers/clearances, institutional accounts, connectors and webhook subscriptions.
9. Add private buckets/policies, document metadata, outbox/idempotency/provider-event records, audit/checkpoint procedures and indexes.
10. Apply reviewed seed values, configure development Auth/provider hooks, and run meaningful security/integrity checks.
11. Promote through staging with migration history and rollback/recovery planning; provision production only after host/provider/budget decisions and the planned acceptance checks.

Seed values must be labeled **SRS proposed defaults**: DRC/USD/`Africa/Kinshasa`/`+243`; FR and EN with French default; USD 2 verification; one free check/month; daily cap 20; motorcycle USD 18/year and car USD 40/year; 1/2/4 installments; 30-day grace; owner/backup delays 15/5 minutes; grouping 10 minutes; sale confirmation 24 hours; report validity seven days; mandate maximum 30 days; locks/connectors disabled. Seal prices, revenue splits and other missing values remain unset until supplied. Do not activate a ten-year purge/retention policy without legal validation.

## 13. Database storage and auth acceptance

Use SQL/integration tests for actual integrity and policy behavior, not tests that merely reproduce table definitions. Required checks include:

- Tenant A cannot read/write/link tenant B rows, even through nested joins, guessed UUIDs or an unscoped pooled connection.
- Public/verifier requests cannot retrieve private identities, PIN hashes, fitted alarm types, tokens or documents.
- Client-authenticated roles cannot write business status, payment, role or ownership tables directly.
- Active-owner and seal-placement invariants survive concurrent enrollment/transfer/replacement transactions.
- Duplicate plate/VIN attempts are blocked under the approved namespace and produce a privacy-safe incident.
- Verified payment callback replay cannot double-charge/apply credits/share/refund; conflicting idempotency input is rejected.
- Owner response versus deadline race has one result; group notification never grants another verifier's confirmation.
- Revoked seals cannot reactivate; concurrent token consumption succeeds once; wrong-org and expired tokens fail.
- Agent suspension blocks synchronization, and the required 90-day enrollment review flags are produced.
- Former-owner vehicle access and private-history disclosure are prevented after transfer; insurer consent withdrawal blocks future unauthorized access.
- Object bucket paths/URLs cannot expose another owner's evidence; identity disclosures create audit records and signed URL TTL behavior is understood.
- Auditing is append-only for runtime roles; tampering is detected against external checkpoints.
- Development test OTP/bypass settings cannot reach production.
- Database plus object restore is demonstrated within four hours with consistent evidence references and protected key recovery.

Run query/load tests at the source's initial capacity and monitor actual database/storage/egress/auth growth before selecting production resources. The presence of Supabase tables alone is not acceptance of the application.

## 14. Cross-file ownership

`frontend.md` owns the Stitch brief, screen states, localization presentation and React Native setup checklist. `backend.md` owns business rules, APIs, workers/provider behavior, milestones and the shared decision register. This file owns proposed schema/auth/storage boundaries, data integrity, policies, migrations and recovery. Keep all three consistent when a decision changes.
