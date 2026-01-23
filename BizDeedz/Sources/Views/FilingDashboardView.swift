import SwiftUI

struct FilingDashboardView: View {
    @StateObject private var viewModel = FilingViewModel()
    @AppStorage("hasAcceptedTerms") private var hasAcceptedTerms: Bool = false
    @State private var showingAddFiling = false
    @State private var showingTerms = false

    var body: some View {
        NavigationView {
            ZStack {
                if hasAcceptedTerms {
                    mainContent
                } else {
                    lockedContent
                }
            }
            .navigationTitle("BizDeedz Tracker")
            .background(Color(.systemGroupedBackground))
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddFiling = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                    }
                    .disabled(!hasAcceptedTerms)
                }
            }
            .sheet(isPresented: $showingAddFiling) {
                AddFilingView(viewModel: viewModel)
            }
            .sheet(isPresented: .constant(!hasAcceptedTerms && !showingTerms)) {
                TermsOfServiceView(isAccepted: $hasAcceptedTerms)
                    .interactiveDismissDisabled()
            }
        }
    }

    // MARK: - Main Dashboard Content
    private var mainContent: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header Summary (Bento Grid)
                summaryCards

                // Governance Score (EDGE Methodology)
                governanceScoreCard

                // Recent Filings Section
                recentFilingsSection

                // Overdue Alerts Section
                if !viewModel.overdueFilings.isEmpty {
                    overdueAlertsSection
                }
            }
            .padding(.vertical)
        }
        .refreshable {
            await viewModel.fetchFilings()
        }
    }

    // MARK: - Summary Cards (Bento Box Style)
    private var summaryCards: some View {
        VStack(spacing: 15) {
            HStack(spacing: 15) {
                SummaryCard(
                    title: "Pending",
                    count: "\(viewModel.pendingCount)",
                    color: .orange,
                    icon: "clock.fill"
                )
                SummaryCard(
                    title: "Accepted",
                    count: "\(viewModel.acceptedCount)",
                    color: .green,
                    icon: "checkmark.circle.fill"
                )
            }

            HStack(spacing: 15) {
                SummaryCard(
                    title: "Drafts",
                    count: "\(viewModel.draftCount)",
                    color: .gray,
                    icon: "doc.text.fill"
                )
                SummaryCard(
                    title: "Rejected",
                    count: "\(viewModel.rejectedCount)",
                    color: .red,
                    icon: "xmark.circle.fill"
                )
            }
        }
        .padding(.horizontal)
    }

    // MARK: - Governance Score (EDGE Methodology)
    private var governanceScoreCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "chart.bar.fill")
                    .foregroundColor(.blue)
                Text("EDGE Governance Score")
                    .font(.headline)
                Spacer()
                Text("\(viewModel.governanceScore)%")
                    .font(.title2.bold())
                    .foregroundColor(viewModel.governanceScoreColor)
            }

            ProgressView(value: Double(viewModel.governanceScore), total: 100)
                .tint(viewModel.governanceScoreColor)

            Text("Based on Accepted vs Overdue filings ratio")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
        .padding(.horizontal)
    }

    // MARK: - Recent Filings Section
    private var recentFilingsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Filings")
                    .font(.title2.bold())
                Spacer()
                NavigationLink("See All") {
                    AllFilingsView(viewModel: viewModel)
                }
                .font(.subheadline)
            }
            .padding(.horizontal)

            if viewModel.filings.isEmpty {
                emptyStateView
            } else {
                VStack(spacing: 12) {
                    ForEach(viewModel.recentFilings) { filing in
                        FilingCard(filing: filing)
                            .onTapGesture {
                                viewModel.selectedFiling = filing
                            }
                    }
                }
                .padding(.horizontal)
            }
        }
    }

    // MARK: - Overdue Alerts Section
    private var overdueAlertsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.red)
                Text("Overdue Alerts")
                    .font(.title2.bold())
                    .foregroundColor(.red)
            }
            .padding(.horizontal)

            VStack(spacing: 12) {
                ForEach(viewModel.overdueFilings) { filing in
                    OverdueFilingCard(filing: filing)
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 50))
                .foregroundColor(.secondary)

            Text("No Filings Yet")
                .font(.headline)

            Text("Tap the + button to track your first filing")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Button(action: { showingAddFiling = true }) {
                Label("Add Filing", systemImage: "plus")
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }

    // MARK: - Locked Content (Terms Not Accepted)
    private var lockedContent: some View {
        VStack(spacing: 20) {
            Image(systemName: "lock.fill")
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text("Accept Terms to Continue")
                .font(.headline)

            Text("Please review and accept the Terms of Service to access BizDeedz Filing Tracker.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: { showingTerms = true }) {
                Text("View Terms of Service")
                    .padding(.horizontal, 30)
                    .padding(.vertical, 12)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .padding()
    }
}

// MARK: - Summary Card Component
struct SummaryCard: View {
    let title: String
    let count: String
    let color: Color
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(count)
                .font(.title.bold())
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }
}

// MARK: - Filing Card Component
struct FilingCard: View {
    let filing: FilingItem

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(filing.title)
                        .font(.headline)
                        .lineLimit(1)

                    if filing.isOverdue {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }

                Text("\(filing.county) County \u{2022} \(filing.formattedSubmitDate)")
                    .font(.caption)
                    .foregroundColor(.secondary)

                if let caseNumber = filing.caseNumber {
                    Text("Case: \(caseNumber)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            StatusBadge(status: filing.status, isOverdue: filing.isOverdue)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Status Badge Component
struct StatusBadge: View {
    let status: FilingStatus
    let isOverdue: Bool

    private var displayColor: Color {
        if isOverdue && status == .pending {
            return .red
        }
        switch status {
        case .draft: return .gray
        case .pending: return .orange
        case .accepted: return .green
        case .rejected: return .red
        }
    }

    var body: some View {
        Text(isOverdue && status == .pending ? "OVERDUE" : status.rawValue)
            .font(.caption.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(displayColor.opacity(0.1))
            .foregroundColor(displayColor)
            .cornerRadius(8)
    }
}

// MARK: - Overdue Filing Card
struct OverdueFilingCard: View {
    let filing: FilingItem

    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.red)
                .font(.title3)

            VStack(alignment: .leading, spacing: 4) {
                Text(filing.title)
                    .font(.subheadline.bold())
                    .lineLimit(1)

                if let hours = filing.hoursPending {
                    Text("Pending for \(hours) hours")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }

            Spacer()

            Text(filing.county)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.red.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Preview
#Preview {
    FilingDashboardView()
}
