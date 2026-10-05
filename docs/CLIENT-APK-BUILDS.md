# Numbered client APKs

Keep developing on `main` (or normal feature branches). A new branch per APK is
unnecessary: a branch can move as work continues. When a delivery's source is
committed, use an annotated Git tag such as `apk1` or `apk2` to mark that exact
commit. Keep the repository private and send the APK directly to the client.
Private GitHub Release assets are also an option if the recipients have access.

## Build the next delivery

From the project root on this Windows computer:

```powershell
cmd.exe /c "Build Client APK.cmd" 1
# For the next requested delivery:
cmd.exe /c "Build Client APK.cmd" 2
```

Double-clicking `Build Client APK.cmd` defaults to APK1. Existing numbered APKs
are never overwritten; choose the next number. The launcher uses a process-local
PowerShell execution-policy override; it does not change system execution policy.
The first native build can download dependencies and take several minutes.

Outputs are saved under `releases/`:

- `Auto Guardian APK1.apk`: the installable file to send.
- `Auto Guardian APK1.apk.sha256`: checksum.
- `Auto Guardian APK1.apk.build.json`: build date, source commit, uncommitted
  change status, package identity, version code, architectures and checksum.

These generated files are ignored by Git. Keep copies of delivered APKs, their
metadata, and the corresponding committed source. A source commit in metadata
with `sourceHasUncommittedChanges: true` is a baseline, not a complete source
snapshot. Commit reviewed build tooling/app changes before tagging that delivery.
The build script does not commit, tag, push, or publish anything.

## What the review app does

The current app is a partial interactive frontend prototype. Real authentication,
backend operations, payments, notifications and encrypted offline persistence
are unfinished; see [the frontend audit](FRONTEND-AUDIT.md).

The review app embeds a development JavaScript bundle and all assets in an Android
native release container. This retains the existing `__DEV__` checks, synthetic
identities and visible preview banner. Native release libraries avoid the Expo
development launcher and do not need your PC, Expo Go, or a Metro server. The
build script clears public API/Supabase configuration and disables dotenv loading;
existing service guards reject live calls in demo mode. Do not enter real PINs,
vehicle documents or identity data into the prototype.

Review builds use `com.autoguardian.mobile.review`, app label `Auto Guardian APKN`,
and increasing Android version code N. Each subsequent numbered APK can update
the same review app. APKs use the generated local Android debug certificate for
prototype distribution; production needs its own protected release signing key.
The normal app keeps `com.autoguardian.mobile` and production fixture restrictions.
Expo prebuild restores the normal native configuration when the script finishes.

Android ARM 64-bit and 32-bit phone libraries and x86_64 emulator libraries are
included. SDK 57's configured minimum is Android 7 (API 24); actual target-device
compatibility still requires testing. This file is for Android, not iPhone.

## Client installation and review

Send only the APK file. The client opens it on Android and allows installation
from the app used to receive it when Android prompts. Open `Auto Guardian APK1`
from the app drawer. The review starts with synthetic consumer data. Use
**Account > Preview section** to explore agent, institutional and administration
screens; Account also offers English/French selection.

APK2 and subsequent deliveries install over the review app if the signing
certificate and package identity stay the same and the version code increases.
The review number labels a delivery; it does not imply additional completed
features. Record each week's changes and remaining limitations with the APK.

An APK does not include your editable repository, but compiled app code and
assets can be inspected or reverse engineered. Sending APKs is a useful review
workflow, not a guarantee against copying.

References: [Git tags](https://git-scm.com/book/en/v2/Git-Basics-Tagging),
[Expo APK distribution](https://docs.expo.dev/build-reference/apk/),
[local Android builds](https://docs.expo.dev/guides/local-app-production/),
[SDK 57 support](https://docs.expo.dev/versions/v57.0.0/).
