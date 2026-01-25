# Deployment Guide - Get StreamPicks on Your Phone

## Option 1: Expo Go (Fastest - 5 minutes)

Test the app instantly without building anything.

### Setup
```bash
cd StreamPicks
npm install
```

### Run
```bash
npx expo start
```

### On Your Phone
1. Download **Expo Go** from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in terminal
3. App opens instantly on your phone

**Pros**: Instant, no build needed
**Cons**: Requires Expo Go app, can't share with others easily

---

## Option 2: Build Standalone App (APK/IPA)

Create a real app file you can install and share.

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
# Create free account at expo.dev if needed
```

### Step 3: Configure Build
```bash
eas build:configure
```

### Step 4: Build for Your Platform

**Android (APK for direct install):**
```bash
eas build --platform android --profile preview
```

**iOS (requires Apple Developer account - $99/year):**
```bash
eas build --platform ios --profile preview
```

### Step 5: Download & Install

After build completes (~10-15 min):
- **Android**: Download APK, transfer to phone, install
- **iOS**: Install via TestFlight or ad-hoc distribution

---

## Option 3: App Stores (Production)

### Google Play Store

1. **Create Developer Account** ($25 one-time fee)
   - Go to [play.google.com/console](https://play.google.com/console)

2. **Build Release Version**
   ```bash
   eas build --platform android --profile production
   ```

3. **Upload to Play Console**
   - Create new app
   - Upload the `.aab` file
   - Fill in store listing (screenshots, description)
   - Submit for review (usually 1-3 days)

### Apple App Store

1. **Create Developer Account** ($99/year)
   - Go to [developer.apple.com](https://developer.apple.com)

2. **Build Release Version**
   ```bash
   eas build --platform ios --profile production
   ```

3. **Submit via App Store Connect**
   - Create app record
   - Upload build
   - Fill in metadata
   - Submit for review (usually 1-2 days)

---

## Quick Start Commands

```bash
# Install dependencies
cd StreamPicks
npm install

# Test locally (web browser)
npx expo start --web

# Test on phone (via Expo Go)
npx expo start

# Build Android APK
eas build --platform android --profile preview

# Build iOS (needs Apple Developer)
eas build --platform ios --profile preview
```

---

## Build Profiles

Add to `eas.json` in project root:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Share With Friends (Without App Store)

### Android
1. Build APK: `eas build --platform android --profile preview`
2. Share the APK file directly
3. They enable "Install from unknown sources" and install

### iOS (TestFlight)
1. Build: `eas build --platform ios --profile production`
2. Upload to App Store Connect
3. Add testers to TestFlight
4. They download TestFlight app and install your app

---

## Cost Summary

| Method | Cost | Time |
|--------|------|------|
| Expo Go | Free | 5 min |
| Android APK | Free | 15 min build |
| Play Store | $25 one-time | 1-3 days review |
| iOS TestFlight | $99/year | 1 day review |
| App Store | $99/year | 1-2 days review |

---

## Recommended Path

1. **Start with Expo Go** - Test immediately
2. **Build Android APK** - Share with Android friends for free
3. **Consider stores later** - If you want wider distribution
