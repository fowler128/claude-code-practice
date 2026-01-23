import XCTest
@testable import BizDeedz

final class FilingModelTests: XCTestCase {

    // MARK: - FilingItem Tests

    func testFilingItemInitialization() {
        let metadata = FilingMetadata(
            formType: .changeInOwnership,
            recorderOffice: "Harris County Clerk's Office"
        )

        let filing = FilingItem(
            userId: "test_user",
            title: "Test Filing",
            county: "Harris",
            caseNumber: "2026-TEST-001",
            status: .draft,
            metadata: metadata
        )

        XCTAssertEqual(filing.title, "Test Filing")
        XCTAssertEqual(filing.county, "Harris")
        XCTAssertEqual(filing.status, .draft)
        XCTAssertFalse(filing.isOverdue)
    }

    func testFilingIsOverdueWhenPendingOver48Hours() {
        let metadata = FilingMetadata(formType: .deedTransfer)

        // Create a filing submitted 60 hours ago
        let submittedAt = Calendar.current.date(byAdding: .hour, value: -60, to: Date())!

        let filing = FilingItem(
            userId: "test_user",
            title: "Overdue Test",
            county: "Dallas",
            status: .pending,
            submittedAt: submittedAt,
            metadata: metadata
        )

        XCTAssertTrue(filing.isOverdue)
    }

    func testFilingNotOverdueWhenPendingUnder48Hours() {
        let metadata = FilingMetadata(formType: .probate)

        // Create a filing submitted 24 hours ago
        let submittedAt = Calendar.current.date(byAdding: .hour, value: -24, to: Date())!

        let filing = FilingItem(
            userId: "test_user",
            title: "Recent Filing",
            county: "Travis",
            status: .pending,
            submittedAt: submittedAt,
            metadata: metadata
        )

        XCTAssertFalse(filing.isOverdue)
    }

    func testFilingNotOverdueWhenAccepted() {
        let metadata = FilingMetadata(formType: .civilFiling)

        // Even if submitted long ago, accepted filings are not overdue
        let submittedAt = Calendar.current.date(byAdding: .day, value: -10, to: Date())!

        let filing = FilingItem(
            userId: "test_user",
            title: "Accepted Filing",
            county: "Bexar",
            status: .accepted,
            submittedAt: submittedAt,
            metadata: metadata
        )

        XCTAssertFalse(filing.isOverdue)
    }

    // MARK: - StatusHistoryEntry Tests

    func testStatusHistoryEntryCreation() {
        let entry = StatusHistoryEntry(
            oldStatus: .draft,
            newStatus: .pending,
            note: "Submitted to court"
        )

        XCTAssertEqual(entry.oldStatus, .draft)
        XCTAssertEqual(entry.newStatus, .pending)
        XCTAssertEqual(entry.note, "Submitted to court")
        XCTAssertNotNil(entry.changedAt)
    }

    // MARK: - FilingStatus Tests

    func testFilingStatusDisplayColors() {
        XCTAssertEqual(FilingStatus.draft.displayColor, "gray")
        XCTAssertEqual(FilingStatus.pending.displayColor, "orange")
        XCTAssertEqual(FilingStatus.accepted.displayColor, "green")
        XCTAssertEqual(FilingStatus.rejected.displayColor, "red")
    }

    // MARK: - TexasCounty Tests

    func testTexasCountyRecorderOffice() {
        XCTAssertEqual(TexasCounty.harris.recorderOffice, "Harris County Clerk's Office")
        XCTAssertEqual(TexasCounty.dallas.recorderOffice, "Dallas County Clerk's Office")
    }

    // MARK: - SubscriptionTier Tests

    func testSubscriptionTierPricing() {
        XCTAssertEqual(SubscriptionTier.trial.monthlyPrice, 0)
        XCTAssertEqual(SubscriptionTier.solo.monthlyPrice, 29)
        XCTAssertEqual(SubscriptionTier.firm.monthlyPrice, 199)
    }
}
