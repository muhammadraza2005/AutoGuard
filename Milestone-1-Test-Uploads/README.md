# Files to upload during Milestone 1 testing

These are conspicuously synthetic fixtures for an isolated test environment. They
are not real IDs, registration papers, vehicle photographs or issued physical seals.
Do not approve them as genuine production evidence.

Use a new test draft with chassis **AG-M1-TEST-0001**, plate **AG-TEST-001**, category
**CAR**. Use the controlled test owner's account; fixture text uses **Synthetic
Owner 001 / TEST ID 0001**. Enter that account's actual controlled test phone in
the form, not a made-up phone number. A second draft with the same chassis/plate
should fail the duplicate check. Use a different suffix for subsequent fresh runs.

| Upload field | Exact file |
| --- | --- |
| Owner ID | 01-owner-id.jpg |
| Registration document | 02-registration-document.pdf |
| Vehicle front | 03-vehicle-front.jpg |
| Vehicle rear | 04-vehicle-rear.jpg |
| Vehicle left | 05-vehicle-left.jpg |
| Vehicle right | 06-vehicle-right.jpg |
| Chassis photo | 07-chassis-number.jpg |
| Plate photo | 08-number-plate.jpg |
| Seal photo, position 1 | 09-seal-position-1.jpg |
| Seal photo, position 2 | 10-seal-position-2.jpg |
| Seal photo, position 3 | 11-seal-position-3.jpg |
| Seal photo, position 4 | 12-seal-position-4.jpg |

Optional-purchase-proof.pdf is an alternative to the registration document. Use
only one of them for the first normal run. Choose package NONE to test a registration
without seals; then skip all four fitting photos. For sealed packages use actual
issued test-stock codes from the app/database; these images do not invent codes.

Negative-tests/duplicate-seal-photo.jpg is identical to position 1: using it for
another position should fail the duplicate-photo check. Negative-tests/invalid-document.pdf
should be rejected. A valid document PDF is also invalid in a fitting-photo field.

manifest.json records the accepted evidence kinds and normalized hashes. Every
positive file is screened by the actual backend evidence parser when generated.

At final manual testing verify upload/reopen/PDF display, both languages, owner/vehicle
edits, separate agent/reviewer/owner permissions, corrections, retries and duplicate
checks. Synthetic files exercise the workflow, not real-world evidence authenticity.
Payments are deferred to Milestone 3 and phone OTP/SMS to Milestone 2; their live
activation gates must not be treated as passed during these tests.
