# Zentru - Release Guide

## Prerequisites
- Node.js 18+
- For Android: JDK 21 + Android SDK
- For iOS: Mac + Xcode 15+ + Apple Developer Account ($99/yr)

## Build Web Assets (both platforms)
```bash
npm run build
```

---

## Android (Google Play)

### 1. Generate Signing Key (one-time)
```bash
keytool -genkey -v -keystore zentru-release.keystore -alias zentru -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Sync & Build
```bash
npx cap sync android
cd android
./gradlew assembleDebug       # Debug APK for testing
./gradlew bundleRelease        # Release AAB for Play Store
```

### 3. Upload to Google Play Console
1. Go to https://play.google.com/console
2. Create app → Fill store listing
3. Upload AAB → Add privacy policy URL
4. Submit for review

### Quick Test APK
```bash
export JAVA_HOME="path/to/jdk21"
export ANDROID_HOME="path/to/android/sdk"
cd android && ./gradlew assembleDebug --no-daemon
```
APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## iOS (App Store)

### Option A: With Mac
```bash
npx cap sync ios
npx cap open ios              # Opens Xcode
```
In Xcode: Select team → Build → Archive → Upload to App Store Connect

### Option B: Without Mac (Codemagic CI)
1. Push code to GitHub
2. Sign up at https://codemagic.io
3. Connect your repo
4. Add Apple certificates & provisioning profiles
5. Configure build: `npx cap sync ios && xcodebuild ...`
6. Codemagic builds IPA on cloud Mac
7. Upload to TestFlight / App Store automatically

### iOS Certificates Required
- Apple Developer Account ($99/year)
- Distribution Certificate (.p12)
- Provisioning Profile (App Store)
- Push Notification certificate (for notifications)

### Codemagic codemagic.yaml (example)
```yaml
workflows:
  ios-release:
    name: iOS Release
    environment:
      xcode: latest
      node: 18
      ios_signing:
        distribution_type: app_store
        bundle_identifier: com.tpaigames.zentru
    scripts:
      - npm install
      - npm run build
      - npx cap sync ios
      - xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release archive
    artifacts:
      - build/ios/ipa/*.ipa
    publishing:
      app_store_connect:
        auth: integration
```

---

## Version Bump
- Android: Edit `android/app/build.gradle` → `versionCode` + `versionName`
- iOS: Edit in Xcode → Target → General → Version + Build
- Web: Edit `package.json` → `version`
