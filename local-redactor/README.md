# Local Sensitive Data Redactor

A local-first tool for redacting sensitive text from uploaded **PDF** or **DOCX** files.

## Streamlit alternative

Yes — this implementation uses **Flask + HTML** instead of Streamlit.

## Recommendation for legal teams

For filings/productions, prefer **native PDF object-level redaction** when available. It is more defensible than plain text re-rendering because hidden PDF objects are removed from the redacted output. Always require human QA before release.

## Features

- Upload PDF or DOCX contracts.
- Redact:
  - Emails
  - Phone numbers
  - SSNs / Tax IDs
  - Postal addresses (pattern-based)
  - Likely person names (pattern-based)
  - Dates of birth
  - Passport numbers (pattern-based)
  - Claim/case references (pattern-based)
  - Medical record numbers (pattern-based)
  - Any custom terms you provide
- Optional OCR fallback for scanned PDFs.
- Native PDF object-level redaction path (PyMuPDF) for PDF inputs.
- Download redacted output as:
  - Editable DOCX
  - PDF
- JSON report output with redaction counts and file hashes.
- Append to a local JSONL audit trail (`audit_logs/redaction_events.jsonl`) with hashes.

## Run locally

```bash
cd local-redactor
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# OCR fallback also requires system Tesseract binary installed
python app.py
```

Open: `http://localhost:8000`

## Legal and operational precautions

- Treat output as **assisted redaction**, not final legal redaction.
- Require manual review prior to filing, production, or client distribution.
- Keep unredacted originals in restricted storage with role-based access.
- Document redaction settings and reviewer sign-off for chain of custody.
- For scanned PDFs, ensure OCR dependencies are installed and verify extraction quality.
- Validate whether your jurisdiction/client requires specific redaction standards.

## Notes

- This app runs locally and does not require external API calls.
- Name/address and some ID detection is heuristic and may produce false positives/negatives.
