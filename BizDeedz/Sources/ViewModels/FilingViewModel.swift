import Foundation
import SwiftUI
// Note: Import FirebaseFirestore when Firebase is configured

/// FilingViewModel: Manages filing data and Firebase integration
/// Implements FLOW (Function, Logic, Optimization, Witness) methodology
@MainActor
class FilingViewModel: ObservableObject {

    // MARK: - Published Properties
    @Published var filings: [FilingItem] = []
    @Published var selectedFiling: FilingItem?
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var currentUser: UserProfile?

    // MARK: - Computed Properties (EDGE Governance)

    /// Count of filings by status
    var pendingCount: Int { filings.filter { $0.status == .pending }.count }
    var acceptedCount: Int { filings.filter { $0.status == .accepted }.count }
    var rejectedCount: Int { filings.filter { $0.status == .rejected }.count }
    var draftCount: Int { filings.filter { $0.status == .draft }.count }

    /// Filings that are overdue (pending > 48 hours)
    var overdueFilings: [FilingItem] {
        filings.filter { $0.isOverdue }
    }

    /// Recent filings (last 5)
    var recentFilings: [FilingItem] {
        Array(filings.sorted { ($0.submittedAt ?? Date.distantPast) > ($1.submittedAt ?? Date.distantPast) }.prefix(5))
    }

    /// Governance Score: Percentage of successful filings vs overdue
    /// EDGE Methodology - Governance metric
    var governanceScore: Int {
        let total = filings.filter { $0.status != .draft }.count
        guard total > 0 else { return 100 }

        let successful = acceptedCount
        let overdue = overdueFilings.count

        // Score = (Accepted / Total) * 100, penalized by overdue
        let baseScore = Double(successful) / Double(total) * 100
        let penalty = Double(overdue) * 5 // 5% penalty per overdue filing
        return max(0, min(100, Int(baseScore - penalty)))
    }

    /// Color for governance score display
    var governanceScoreColor: Color {
        switch governanceScore {
        case 80...100: return .green
        case 60..<80: return .yellow
        case 40..<60: return .orange
        default: return .red
        }
    }

    // MARK: - Initialization

    init() {
        // Load sample data for preview/testing
        loadSampleData()
    }

    // MARK: - Firebase Integration (FLOW - Function)

    /// Fetches all filings for the current user from Firestore
    func fetchFilings() async {
        isLoading = true
        errorMessage = nil

        // TODO: Replace with actual Firebase implementation
        // let db = Firestore.firestore()
        // let snapshot = try await db.collection("filings")
        //     .whereField("userId", isEqualTo: currentUser?.id ?? "")
        //     .getDocuments()

        // Simulate network delay for demo
        try? await Task.sleep(nanoseconds: 500_000_000)

        // For now, data is loaded from sample data
        isLoading = false
    }

    /// Submits a new filing to Firestore
    /// FLOW - Logic: Automatically adds initial status history entry
    func submitFiling(_ filing: FilingItem) async throws {
        isLoading = true
        errorMessage = nil

        var newFiling = filing
        newFiling.submittedAt = Date()
        newFiling.status = .pending
        newFiling.lastCheckedAt = Date()

        // Create initial status history entry (FLOW - Witness)
        let historyEntry = StatusHistoryEntry(
            oldStatus: .draft,
            newStatus: .pending,
            changedAt: Date(),
            note: "Filing submitted to \(filing.county) County"
        )
        newFiling.statusHistory.append(historyEntry)

        // TODO: Replace with actual Firebase implementation
        // let db = Firestore.firestore()
        // try await db.collection("filings").document(newFiling.id).setData(...)
        // try await db.collection("filings").document(newFiling.id)
        //     .collection("statusHistory").document(historyEntry.id).setData(...)

        // Simulate network delay
        try? await Task.sleep(nanoseconds: 300_000_000)

        filings.append(newFiling)
        isLoading = false
    }

