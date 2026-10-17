# SPARSH.S Android App

A complete Android Studio project that loads the SPARSH.S portfolio as a WebView app.

## Features

- WebView wrapped version of https://sparshsinghal1618.github.io/profile/
- Offline fallback when internet is unavailable (loads `assets/offline.html`)
- Adaptive app icon and splash-like background
- Supports back navigation inside the WebView
- Open external links in the system browser
- Theme colors match the site

## Build requirements

- Android Studio (Giraffe or newer recommended)
- Android SDK (min compileSdk 34; included with Android Studio)
- Java/Kotlin — Android Studio provides these

## Building

1. Open Android Studio → "Open an Existing Project" → select `C:\Users\spars\Documents\GitHub\profile\android`
2. Let Gradle sync. Android Studio will download dependencies as needed (uses the included Gradle wrapper).
3. Select `app` configuration → Run on a device/emulator or Build → Generate Signed APK / Bundle.
4. For a quick sideload: Build → Make Project, then look in `app/build/outputs/apk/debug/` for `app-debug.apk`.

## Notes

- The app loads the live site with offline fallback (not bundled). Updates to the site appear automatically when the user is online.
- The installable PWA is already live at https://sparshsinghal1618.github.io/profile/ — users on Android can also "Add to Home Screen" directly.
- All files are reversible; delete the `android/` directory if you don't want it.
- The site also includes `manifest.webmanifest`, `sw.js`, and an install prompt (bottom-left) for PWA installation.
