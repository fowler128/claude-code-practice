"""
Google Sheets tool for lead management.
"""
import logging
from datetime import datetime
from typing import Any, Optional
import uuid

from googleapiclient.discovery import build

from .base import GoogleBaseTool, ToolDefinition

logger = logging.getLogger(__name__)


class SheetsTool(GoogleBaseTool):
    """Tool for managing leads in Google Sheets."""

    SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

    # Column mapping (1-indexed for Sheets API)
    COLUMNS = {
        "timestamp": "A",
        "leadKey": "B",
        "name": "C",
        "email": "D",
        "phone": "E",
        "firmName": "F",
        "practiceArea": "G",
        "monthlyLeads": "H",
        "primaryNeed": "I",
        "status": "J",
        "bookingLink": "K",
        "lastEmailSent": "L",
        "followUpStage": "M",
        "notes": "N",
        "conversationHistory": "O",
        "aiAnalysis": "P",
        "priority": "Q",
        "qualificationScore": "R",
    }

    @property
    def definitions(self) -> list[ToolDefinition]:
        return [
            ToolDefinition(
                name="get_all_leads",
                description="Get all leads from the spreadsheet. Returns a list of lead objects with all their data.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "status_filter": {
                            "type": "string",
                            "description": "Optional: Filter leads by status (e.g., 'NEW_SUBMISSION', 'BOOKING_INVITE_SENT')",
                        }
                    },
                    "required": [],
                },
            ),
            ToolDefinition(
                name="get_lead_by_email",
                description="Get a specific lead by their email address.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "email": {
                            "type": "string",
                            "description": "The email address of the lead to retrieve",
                        }
                    },
                    "required": ["email"],
                },
            ),
            ToolDefinition(
                name="update_lead_status",
                description="Update the status of a lead. Use this to progress leads through the funnel.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "email": {
                            "type": "string",
                            "description": "The email address of the lead",
                        },
                        "status": {
                            "type": "string",
                            "description": "The new status (e.g., 'BOOKING_INVITE_SENT', 'BOOKED', 'QUALIFIED')",
                        },
                    },
                    "required": ["email", "status"],
                },
            ),
            ToolDefinition(
                name="update_lead_field",
                description="Update a specific field for a lead.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "email": {
                            "type": "string",
                            "description": "The email address of the lead",
                        },
                        "field": {
                            "type": "string",
                            "description": "The field to update (e.g., 'notes', 'followUpStage', 'lastEmailSent')",
                        },
                        "value": {
                            "type": "string",
                            "description": "The new value for the field",
                        },
                    },
                    "required": ["email", "field", "value"],
                },
            ),
            ToolDefinition(
                name="add_lead_note",
                description="Append a note to a lead's notes field with timestamp.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "email": {
                            "type": "string",
                            "description": "The email address of the lead",
                        },
                        "note": {
                            "type": "string",
                            "description": "The note to add",
                        },
                    },
                    "required": ["email", "note"],
                },
            ),
            ToolDefinition(
                name="record_email_sent",
                description="Record that an email was sent to a lead. Updates lastEmailSent timestamp.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "email": {
                            "type": "string",
                            "description": "The email address of the lead",
                        },
                        "email_type": {
                            "type": "string",
                            "description": "Type of email sent (e.g., 'booking_invite', 'follow_up_1', 'checklist')",
                        },
                    },
                    "required": ["email", "email_type"],
                },
            ),
            ToolDefinition(
                name="get_leads_needing_follow_up",
                description="Get leads that may need a follow-up based on time since last contact.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "min_hours": {
                            "type": "number",
                            "description": "Minimum hours since last email (default: 24)",
                        }
                    },
                    "required": [],
                },
            ),
            ToolDefinition(
                name="save_conversation_history",
                description="Save or update the conversation history for a lead.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "email": {
                            "type": "string",
                            "description": "The email address of the lead",
                        },
                        "conversation": {
                            "type": "string",
                            "description": "JSON string of conversation history",
                        },
                    },
                    "required": ["email", "conversation"],
                },
            ),
            ToolDefinition(
                name="save_ai_analysis",
                description="Save AI analysis results for a lead (priority, qualification, etc.).",
                input_schema={
                    "type": "object",
                    "properties": {
                        "email": {
                            "type": "string",
                            "description": "The email address of the lead",
                        },
                        "analysis": {
                            "type": "string",
                            "description": "JSON string of AI analysis results",
                        },
                        "priority": {
                            "type": "string",
                            "description": "Lead priority (high, medium, low)",
                        },
                        "qualification_score": {
                            "type": "number",
                            "description": "Qualification score (0-100)",
                        },
                    },
                    "required": ["email", "analysis"],
                },
            ),
        ]

    def _get_service(self):
        """Get or create the Sheets API service."""
        if self._service is None:
            creds = self._get_credentials()
            self._service = build("sheets", "v4", credentials=creds)
        return self._service

    def _get_all_rows(self) -> list[list]:
        """Get all rows from the sheet."""
        service = self._get_service()
        result = service.spreadsheets().values().get(
            spreadsheetId=self.config.spreadsheet_id,
            range=f"{self.config.sheet_name}!A:R",
        ).execute()
        return result.get("values", [])

    def _row_to_lead(self, row: list, headers: list) -> dict:
        """Convert a row to a lead dictionary."""
        lead = {}
        for i, header in enumerate(headers):
            if i < len(row):
                lead[header] = row[i]
            else:
                lead[header] = ""
        return lead

    def _find_row_by_email(self, email: str) -> Optional[int]:
        """Find the row number for a lead by email. Returns 1-indexed row number."""
        rows = self._get_all_rows()
        if not rows:
            return None

        email_col_index = list(self.COLUMNS.keys()).index("email")
        for i, row in enumerate(rows[1:], start=2):  # Skip header, start at row 2
            if len(row) > email_col_index and row[email_col_index].lower() == email.lower():
                return i
        return None

    def _update_cell(self, row: int, column: str, value: Any):
        """Update a specific cell."""
        service = self._get_service()
        col_letter = self.COLUMNS.get(column)
        if not col_letter:
            raise ValueError(f"Unknown column: {column}")

        range_name = f"{self.config.sheet_name}!{col_letter}{row}"
        service.spreadsheets().values().update(
            spreadsheetId=self.config.spreadsheet_id,
            range=range_name,
            valueInputOption="USER_ENTERED",
            body={"values": [[value]]},
        ).execute()

    def execute(self, tool_name: str, **kwargs) -> Any:
        """Execute a sheets tool."""
        method = getattr(self, f"_execute_{tool_name}", None)
        if method is None:
            raise ValueError(f"Unknown tool: {tool_name}")
        return method(**kwargs)

    def _execute_get_all_leads(self, status_filter: str = None) -> list[dict]:
        """Get all leads, optionally filtered by status."""
        rows = self._get_all_rows()
        if not rows:
            return []

        headers = rows[0]
        leads = []
        for row in rows[1:]:
            lead = self._row_to_lead(row, headers)
            if status_filter is None or lead.get("status") == status_filter:
                leads.append(lead)

        return leads

    def _execute_get_lead_by_email(self, email: str) -> Optional[dict]:
        """Get a specific lead by email."""
        rows = self._get_all_rows()
        if not rows:
            return None

        headers = rows[0]
        for row in rows[1:]:
            lead = self._row_to_lead(row, headers)
            if lead.get("email", "").lower() == email.lower():
                return lead

        return None

    def _execute_update_lead_status(self, email: str, status: str) -> dict:
        """Update a lead's status."""
        row_num = self._find_row_by_email(email)
        if row_num is None:
            return {"success": False, "error": f"Lead not found: {email}"}

        self._update_cell(row_num, "status", status)
        logger.info(f"Updated lead {email} status to {status}")
        return {"success": True, "email": email, "new_status": status}

    def _execute_update_lead_field(self, email: str, field: str, value: str) -> dict:
        """Update a specific field for a lead."""
        if field not in self.COLUMNS:
            return {"success": False, "error": f"Unknown field: {field}"}

        row_num = self._find_row_by_email(email)
        if row_num is None:
            return {"success": False, "error": f"Lead not found: {email}"}

        self._update_cell(row_num, field, value)
        logger.info(f"Updated lead {email} field {field}")
        return {"success": True, "email": email, "field": field, "value": value}

    def _execute_add_lead_note(self, email: str, note: str) -> dict:
        """Append a note to a lead's notes."""
        lead = self._execute_get_lead_by_email(email)
        if lead is None:
            return {"success": False, "error": f"Lead not found: {email}"}

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        existing_notes = lead.get("notes", "")
        new_notes = f"{existing_notes}\n[{timestamp}] {note}".strip()

        return self._execute_update_lead_field(email, "notes", new_notes)

    def _execute_record_email_sent(self, email: str, email_type: str) -> dict:
        """Record that an email was sent."""
        row_num = self._find_row_by_email(email)
        if row_num is None:
            return {"success": False, "error": f"Lead not found: {email}"}

        timestamp = datetime.now().isoformat()
        self._update_cell(row_num, "lastEmailSent", timestamp)

        # Add note about email
        self._execute_add_lead_note(email, f"Sent email: {email_type}")

        return {"success": True, "email": email, "email_type": email_type, "timestamp": timestamp}

    def _execute_get_leads_needing_follow_up(self, min_hours: float = 24) -> list[dict]:
        """Get leads that may need follow-up."""
        leads = self._execute_get_all_leads()
        now = datetime.now()
        needs_follow_up = []

        for lead in leads:
            status = lead.get("status", "")
            # Only check leads in follow-up eligible statuses
            if status not in ["BOOKING_INVITE_SENT", "FOLLOW_UP_1", "FOLLOW_UP_2"]:
                continue

            last_email = lead.get("lastEmailSent")
            if not last_email:
                continue

            try:
                last_email_time = datetime.fromisoformat(last_email.replace("Z", "+00:00"))
                hours_since = (now - last_email_time.replace(tzinfo=None)).total_seconds() / 3600
                if hours_since >= min_hours:
                    lead["hours_since_last_contact"] = hours_since
                    needs_follow_up.append(lead)
            except (ValueError, TypeError):
                # Skip if can't parse timestamp
                continue

        return needs_follow_up

    def _execute_save_conversation_history(self, email: str, conversation: str) -> dict:
        """Save conversation history for a lead."""
        return self._execute_update_lead_field(email, "conversationHistory", conversation)

    def _execute_save_ai_analysis(
        self,
        email: str,
        analysis: str,
        priority: str = None,
        qualification_score: float = None,
    ) -> dict:
        """Save AI analysis for a lead."""
        results = [self._execute_update_lead_field(email, "aiAnalysis", analysis)]

        if priority:
            results.append(self._execute_update_lead_field(email, "priority", priority))

        if qualification_score is not None:
            results.append(
                self._execute_update_lead_field(email, "qualificationScore", str(qualification_score))
            )

        return {"success": all(r.get("success") for r in results), "results": results}