    /// Creates a new draft filing
    func createDraft(title: String, county: String, formType: FilingFormType, caseNumber: String? = nil) -> FilingItem {
        let metadata = FilingMetadata(
            formType: formType,
            recorderOffice: "\(county) County Clerk's Office"
        )

        return FilingItem(
            userId: currentUser?.id ?? "demo_user",
            title: title,
            county: county,
            caseNumber: caseNumber,
            status: .draft,
            metadata: metadata
        )
    }

    /// Updates the status of a filing (FLOW - Witness logging)
    func updateFilingStatus(_ filing: FilingItem, to newStatus: FilingStatus, note: String? = nil) async throws {
        guard let index = filings.firstIndex(where: { $0.id == filing.id }) else {
            throw FilingError.filingNotFound
        }

        let oldStatus = filings[index].status

        // Create status history entry (FLOW - Witness)
        let historyEntry = StatusHistoryEntry(
            oldStatus: oldStatus,
            newStatus: newStatus,
            changedAt: Date(),
            note: note ?? "Status changed from \(oldStatus.rawValue) to \(newStatus.rawValue)"
        )

        filings[index].status = newStatus
        filings[index].lastCheckedAt = Date()
        filings[index].statusHistory.append(historyEntry)

        // TODO: Update Firebase
        // let db = Firestore.firestore()
        // try await db.collection("filings").document(filing.id).updateData(...)
        // try await db.collection("filings").document(filing.id)
        //     .collection("statusHistory").document(historyEntry.id).setData(...)
    }

    /// Hard delete a filing and all its history (GDPR/CCPA Right to Erasure)
    func deleteFiling(_ filing: FilingItem) async throws {
        guard let index = filings.firstIndex(where: { $0.id == filing.id }) else {
            throw FilingError.filingNotFound
        }

        // TODO: Firebase recursive delete
        // let db = Firestore.firestore()
        // let historyRef = db.collection("filings").document(filing.id).collection("statusHistory")
        // let historyDocs = try await historyRef.getDocuments()
        // for doc in historyDocs.documents {
        //     try await doc.reference.delete()
        // }
        // try await db.collection("filings").document(filing.id).delete()

        // Log deletion for audit compliance
        logAuditEvent(action: "DELETE", filingId: filing.id, details: "Filing permanently deleted per user request")

        filings.remove(at: index)
    }

    // MARK: - Audit Logging (FLOW - Witness)

    private func logAuditEvent(action: String, filingId: String, details: String) {
        // TODO: Implement audit logging to Firebase
        print("[AUDIT] \(Date()) | \(action) | Filing: \(filingId) | \(details)")
    }

    // MARK: - 2026 Texas Court Holiday Check

