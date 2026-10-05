# Local Android setup

The React Native/Expo packages are installed inside `mobile/node_modules`.
The native toolchain is project-local under ignored `.tools/`, with launchers that
set environment variables for the current process. The system Java installation
and PowerShell execution policy are not changed.

Installed components for this project:

- Temurin OpenJDK 17 (official Adoptium download, SHA-256 verified).
- Google's Android command-line tools (official download, SHA-256 verified).
- Android SDK Platform 36, Build Tools 36.0.0 and platform-tools/adb.
- Android Emulator binary, NDK 27.1.12297006 and CMake 3.22.1.
- Gradle through Expo's generated Android wrapper.
- Expo-compatible `expo-system-ui` for native light-interface configuration.
- Project-local Ninja upgraded from 1.10.2 to 1.13.2 for Windows long-path support
  during the client APK build. The original is backed up beside the SDK executable.
  Official archive SHA-256: `07fc8261b42b20e71d1720b39068c2e14ffcee6396b76fb7a795fb460b78dc65`.

`mobile/android` is generated and ignored. Regenerate it with
`npx.cmd expo prebuild --platform android --no-install` after native configuration
changes. Finish regeneration before starting Gradle, because builds hold generated
files open. Do not edit generated Android files by hand.

## Run on a phone

Connect an Android phone with USB debugging enabled and approve its computer
connection on the phone. Then double-click `Android App.cmd` to build, install and
start the app. The first native build downloads Gradle/Maven dependencies and can
take a while. No Expo account or cloud build is required.

SQLCipher is configured, so the full native target is a custom development build.
Expo Go is not sufficient to validate this app's native storage configuration.

An emulator additionally needs a downloaded Android system image and an AVD.
Installing the emulator executable alone does not create a virtual phone. A USB
phone can be used without either of these. Windows cannot build iOS locally.

The acceleration check currently reports: `Android Emulator hypervisor driver is
not installed on this machine`. No AVD/system image or hypervisor driver was
installed in this setup. `adb devices` reports no connected Android phone.
Native runtime acceptance remains pending a device or finished emulator setup.

For the immediate browser preview, use `Preview App.cmd` or http://localhost:8081.
No physical Android device has been tested during this review.

Setup references: [Expo Android setup](https://docs.expo.dev/workflow/android-studio-emulator/),
[Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/),
[Android tools](https://developer.android.com/studio#command-tools).
