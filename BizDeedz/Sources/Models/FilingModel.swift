import Foundation

// MARK: - Filing Status
enum FilingStatus: String, Codable, CaseIterable {
    case draft = "Draft"
    case pending = "Pending"
    case accepted = "Accepted"
    case rejected = "Rejected"

    var displayColor: String {
        switch self {
        case .draft: return "gray"
        case .pending: return "orange"
        case .accepted: return "green"
        case .rejected: return "red"
        }
    }
}

// MARK: - Filing Form Type
enum FilingFormType: String, Codable, CaseIterable {
    case changeInOwnership = "Change in Ownership"
    case deedTransfer = "Deed Transfer"
    case probate = "Probate"
    case eviction = "Eviction"
    case civilFiling = "Civil Filing"
    case familyLaw = "Family Law"

    var displayName: String { rawValue }
}

// MARK: - Status History Entry (For Audit Trails - FLOW Witness)
struct StatusHistoryEntry: Identifiable, Codable {
    var id: String
    let oldStatus: FilingStatus?
    let newStatus: FilingStatus
    let changedAt: Date
    let note: String?

    init(id: String = UUID().uuidString, oldStatus: FilingStatus?, newStatus: FilingStatus, changedAt: Date = Date(), note: String? = nil) {
        self.id = id
        self.oldStatus = oldStatus
        self.newStatus = newStatus
        self.changedAt = changedAt
        self.note = note
    }
}

// MARK: - Filing Metadata
struct FilingMetadata: Codable {
    var formType: FilingFormType
    var recorderOffice: String?
    var additionalNotes: String?

    init(formType: FilingFormType, recorderOffice: String? = nil, additionalNotes: String? = nil) {
        self.formType = formType
        self.recorderOffice = recorderOffice
        self.additionalNotes = additionalNotes
    }
}

// MARK: - Filing Item (Main Document Model)
struct FilingItem: Identifiable, Codable {
    var id: String
    var userId: String
    var title: String
    var county: String
    var caseNumber: String?
    var status: FilingStatus
    var submittedAt: Date?
    var lastCheckedAt: Date
    var metadata: FilingMetadata
    var statusHistory: [StatusHistoryEntry]

    // MARK: - Computed Properties (EDGE Governance)

    /// Returns true if filing has been pending for more than 48 hours
    var isOverdue: Bool {
        guard status == .pending, let submitted = submittedAt else { return false }
        let hoursSinceSubmission = Date().timeIntervalSince(submitted) / 3600
        return hoursSinceSubmission > 48
    }

    /// Formatted date string for display
    var formattedSubmitDate: String {
        guard let date = submittedAt else { return "Not submitted" }
        let formatter = DateFormatter()
        formatter.dateFormat = "MM/dd/yyyy"
        return formatter.string(from: date)
    }

    /// Hours since submission (for monitoring)
    var hoursPending: Int? {
        guard status == .pending, let submitted = submittedAt else { return nil }
        return Int(Date().timeIntervalSince(submitted) / 3600)
    }

    // MARK: - Initializer
    init(
        id: String = UUID().uuidString,
        userId: String,
        title: String,
        county: String,
        caseNumber: String? = nil,
        status: FilingStatus = .draft,
        submittedAt: Date? = nil,
        lastCheckedAt: Date = Date(),
        metadata: FilingMetadata,
        statusHistory: [StatusHistoryEntry] = []
    ) {
        self.id = id
        self.userId = userId
        self.title = title
        self.county = county
        self.caseNumber = caseNumber
        self.status = status
        self.submittedAt = submittedAt
        self.lastCheckedAt = lastCheckedAt
        self.metadata = metadata
        self.statusHistory = statusHistory
    }
}

// MARK: - User Profile Model
struct UserProfile: Identifiable, Codable {
    var id: String
    var name: String
    var email: String
    var firmName: String?
    var subscriptionTier: SubscriptionTier
    var hasAcceptedTerms: Bool
    var createdAt: Date

    init(
        id: String,
        name: String,
        email: String,
        firmName: String? = nil,
        subscriptionTier: SubscriptionTier = .trial,
        hasAcceptedTerms: Bool = false,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.email = email
        self.firmName = firmName
        self.subscriptionTier = subscriptionTier
        self.hasAcceptedTerms = hasAcceptedTerms
        self.createdAt = createdAt
    }
}

// MARK: - Subscription Tier
enum SubscriptionTier: String, Codable {
    case trial = "Trial"
    case solo = "Solo"           // $29/month
    case firm = "Firm"           // $199/month
    case enterprise = "Enterprise"

    var monthlyPrice: Int {
        switch self {
        case .trial: return 0
        case .solo: return 29
        case .firm: return 199
        case .enterprise: return 499
        }
    }

    var displayName: String {
        switch self {
        case .trial: return "7-Day Free Trial"
        case .solo: return "Solo Paralegal - $29/mo"
        case .firm: return "Law Firm - $199/mo"
        case .enterprise: return "Enterprise - Custom"
        }
    }
}

// MARK: - Texas Counties (2026 Court Rules)
enum TexasCounty: String, CaseIterable {
    case harris = "Harris"
    case dallas = "Dallas"
    case tarrant = "Tarrant"
    case bexar = "Bexar"
    case travis = "Travis"
    case collin = "Collin"
    case denton = "Denton"
    case hidalgo = "Hidalgo"
    case fortBend = "Fort Bend"
    case montgomery = "Montgomery"
    case williamson = "Williamson"
    case cameron = "Cameron"
    case nueces = "Nueces"
    case brazoria = "Brazoria"
    case other = "Other"

    var displayName: String { rawValue }

    /// Recorder office name for the county
    var recorderOffice: String {
        "\(rawValue) County Clerk's Office"
    }
}
