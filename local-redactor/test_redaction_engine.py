import unittest

from redaction_engine import RedactionOptions, redact_text, redact_text_with_report, sha256_bytes


class RedactionEngineTests(unittest.TestCase):
    def test_redacts_common_sensitive_fields(self):
        text = (
            "John Smith lives at 123 Main Street, Denver. "
            "Email john@example.com or call (555) 123-4567. "
            "SSN 111-22-3333 and EIN 12-3456789."
        )
        out = redact_text(text, RedactionOptions(redact_passport_numbers=False))
        self.assertIn("[REDACTED_EMAIL]", out)
        self.assertIn("[REDACTED_PHONE]", out)
        self.assertIn("[REDACTED_SSN]", out)
        self.assertIn("[REDACTED_TAX_ID]", out)

    def test_custom_terms(self):
        out = redact_text(
            "Project Falcon belongs to Acme Corp",
            RedactionOptions(
                redact_names=False,
                redact_passport_numbers=False,
                custom_terms=("Project Falcon", "Acme Corp"),
            ),
        )
        self.assertNotIn("Project Falcon", out)
        self.assertNotIn("Acme Corp", out)
        self.assertIn("[REDACTED_CUSTOM]", out)

    def test_report_counts(self):
        out = redact_text_with_report(
            "Contact jane@example.com and jane@example.com",
            RedactionOptions(
                redact_phones=False,
                redact_ssn_tax_ids=False,
                redact_addresses=False,
                redact_names=False,
                redact_dob=False,
                redact_passport_numbers=False,
                redact_claim_numbers=False,
                redact_medical_record_numbers=False,
            ),
        )
        self.assertEqual(out.replacement_counts["emails"], 2)
        self.assertEqual(out.total_replacements, 2)

    def test_new_legal_patterns(self):
        text = "DOB 01/31/1990 Passport A1234567 Claim: ABCD-123456 MRN: ZX-998877"
        out = redact_text(
            text,
            RedactionOptions(
                redact_emails=False,
                redact_phones=False,
                redact_ssn_tax_ids=False,
                redact_addresses=False,
                redact_names=False,
            ),
        )
        self.assertIn("[REDACTED_DOB]", out)
        self.assertIn("[REDACTED_PASSPORT]", out)
        self.assertIn("[REDACTED_CLAIM]", out)
        self.assertIn("[REDACTED_MRN]", out)

    def test_hashing_helper(self):
        self.assertEqual(sha256_bytes(b"abc"), sha256_bytes(b"abc"))


if __name__ == "__main__":
    unittest.main()
