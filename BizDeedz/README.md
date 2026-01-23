# BizDeedz Filing Tracker

A modern iOS application for legal professionals to track court filings and document submissions across Texas counties.

## Quick Start (macOS)

```bash
cd BizDeedz
./setup.sh
```

This will:
1. Install XcodeGen (if needed)
2. Generate the Xcode project
3. Open the project in Xcode

## Features

- **Unified Dashboard**: Track all filings across multiple Texas counties in one place
- **Real-time Status Updates**: Monitor filing status (Draft, Pending, Accepted, Rejected)
- **Overdue Alerts**: Automatic notifications when filings exceed 48-hour pending threshold
- **Audit Trail**: Complete status history logging for compliance (FLOW Witness)
- **2026 Texas Court Rules**: Built-in compliance with latest court requirements
- **Holiday Detection**: Automatic detection of Texas court holidays that may affect filings
- **EDGE Governance Score**: Visual metric showing filing success rate

## Tech Stack

- **UI**: SwiftUI (iOS 17.0+)
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Project Generation**: XcodeGen

## Project Structure

```
BizDeedz/
├── Sources/
│   ├── App/
│   │   └── BizDeedzApp.swift          # Main entry point
│   ├── Models/
│   │   └── FilingModel.swift          # Data models (Codable)
│   ├── Views/
│   │   ├── FilingDashboardView.swift  # Main dashboard
│   │   ├── AddFilingView.swift        # New filing form
│   │   └── TermsOfServiceView.swift   # TOS acceptance
│   ├── ViewModels/
│   │   └── FilingViewModel.swift      # Business logic
│   ├── Services/
│   │   └── FirebaseService.swift      # Firebase integration
│   └── Firebase/
│       └── firestore.rules            # Security rules
├── Resources/
│   ├── Info.plist                     # App configuration
│   └── Assets.xcassets/               # App icons & colors
├── Tests/
│   └── FilingModelTests.swift         # Unit tests
├── project.yml                        # XcodeGen configuration
├── setup.sh                           # One-command setup script
└── README.md
```

## Manual Setup (Alternative)

If you prefer not to use the setup script:

1. Install XcodeGen:
   ```bash
   brew install xcodegen
   ```

2. Generate Xcode project:
   ```bash
   cd BizDeedz
   xcodegen generate
   ```

3. Open the project:
   ```bash
   open BizDeedz.xcodeproj
   ```

## Firebase Setup (Required)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "BizDeedz"
3. Add an iOS app with bundle ID: `com.bizdeedz.filingtracker`
4. Download `GoogleService-Info.plist`
5. Drag it into Xcode (Resources folder)
6. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Building & Running

1. In Xcode, select your Team in Signing & Capabilities
2. Select iPhone 15 Pro simulator
3. Press `Cmd + R` to build and run

## Running Tests

```bash
xcodebuild test -scheme BizDeedz -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

## Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| Trial | Free (7 days) | Full access |
| Solo Paralegal | $29/mo | Single user |
| Law Firm | $199/mo | Up to 10 users |
| Enterprise | Custom | Unlimited users |

## Requirements

- macOS 13.0+
- Xcode 15.0+
- iOS 17.0+ deployment target
- Firebase account

## License

Copyright 2026 BizDeedz, Inc. All rights reserved.
