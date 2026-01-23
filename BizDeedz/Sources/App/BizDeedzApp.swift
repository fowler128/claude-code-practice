import SwiftUI

/// BizDeedz Filing Tracker - Main App Entry Point
/// Built with EDGE (Efficiency, Data, Governance, Execution) Methodology
/// and FLOW (Function, Logic, Optimization, Witness) Framework
///
/// Target: iOS 17.0+ | Swift 5.9+
/// Build: January 2026

@main
struct BizDeedzApp: App {
    // MARK: - App Delegate Adapter
    // @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate

    // MARK: - State
    @StateObject private var appState = AppState()

    init() {
        // Configure Firebase
        FirebaseService.configure()

        // Configure appearance
        configureAppearance()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }

    // MARK: - Appearance Configuration

    private func configureAppearance() {
        // Navigation bar appearance
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = UIColor.systemBackground
        navAppearance.titleTextAttributes = [.foregroundColor: UIColor.label]
        navAppearance.largeTitleTextAttributes = [.foregroundColor: UIColor.label]

        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
        UINavigationBar.appearance().compactAppearance = navAppearance

        // Tab bar appearance
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
    }
}

// MARK: - App State (Global State Management)

class AppState: ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var currentUser: UserProfile?
    @Published var isLoading: Bool = false

    init() {
        checkAuthState()
    }

    func checkAuthState() {
        // Check if user is authenticated via Firebase
        if let userId = FirebaseService.shared.currentUserId {
            isAuthenticated = true
            // Load user profile
            Task {
                await loadUserProfile(userId: userId)
            }
        }
    }

    @MainActor
    func loadUserProfile(userId: String) async {
        // TODO: Fetch from Firebase
        // For demo, create a sample user
        currentUser = UserProfile(
            id: userId,
            name: "Demo Paralegal",
            email: "demo@bizdeedz.com",
            firmName: "BizDeedz Law Firm",
            subscriptionTier: .trial,
            hasAcceptedTerms: false
        )
    }

    func signOut() {
        try? FirebaseService.shared.signOut()
        isAuthenticated = false
        currentUser = nil
    }
}

// MARK: - Content View (Root Navigation)

struct ContentView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        TabView {
            // Dashboard Tab
            FilingDashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "rectangle.grid.2x2.fill")
                }

            // All Filings Tab
            AllFilingsView(viewModel: FilingViewModel())
                .tabItem {
                    Label("Filings", systemImage: "doc.text.fill")
                }

            // Settings Tab
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
        .tint(.blue)
    }
}

// MARK: - All Filings View

struct AllFilingsView: View {
    @ObservedObject var viewModel: FilingViewModel
    @State private var searchText = ""
    @State private var selectedFilter: FilingStatus?

    var filteredFilings: [FilingItem] {
        var result = viewModel.filings

        // Apply search filter
        if !searchText.isEmpty {
            result = result.filter {
                $0.title.localizedCaseInsensitiveContains(searchText) ||
                $0.county.localizedCaseInsensitiveContains(searchText) ||
                ($0.caseNumber?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        // Apply status filter
        if let filter = selectedFilter {
            result = result.filter { $0.status == filter }
        }

        return result
    }

    var body: some View {
        NavigationView {
            List {
                // Filter Chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        FilterChip(title: "All", isSelected: selectedFilter == nil) {
                            selectedFilter = nil
                        }
                        ForEach(FilingStatus.allCases, id: \.self) { status in
                            FilterChip(title: status.rawValue, isSelected: selectedFilter == status) {
                                selectedFilter = status
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .listRowInsets(EdgeInsets())
                .listRowSeparator(.hidden)

                // Filings List
                ForEach(filteredFilings) { filing in
                    FilingCard(filing: filing)
                        .listRowSeparator(.hidden)
                        .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                }
            }
            .listStyle(.plain)
            .navigationTitle("All Filings")
            .searchable(text: $searchText, prompt: "Search filings...")
        }
    }
}

// MARK: - Filter Chip Component

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.blue : Color(.systemGray5))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(16)
        }
    }
}