    /// Checks if a date falls on a 2026 Texas court holiday
    func isTexasCourtHoliday(_ date: Date) -> Bool {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.month, .day, .year], from: date)

        guard components.year == 2026 else { return false }

        // 2026 Texas Court Holidays
        let holidays: [(month: Int, day: Int)] = [
            (1, 1),   // New Year's Day
            (1, 19),  // Martin Luther King Jr. Day
            (2, 16),  // Presidents Day
            (3, 2),   // Texas Independence Day
            (4, 3),   // Good Friday
            (4, 21),  // San Jacinto Day
            (5, 25),  // Memorial Day
            (6, 19),  // Juneteenth
            (7, 3),   // Independence Day (observed)
            (9, 7),   // Labor Day
            (11, 11), // Veterans Day
            (11, 26), // Thanksgiving
            (11, 27), // Day after Thanksgiving
            (12, 24), // Christmas Eve
            (12, 25), // Christmas Day
        ]

        return holidays.contains { $0.month == components.month && $0.day == components.day }
    }

    /// Checks filings for potential holiday delays
    func checkForHolidayDelays() -> [FilingItem] {
        return filings.filter { filing in
            guard let submitted = filing.submittedAt else { return false }
            return isTexasCourtHoliday(submitted) || isTexasCourtHoliday(Date())
        }
    }

    // MARK: - Sample Data (For Testing/Preview)

    private func loadSampleData() {
        let userId = "demo_user"

        filings = [
            FilingItem(
                userId: userId,
                title: "Change in Ownership - 123 Oak St",
                county: "Harris",
                caseNumber: "2026-COO-001",
                status: .pending,
                submittedAt: Calendar.current.date(byAdding: .hour, value: -60, to: Date()),
                metadata: FilingMetadata(formType: .changeInOwnership, recorderOffice: "Harris County Clerk's Office"),
                statusHistory: [
                    StatusHistoryEntry(oldStatus: nil, newStatus: .draft, changedAt: Calendar.current.date(byAdding: .day, value: -3, to: Date())!),
                    StatusHistoryEntry(oldStatus: .draft, newStatus: .pending, changedAt: Calendar.current.date(byAdding: .hour, value: -60, to: Date())!)
                ]
            ),
            FilingItem(
                userId: userId,
                title: "Deed Transfer - Smith Estate",
                county: "Montgomery",
                caseNumber: "2026-DT-042",
                status: .accepted,
                submittedAt: Calendar.current.date(byAdding: .day, value: -7, to: Date()),
                metadata: FilingMetadata(formType: .deedTransfer, recorderOffice: "Montgomery County Clerk's Office"),
                statusHistory: [
                    StatusHistoryEntry(oldStatus: nil, newStatus: .draft, changedAt: Calendar.current.date(byAdding: .day, value: -10, to: Date())!),
                    StatusHistoryEntry(oldStatus: .draft, newStatus: .pending, changedAt: Calendar.current.date(byAdding: .day, value: -7, to: Date())!),
                    StatusHistoryEntry(oldStatus: .pending, newStatus: .accepted, changedAt: Calendar.current.date(byAdding: .day, value: -5, to: Date())!, note: "Recorded as Document #2026-0001234")
                ]
            ),
            FilingItem(
                userId: userId,
                title: "Probate Filing - Case 44921",
                county: "Travis",
                caseNumber: "2026-PR-44921",
                status: .rejected,
                submittedAt: Calendar.current.date(byAdding: .day, value: -2, to: Date()),
                metadata: FilingMetadata(formType: .probate, recorderOffice: "Travis County Clerk's Office"),
                statusHistory: [
                    StatusHistoryEntry(oldStatus: nil, newStatus: .draft, changedAt: Calendar.current.date(byAdding: .day, value: -5, to: Date())!),
                    StatusHistoryEntry(oldStatus: .draft, newStatus: .pending, changedAt: Calendar.current.date(byAdding: .day, value: -2, to: Date())!),
                    StatusHistoryEntry(oldStatus: .pending, newStatus: .rejected, changedAt: Calendar.current.date(byAdding: .hour, value: -12, to: Date())!, note: "Missing notarized signature on page 3")
                ]
            ),
            FilingItem(
                userId: userId,
                title: "Eviction Notice - 456 Main St",
                county: "Dallas",
                status: .draft,
                metadata: FilingMetadata(formType: .eviction, recorderOffice: "Dallas County Clerk's Office", additionalNotes: "SB 38 Compliant")
            ),
            FilingItem(
                userId: userId,
                title: "Change in Ownership - Industrial Park",
                county: "Fort Bend",
                caseNumber: "2026-COO-089",
                status: .pending,
                submittedAt: Calendar.current.date(byAdding: .hour, value: -20, to: Date()),
                metadata: FilingMetadata(formType: .changeInOwnership, recorderOffice: "Fort Bend County Clerk's Office"),
                statusHistory: [
                    StatusHistoryEntry(oldStatus: nil, newStatus: .draft, changedAt: Calendar.current.date(byAdding: .day, value: -1, to: Date())!),
                    StatusHistoryEntry(oldStatus: .draft, newStatus: .pending, changedAt: Calendar.current.date(byAdding: .hour, value: -20, to: Date())!)
                ]
            )
        ]
    }
}

// MARK: - Errors

enum FilingError: LocalizedError {
    case filingNotFound
    case unauthorized
    case networkError
    case invalidData

    var errorDescription: String? {
        switch self {
        case .filingNotFound: return "Filing not found"
        case .unauthorized: return "You are not authorized to perform this action"
        case .networkError: return "Network error. Please try again."
        case .invalidData: return "Invalid filing data"
        }
    }
}
