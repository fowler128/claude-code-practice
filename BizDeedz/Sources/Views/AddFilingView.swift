import SwiftUI

/// AddFilingView: Form for creating new filing entries
/// Implements FLOW Logic for proper document tracking
struct AddFilingView: View {
    @Environment(\.dismiss) var dismiss
    @ObservedObject var viewModel: FilingViewModel

    // MARK: - Form State
    @State private var title: String = ""
    @State private var selectedCounty: TexasCounty = .harris
    @State private var selectedFormType: FilingFormType = .changeInOwnership
    @State private var caseNumber: String = ""
    @State private var additionalNotes: String = ""
    @State private var submitImmediately: Bool = false

    // MARK: - UI State
    @State private var isSubmitting: Bool = false
    @State private var showingError: Bool = false
    @State private var errorMessage: String = ""

    // MARK: - Validation
    private var isValid: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        NavigationView {
            Form {
                // Basic Information Section
                basicInfoSection

                // Filing Details Section
                filingDetailsSection

                // Additional Options Section
                additionalOptionsSection

                // Help Section
                helpSection
            }
            .navigationTitle("New Filing")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button(submitImmediately ? "Submit" : "Save Draft") {
                        Task {
                            await saveFiling()
                        }
                    }
                    .disabled(!isValid || isSubmitting)
                }
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
            .disabled(isSubmitting)
            .overlay {
                if isSubmitting {
                    loadingOverlay
                }
            }
        }
    }

    // MARK: - Basic Information Section

    private var basicInfoSection: some View {
        Section {
            TextField("Filing Title", text: $title)
                .textContentType(.none)
                .autocorrectionDisabled()

            Picker("County", selection: $selectedCounty) {
                ForEach(TexasCounty.allCases, id: \.self) { county in
                    Text(county.displayName).tag(county)
                }
            }

            Picker("Form Type", selection: $selectedFormType) {
                ForEach(FilingFormType.allCases, id: \.self) { type in
                    Text(type.displayName).tag(type)
                }
            }
        } header: {
            Text("Basic Information")
        } footer: {
            Text("Enter a descriptive title for easy identification")
        }
    }

    // MARK: - Filing Details Section

    private var filingDetailsSection: some View {
        Section {
            TextField("Case Number (Optional)", text: $caseNumber)
                .textContentType(.none)
                .autocapitalization(.allCharacters)

            // Recorder Office (Auto-filled based on county)
            HStack {
                Text("Recorder Office")
                Spacer()
                Text(selectedCounty.recorderOffice)
                    .foregroundColor(.secondary)
                    .font(.subheadline)
            }

            // Additional Notes
            VStack(alignment: .leading, spacing: 4) {
                Text("Notes")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                TextEditor(text: $additionalNotes)
                    .frame(minHeight: 80)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(.systemGray4), lineWidth: 1)
                    )
            }
        } header: {
            Text("Filing Details")
        }
    }

    // MARK: - Additional Options Section

    private var additionalOptionsSection: some View {
        Section {
            Toggle("Submit Immediately", isOn: $submitImmediately)

            if submitImmediately {
                // Warning about immediate submission
                HStack(spacing: 8) {
                    Image(systemName: "info.circle.fill")
                        .foregroundColor(.blue)

                    Text("Filing will be marked as Pending and tracking will begin immediately.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                // 2026 Court Holiday Check
                if viewModel.isTexasCourtHoliday(Date()) {
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)

                        Text("Today is a Texas Court Holiday. Your filing may be delayed.")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
            }
        } header: {
            Text("Submission Options")
        } footer: {
            Text(submitImmediately
                ? "Your filing will begin tracking immediately."
                : "Save as draft to review before submitting."
            )
        }
    }

    // MARK: - Help Section

    private var helpSection: some View {
        Section {
            DisclosureGroup {
                VStack(alignment: .leading, spacing: 12) {
                    HelpItem(
                        icon: "doc.text",
                        title: "Change in Ownership",
                        description: "Property transfer forms required by county assessor"
                    )

                    HelpItem(
                        icon: "building.2",
                        title: "Deed Transfer",
                        description: "Real estate deed recordings and transfers"
                    )

                    HelpItem(
                        icon: "person.2",
                        title: "Probate",
                        description: "Estate and probate court filings"
                    )

                    HelpItem(
                        icon: "house",
                        title: "Eviction",
                        description: "SB 38 compliant eviction filings (2026 rules)"
                    )
                }
                .padding(.vertical, 8)
            } label: {
                Label("Filing Type Guide", systemImage: "questionmark.circle")
            }
        }
    }

    // MARK: - Loading Overlay

    private var loadingOverlay: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                ProgressView()
                    .scaleEffect(1.5)

                Text(submitImmediately ? "Submitting Filing..." : "Saving Draft...")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            .padding(32)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(radius: 10)
        }
    }

    // MARK: - Actions

    private func saveFiling() async {
        isSubmitting = true

        let metadata = FilingMetadata(
            formType: selectedFormType,
            recorderOffice: selectedCounty.recorderOffice,
            additionalNotes: additionalNotes.isEmpty ? nil : additionalNotes
        )

        var filing = viewModel.createDraft(
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            county: selectedCounty.displayName,
            formType: selectedFormType,
            caseNumber: caseNumber.isEmpty ? nil : caseNumber
        )

        // Update metadata
        filing.metadata = metadata

        do {
            if submitImmediately {
                try await viewModel.submitFiling(filing)
            } else {
                // Just add to local list for now (draft)
                viewModel.filings.append(filing)
            }

            await MainActor.run {
                isSubmitting = false
                dismiss()
            }
        } catch {
            await MainActor.run {
                isSubmitting = false
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
}

// MARK: - Help Item Component

struct HelpItem: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.bold())

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Preview

#Preview {
    AddFilingView(viewModel: FilingViewModel())
}
