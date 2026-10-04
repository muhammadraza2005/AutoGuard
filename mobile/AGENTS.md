This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## AutoGuardian project scope

This is the app foundation for Gemini's frontend implementation. Read ../frontend.md,
../backend.md, ../supabase.md, ../docs/STITCH-REVIEW.md and
../docs/GEMINI-FRONTEND-PROMPT.md before implementing product flows.

Use npm and package-lock.json. On Windows use npm.cmd/npx.cmd; PowerShell currently
blocks the npm.ps1 launcher. Do not alter system execution policy.

One app contains consumer, agent, institutional and administration sections.
The current section grants are UI projections, not the final business-role matrix.
Live mode has no session until genuine server authentication/grants are integrated.
Development previews must remain behind __DEV__ and must not perform live requests.
Do not let public metadata or a role picker grant production permissions.

Use the Clean Trust design and canonical theme tokens. The primary consumer/owner
PNG and HTML pairs are now in ../two screens/stitch_autoguardian_unified_mobile_app/.
Their PNGs are visible; only the original export's consumer/owner PNGs are transparent.
Institutional PNG is stale; prefer its revised HTML and the review.
Stitch HTML is only a visual reference. Do not overwrite source exports/plans.

Do not present mock payment/PIN/OTP success as server confirmation. No buyer owner
identity or alarm positions. No tracking, marketplace, OCR/NFC or invented legal claims.
No private drafts or documents until database AND attachment encryption are verified.
SQLCipher plugin configuration alone is not working offline storage.

Keep src/app for routes and src/features for product implementation. UI copy uses
English-keyed French/English resources. No deployment or external service setup
is authorized by the frontend handoff.

Run npm.cmd run typecheck, npm.cmd run lint, npm.cmd test and compatibility checks.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
