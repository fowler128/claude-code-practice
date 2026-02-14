# BizDeedz Filing Tracker

A modern iOS application for legal professionals to track court filings and document submissions across Texas counties.

## Overview

BizDeedz Filing Tracker is built using the **EDGE** (Efficiency, Data, Governance, Execution) methodology and **FLOW** (Function, Logic, Optimization, Witness) framework to provide paralegals and law firms with a streamlined document tracking solution.

## Features

- **Unified Dashboard**: Track all filings across multiple Texas counties in one place
- **Status Management**: Monitor filing status (Draft, Pending, Accepted, Rejected)
- **Overdue Alerts**: Automatic notifications when filings exceed 48-hour pending threshold
- **Audit Trail**: Complete status history logging for compliance (FLOW Witness)
- **2026 Texas Court Rules**: Built-in compliance with latest court requirements
- **Holiday Detection**: Automatic detection of Texas court holidays that may affect filings

## Development Status

**Note**: Firebase integration is currently in placeholder state. The following features require Firebase SDK configuration to be fully functional:
- Real-time status updates (listener implementation is commented out)
- Cloud data persistence (returns empty data arrays)
- Authentication services (demo mode only)

See `FirebaseService.swift` for implementation details and setup instructions.

## Tech Stack

- **UI**: SwiftUI (iOS 17.0+)
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: Superwall integration ready

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
└── README.md
```

## Setup Instructions

1. Clone the repository
2. Open in Xcode 15.0+
3. Add Firebase SDK via Swift Package Manager
4. Add your `GoogleService-Info.plist`
5. Deploy Firestore rules: `firebase deploy --only firestore:rules`
6. Build and run

## Pricing

- **Solo Paralegal**: $29/month
- **Law Firm**: $199/month
- **Enterprise**: Custom pricing

## License

Copyright 2026 BizDeedz, Inc. All rights reserved.
