# CLAUDE.md - AI Assistant Codebase Guide

## Project Overview

This is a **multi-project repository** containing:

1. **BizDeedz Filing Tracker** - iOS legal document tracking application (SwiftUI)
2. **Web Projects** - HTML landing pages and KPI dashboards
3. **Example Code** - Python utility functions

The primary project is BizDeedz, a Texas-focused legal filing tracker that follows the **EDGE** (Efficiency, Data, Governance, Execution) and **FLOW** (Function, Logic, Optimization, Witness) methodologies.

---

## Directory Structure

```
/
├── BizDeedz/                          # iOS App (SwiftUI)
│   ├── Sources/
│   │   ├── App/
│   │   │   └── BizDeedzApp.swift      # Main entry point, app state, navigation
│   │   ├── Models/
│   │   │   └── FilingModel.swift      # Data structures, enums, Texas counties
│   │   ├── Views/
│   │   │   ├── FilingDashboardView.swift    # Main dashboard with bento grid
│   │   │   ├── AddFilingView.swift          # New filing form
│   │   │   └── TermsOfServiceView.swift     # Legal terms & privacy policy
│   │   ├── ViewModels/
│   │   │   └── FilingViewModel.swift  # Business logic, state management
│   │   ├── Services/
│   │   │   └── FirebaseService.swift  # Firebase integration (stubbed)
│   │   └── Firebase/
│   │       └── firestore.rules        # Security rules
│   └── README.md                      # BizDeedz documentation
├── index.html                         # Professional landing page
├── kpi-scoreboard.html               # KPI dashboard visualization
├── example.py                         # Simple Python calculator
└── CLAUDE.md                          # This file
```

---

## Technology Stack

### iOS Application (BizDeedz)
| Technology | Version/Details |
|------------|-----------------|
| Language | Swift 5.9+ |
| UI Framework | SwiftUI |
| Target | iOS 17.0+ |
| IDE | Xcode 15.0+ |
| Backend | Firebase Firestore (planned) |
| Auth | Firebase Auth (planned) |
| Payments | Superwall (prepared) |

### Web Projects
- HTML5, CSS3 (Flexbox, Grid, Gradients)
- Vanilla JavaScript (ES6+)
- No build tools required

### Python
- Python 3.x
- No external dependencies

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `BizDeedz/Sources/App/BizDeedzApp.swift` | App entry point, `AppState` class, navigation structure |
| `BizDeedz/Sources/Models/FilingModel.swift` | `FilingItem`, `FilingStatus`, `FilingFormType`, Texas counties |
| `BizDeedz/Sources/ViewModels/FilingViewModel.swift` | Business logic, computed properties, sample data |
| `BizDeedz/Sources/Views/FilingDashboardView.swift` | Bento grid dashboard, governance score |
| `BizDeedz/Sources/Views/AddFilingView.swift` | Filing creation form with validation |
| `BizDeedz/Sources/Services/FirebaseService.swift` | Firebase service layer (TODO: implement) |
| `BizDeedz/Sources/Firebase/firestore.rules` | Security rules for Firestore |

---

## Architecture & Patterns

### MVVM Pattern
```
View → ViewModel → Model
  ↑        ↓
  └────────┘ (Observation via @Published)
```

- **Views**: SwiftUI views in `Sources/Views/`
- **ViewModels**: Observable classes with `@Published` properties in `Sources/ViewModels/`
- **Models**: Data structures and enums in `Sources/Models/`
- **Services**: Singleton services in `Sources/Services/`

### State Management
- `AppState` class holds global authentication and user profile state
- `FilingViewModel` manages filing-specific state
- State passed via `@EnvironmentObject` and `@StateObject`

### Code Organization
- Use `// MARK: - Section Name` for clear section separation
- Include `#Preview` structs for SwiftUI preview support
- Follow EDGE/FLOW methodology in business logic

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | PascalCase matching type name | `FilingViewModel.swift` |
| Types | PascalCase | `FilingItem`, `FilingStatus` |
| Properties | camelCase | `governanceScore`, `isOverdue` |
| Constants | camelCase or UPPERCASE | `texasCourtHolidays2026` |
| Enums | PascalCase cases | `FilingStatus.pending` |

---

## Development Notes

### Current Status
- **Core UI**: Complete
- **Sample Data**: Functional for testing
- **Firebase Integration**: Stubbed with TODO markers (6+ instances)
- **Xcode Project**: Not yet created (.xcodeproj missing)
- **Payment Integration**: Superwall prepared but not implemented

### TODO Markers
Search for `TODO` in the codebase to find incomplete implementations:
```
grep -r "TODO" BizDeedz/
```

### Key Computed Properties (FilingViewModel)
- `overdueFilings` - Filings pending > 48 hours
- `governanceScore` - EDGE compliance metric (0-100)
- `recentFilings` - Last 5 filings for dashboard

---

## Compliance & Legal Considerations

### Regulatory Compliance
- **CCPA/CPRA**: California privacy rights acknowledged
- **AB5 Compliance**: Independent contractor disclaimers included
- **Texas Court Rules 2026**: Built-in holiday checking
- **Human-in-the-Loop**: AI suggestions require user verification

### Security Model (Firestore Rules)
- Document-level user isolation
- Append-only audit logs (FLOW Witness)
- Subscription data managed by backend only
- Default deny policy

### Sensitive Data
Never commit:
- `GoogleService-Info.plist` (Firebase config)
- API keys or secrets
- User PII or filing content
- Authentication tokens

---

## Working With This Codebase

### Adding New Views
1. Create view file in `BizDeedz/Sources/Views/`
2. Use existing components (`SummaryCard`, `StatusBadge`, etc.)
3. Add `#Preview` struct for development
4. Connect to ViewModel via `@StateObject` or `@EnvironmentObject`

### Adding New Models
1. Add to `FilingModel.swift` or create new file in `Models/`
2. Implement `Codable` for Firebase compatibility
3. Add computed properties for derived data
4. Update ViewModel if needed

### Firebase Implementation
The `FirebaseService.swift` file contains stubbed methods. To implement:
1. Add Firebase SDK via Swift Package Manager
2. Configure `GoogleService-Info.plist`
3. Replace TODO stubs with actual Firebase calls
4. Test with Firestore emulator

---

## Testing

### SwiftUI Previews
Each major view includes `#Preview` definitions:
```swift
#Preview {
    FilingDashboardView()
        .environmentObject(FilingViewModel())
        .environmentObject(AppState.shared)
}
```

### Sample Data
`FilingViewModel` loads sample data for testing:
```swift
func loadSampleData() {
    // Pre-loaded demo filings
}
```

---

## Web Projects

### index.html
Professional landing page with:
- Sticky navigation header
- Hero section with CTA
- Features grid (responsive)

### kpi-scoreboard.html
Interactive KPI dashboard:
- Dynamic card rendering via `renderKPIs()`
- Color-coded metrics (green positive, red negative)
- `updateKPIs()` for live data updates

---

## Quick Commands

```bash
# Search for TODOs
grep -r "TODO" BizDeedz/

# Find Swift files
find BizDeedz -name "*.swift"

# Check for Firebase references
grep -r "Firebase" BizDeedz/

# Run Python example
python3 example.py
```

---

## Important Warnings

1. **Firebase Not Connected**: The app uses sample data; Firebase integration is incomplete
2. **No Xcode Project**: Need to create `.xcodeproj` to build the iOS app
3. **Legal Documents**: Terms of Service and Privacy Policy are application-specific templates
4. **Texas-Specific**: County data and court holidays are Texas 2026 compliant

---

*Last Updated: February 2026*
