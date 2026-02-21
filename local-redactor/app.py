import json
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, Response, render_template, request

from redaction_engine import (
    RedactionOptions,
    build_redacted_docx,
    build_redacted_pdf,
    extract_text_from_docx,
    extract_text_from_pdf_with_ocr,
    redact_pdf_native,
    redact_text_with_report,
    sha256_bytes,
)

app = Flask(__name__)


def _bool(form: dict, name: str, default: bool = False) -> bool:
    if name not in form:
        return default
    return form.get(name) in {"on", "true", "1", "yes"}


def _response_download(data: bytes, filename: str, mimetype: str) -> Response:
    return Response(
        data,
        mimetype=mimetype,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.get("/")
def index() -> str:
    return render_template("index.html")


@app.post("/redact")
def redact() -> Response:
    upload = request.files.get("file")
    if upload is None or not upload.filename:
        return Response("Missing file upload", status=400)

    payload = upload.read()
    ext = upload.filename.lower().split(".")[-1]
    if ext not in {"pdf", "docx"}:
        return Response("Only .pdf and .docx files are supported", status=400)

    enable_ocr_fallback = _bool(request.form, "enable_ocr_fallback", default=True)
    use_native_pdf_redaction = _bool(request.form, "use_native_pdf_redaction", default=True)

    if ext == "pdf":
        source_text, used_ocr = extract_text_from_pdf_with_ocr(payload, enable_ocr_fallback)
    else:
        source_text = extract_text_from_docx(payload)
        used_ocr = False

    custom_terms_raw = request.form.get("custom_terms", "")
    custom_terms = tuple(
        term.strip()
        for chunk in custom_terms_raw.splitlines()
        for term in chunk.split(",")
        if term.strip()
    )

    options = RedactionOptions(
        redact_emails=_bool(request.form, "redact_emails", default=True),
        redact_phones=_bool(request.form, "redact_phones", default=True),
        redact_ssn_tax_ids=_bool(request.form, "redact_ssn_tax_ids", default=True),
        redact_addresses=_bool(request.form, "redact_addresses", default=True),
        redact_names=_bool(request.form, "redact_names", default=True),
        redact_dob=_bool(request.form, "redact_dob", default=True),
        redact_passport_numbers=_bool(request.form, "redact_passport_numbers", default=True),
        redact_claim_numbers=_bool(request.form, "redact_claim_numbers", default=True),
        redact_medical_record_numbers=_bool(
            request.form, "redact_medical_record_numbers", default=True
        ),
        custom_terms=custom_terms,
    )

    result = redact_text_with_report(source_text, options)

    docx_bytes = build_redacted_docx(result.redacted_text)
    fallback_pdf_bytes = build_redacted_pdf(result.redacted_text)

    native_pdf_bytes = None
    native_pdf_error = None
    if ext == "pdf" and use_native_pdf_redaction:
        native_pdf_bytes, native_pdf_error = redact_pdf_native(payload, options)

    selected_pdf_bytes = native_pdf_bytes if native_pdf_bytes else fallback_pdf_bytes

    report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "filename": upload.filename,
        "matter_id": request.form.get("matter_id", ""),
        "reviewer": request.form.get("reviewer", ""),
        "ocr_used": used_ocr,
        "native_pdf_redaction_requested": use_native_pdf_redaction,
        "native_pdf_redaction_used": bool(native_pdf_bytes),
        "native_pdf_redaction_error": native_pdf_error,
        "replacement_counts": result.replacement_counts,
        "total_replacements": result.total_replacements,
        "redaction_options": options.__dict__,
        "source_sha256": sha256_bytes(payload),
        "redacted_text_sha256": sha256_bytes(result.redacted_text.encode("utf-8")),
        "redacted_pdf_sha256": sha256_bytes(selected_pdf_bytes),
    }

    if _bool(request.form, "auto_log", default=True):
        logs_dir = Path("audit_logs")
        logs_dir.mkdir(exist_ok=True)
        with (logs_dir / "redaction_events.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps(report) + "\n")

    action = request.form.get("action", "report")
    if action == "download_docx":
        return _response_download(
            docx_bytes,
            "redacted_output.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    if action == "download_pdf":
        return _response_download(selected_pdf_bytes, "redacted_output.pdf", "application/pdf")

    if action == "preview":
        preview = {
            "warning": "Assisted redaction only. Perform manual legal QA.",
            "total_replacements": result.total_replacements,
            "replacement_counts": result.replacement_counts,
            "ocr_used": used_ocr,
            "native_pdf_redaction_used": bool(native_pdf_bytes),
            "native_pdf_redaction_error": native_pdf_error,
            "redacted_text_preview": result.redacted_text[:10000],
        }
        return Response(json.dumps(preview, indent=2), mimetype="application/json")

    return Response(json.dumps(report, indent=2), mimetype="application/json")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