// MARK: - Settings View

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @AppStorage("hasAcceptedTerms") private var hasAcceptedTerms: Bool = false
    @State private var showingTerms = false
    @State private var showingPrivacy = false

    var body: some View {
        NavigationView {
            List {
                // Account Section
                Section("Account") {
                    if let user = appState.currentUser {
                        HStack {
                            Image(systemName: "person.circle.fill")
                                .font(.largeTitle)
                                .foregroundColor(.blue)

                            VStack(alignment: .leading) {
                                Text(user.name)
                                    .font(.headline)
                                Text(user.email)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 4)

                        HStack {
                            Text("Subscription")
                            Spacer()
                            Text(user.subscriptionTier.displayName)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                // Legal Section
                Section("Legal") {
                    Button(action: { showingTerms = true }) {
                        HStack {
                            Text("Terms of Service")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                        }
                    }
                    .foregroundColor(.primary)

                    Button(action: { showingPrivacy = true }) {
                        HStack {
                            Text("Privacy Policy")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                        }
                    }
                    .foregroundColor(.primary)
                }

                // About Section
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0 (2026)")
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("Build")
                        Spacer()
                        Text("January 2026")
                            .foregroundColor(.secondary)
                    }

                    Link(destination: URL(string: "https://bizdeedz.com")!) {
                        HStack {
                            Text("Visit Website")
                            Spacer()
                            Image(systemName: "arrow.up.right")
                                .foregroundColor(.secondary)
                        }
                    }
                    .foregroundColor(.primary)
                }

                // Danger Zone
                Section {
                    Button(action: {
                        hasAcceptedTerms = false
                    }) {
                        Text("Reset Terms Acceptance")
                            .foregroundColor(.orange)
                    }

                    Button(action: {
                        appState.signOut()
                    }) {
                        Text("Sign Out")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showingTerms) {
                TermsOfServiceView(isAccepted: $hasAcceptedTerms)
            }
            .sheet(isPresented: $showingPrivacy) {
                PrivacyPolicyView()
            }
        }
    }
}

// MARK: - Privacy Policy View

struct PrivacyPolicyView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("BizDeedz Privacy Policy")
                        .font(.title.bold())

                    Text("Last Updated: January 2026")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    privacyContent
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private var privacyContent: some View {
        VStack(alignment: .leading, spacing: 20) {
            PrivacySection(
                title: "Data We Collect",
                content: "We collect only the metadata necessary to track your filing status, including timestamps, county identifiers, and status changes. We do not access the content of your legal documents unless you explicitly share them."
            )

            PrivacySection(
                title: "How We Use Your Data",
                content: "Your data is used to provide filing tracking services, send status notifications, and improve our platform. We do not sell your personal information to third parties."
            )

            PrivacySection(
                title: "AI & Automated Processing",
                content: "BizDeedz uses AI to flag overdue filings and provide suggestions. We do not autonomously cancel or alter filings without human intervention (Human-in-the-Loop)."
            )

            PrivacySection(
                title: "Your Rights",
                content: "You have the right to access, correct, or delete your personal data. Under CCPA/CPRA, California residents have additional rights including the Right to Erasure and the right to opt-out of data sales (we do not sell data)."
            )

            PrivacySection(
                title: "Data Security",
                content: "We employ industry-standard encryption (AES-256), secure servers, and multi-factor authentication to protect your data. Our infrastructure is SOC 2 compliant."
            )

            PrivacySection(
                title: "Contact Us",
                content: "For privacy concerns, contact privacy@bizdeedz.com"
            )
        }
    }
}

struct PrivacySection: View {
    let title: String
    let content: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
            Text(content)
                .font(.body)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Preview

#Preview {
    ContentView()
        .environmentObject(AppState())
}
