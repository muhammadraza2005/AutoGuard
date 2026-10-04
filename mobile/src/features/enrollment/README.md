# Enrollment module
Gemini implements the role-scoped UI from frontend.md section 6. Native dependencies are installed, not an implemented offline system.
SQLCipher is enabled in Expo config. Do not open a database without generating/protecting a random key and verifying cipher support.
Attachment encryption, EXIF stripping, tenant isolation, sync/idempotency and logout cleanup remain to implement before accepting private documents.
Until those exist, keep preview drafts synthetic and in memory. Never label a draft enrolled, protected or encrypted merely because the plugin is configured.

