# Registration consent wording — final organization details pending

Prepared 10 October 2026. The project owner delegated security choices: use
password plus authenticator TOTP and direct owner-account consent. The workflow
is implemented; the wording below still needs actual organization details and
approval before publication. Existing sample consent remains a sample. SMS and
owner phone-possession verification remain in Milestone 2; their activation gate
must not be waived by this implementation.

## Information still needed from the project owner

Supply the operating organization's name, the registration authority's name,
a privacy/withdrawal contact and the approved retention policy. Then review the
completed English/French wording. No further security-method decision is needed.

## Implemented authentication

`backend/src/staffAuthentication.ts` verifies the JWT using Supabase getClaims
and checks the current Auth user/factors using getUser. It requires the configured
project issuer, authenticated audience/role, matching user ID, nonanonymous
identity, valid session UUID/expiry, confirmed email or phone, password proof,
aal2 and the explicitly configured verified factor. Authentication proofs have a
configured maximum age; token refresh alone does not count as reauthentication.
No password, code, factor secret or token is logged or persisted by this verifier.

Production routes now use the verifier and check the live Auth session, its
verified TOTP factor and password/TOTP timestamps. Both proofs expire after one
hour. Authorization still checks current tenant, roles, organizations and agent
accreditation. The new production entrypoint, trusted access/consent receipts,
staff setup/verification screen and direct owner consent screen are implemented.
See [setup and limitations](AGENT-ACCESS-CONSENT.md).

The existing five-step wizard and encrypted owner/evidence services remain
development preparation. The access/consent component supplies the production
entrypoint and gates; completing production seals/payments and configuring
production encrypted storage remain separate integration work. Existing samples
cannot be promoted. Development authentication is bound to the development tenant.

## Draft English consent — not approved

**Registration request**

I request registration of the vehicle identified in this application with
[REGISTRATION AUTHORITY]. I confirm that I have reviewed the vehicle details
in this application and that the information I provide is accurate.

**Use of registration information**

I authorize [OPERATING ORGANIZATION], its authorized registration staff and
[REGISTRATION AUTHORITY] to collect, store and review the owner details, identity
documents, registration or purchase documents, vehicle photographs and seal
records submitted for this application. These records are used to process and
review vehicle registration and support the vehicle-verification service.

People checking a vehicle receive only the information permitted for vehicle
verification. This consent does not authorize public disclosure of my identity
documents, private owner contact details or alarm-seal locations. Separate
operations requiring additional authorization must obtain that authorization.

**Records and withdrawal**

The retention period and handling of registration and audit records are described
in [APPROVED PRIVACY NOTICE / RETENTION POLICY]. I can withdraw this registration
consent before activation; the application will then remain blocked. For an
already activated registration, or questions about my data and withdrawal,
I can contact [PRIVACY / WITHDRAWAL CONTACT]. Withdrawal does not itself erase
records that must be retained under the approved policy.

I understand that accepting this text records consent for the displayed
application and wording version. It does not prove phone possession, verify my
identity documents or guarantee approval of registration.

## Draft French consent — not approved

**Demande d’immatriculation**

Je demande l’immatriculation du véhicule identifié dans ce dossier auprès de
[AUTORITÉ D’IMMATRICULATION]. Je confirme avoir vérifié les informations du
véhicule figurant dans ce dossier et l’exactitude des
informations que je fournis.

**Utilisation des informations d’immatriculation**

J’autorise [ORGANISME EXPLOITANT], son personnel d’immatriculation habilité et
[AUTORITÉ D’IMMATRICULATION] à recueillir, conserver et examiner les informations
du propriétaire, les pièces d’identité, les documents d’immatriculation ou
d’achat, les photographies du véhicule et les données des scellés transmis pour
ce dossier. Ces données servent à traiter et examiner l’immatriculation et à
assurer le service de vérification du véhicule.

Les personnes qui vérifient un véhicule reçoivent uniquement les informations
autorisées pour cette vérification. Ce consentement n’autorise pas la divulgation
publique de mes pièces d’identité, des coordonnées privées du propriétaire ou
de l’emplacement des scellés d’alarme. Les opérations distinctes nécessitant une
autorisation supplémentaire doivent obtenir cette autorisation.

**Conservation des données et retrait du consentement**

La durée de conservation et le traitement des données d’immatriculation et
d’audit sont décrits dans [NOTICE DE CONFIDENTIALITÉ / POLITIQUE DE CONSERVATION
APPROUVÉE]. Je peux retirer ce consentement avant l’activation ; le dossier
restera alors bloqué. Pour une immatriculation déjà activée, ou pour toute
question concernant mes données et le retrait du consentement, je peux contacter
[CONTACT CONFIDENTIALITÉ / RETRAIT]. Le retrait n’efface pas automatiquement les
données dont la conservation est requise par la politique approuvée.

Je comprends que l’acceptation de ce texte enregistre mon consentement pour le
dossier affiché et cette version du texte. Elle ne prouve pas la possession du
téléphone, ne valide pas mes pièces d’identité et ne garantit pas l’approbation
de l’immatriculation.

## Required behavior for the final consent workflow

- Publish immutable, approved English/French versions with a content hash and
  tenant scope. Never change accepted wording in place or publish placeholders.
- Present the actual vehicle/application and selected text to the authorized
  owner/representative. Validate who is entitled to act for a company; a name
  typed by the agent does not establish representation authority.
- Save the consent actor, method, text/hash/version/language, server time and
  owner/application context in append-only records. Reject stale wording/context,
  unapproved methods, cross-owner claims and ambiguous retries.
- Allow withdrawal before activation even after submission. Preserve the audit
  history and block activation immediately. Reconcile any already activated
  vehicle through the approved administrative procedure.
- Bind acceptance to the owner/application identity. Vehicle/owner changes that
  alter what was agreed require fresh consent; unrelated review/payment records
  must not falsely establish consent.
- Produce only the CONSENT and AGENT_AUTHENTICATION prerequisite codes through
  narrowly authorized functions. Do not issue OWNER_PHONE confirmations here.

Provider references used for the implementation:
[getClaims verification](https://supabase.com/docs/reference/javascript/auth-getclaims),
[JWT claims](https://supabase.com/docs/guides/auth/jwt-fields),
[MFA](https://supabase.com/docs/guides/auth/auth-mfa).
