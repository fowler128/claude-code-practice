"""
Gmail tool for email operations.
"""
import base64
import logging
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Any, Optional

from googleapiclient.discovery import build

from .base import GoogleBaseTool, ToolDefinition

logger = logging.getLogger(__name__)


class GmailTool(GoogleBaseTool):
    """Tool for sending and reading emails via Gmail API."""

    SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

    @property
    def definitions(self) -> list[ToolDefinition]:
        return [
            ToolDefinition(
                name="send_email",
                description="Send an email to a lead. Use this for booking invites, follow-ups, and other communications.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "to_email": {
                            "type": "string",
                            "description": "Recipient email address",
                        },
                        "subject": {
                            "type": "string",
                            "description": "Email subject line",
                        },
                        "body": {
                            "type": "string",
                            "description": "Email body (plain text)",
                        },
                        "reply_to_message_id": {
                            "type": "string",
                            "description": "Optional: Message ID to reply to (for threading)",
                        },
                    },
                    "required": ["to_email", "subject", "body"],
                },
            ),
            ToolDefinition(
                name="get_recent_replies",
                description="Get recent email replies from leads. Checks inbox for responses to our emails.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "hours_back": {
                            "type": "number",
                            "description": "How many hours back to check (default: 24)",
                        },
                        "from_email": {
                            "type": "string",
                            "description": "Optional: Filter to emails from a specific address",
                        },
                    },
                    "required": [],
                },
            ),
            ToolDefinition(
                name="get_thread_by_email",
                description="Get the full email thread/conversation with a specific lead.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "email_address": {
                            "type": "string",
                            "description": "The lead's email address",
                        },
                        "max_messages": {
                            "type": "number",
                            "description": "Maximum messages to retrieve (default: 20)",
                        },
                    },
                    "required": ["email_address"],
                },
            ),
            ToolDefinition(
                name="check_for_unread",
                description="Check for unread emails that may need attention.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "label": {
                            "type": "string",
                            "description": "Optional: Gmail label to filter (default: INBOX)",
                        }
                    },
                    "required": [],
                },
            ),
            ToolDefinition(
                name="mark_as_read",
                description="Mark an email as read after processing.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "message_id": {
                            "type": "string",
                            "description": "The Gmail message ID to mark as read",
                        }
                    },
                    "required": ["message_id"],
                },
            ),
            ToolDefinition(
                name="search_emails",
                description="Search emails using Gmail query syntax.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Gmail search query (e.g., 'from:user@example.com subject:AI Readiness')",
                        },
                        "max_results": {
                            "type": "number",
                            "description": "Maximum results to return (default: 10)",
                        },
                    },
                    "required": ["query"],
                },
            ),
        ]

    def _get_service(self):
        """Get or create the Gmail API service."""
        if self._service is None:
            creds = self._get_credentials()
            self._service = build("gmail", "v1", credentials=creds)
        return self._service

    def _create_message(
        self,
        to: str,
        subject: str,
        body: str,
        reply_to_message_id: str = None,
        thread_id: str = None,
    ) -> dict:
        """Create an email message."""
        message = MIMEMultipart()
        message["to"] = to
        message["from"] = f"{self.config.from_name} <{self.config.from_email}>"
        message["subject"] = subject

        if reply_to_message_id:
            message["In-Reply-To"] = reply_to_message_id
            message["References"] = reply_to_message_id

        message.attach(MIMEText(body, "plain"))

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
        body_dict = {"raw": raw}

        if thread_id:
            body_dict["threadId"] = thread_id

        return body_dict

    def _parse_message(self, message: dict) -> dict:
        """Parse a Gmail message into a readable format."""
        headers = message.get("payload", {}).get("headers", [])
        header_dict = {h["name"].lower(): h["value"] for h in headers}

        # Get body
        body = ""
        payload = message.get("payload", {})

        if "body" in payload and payload["body"].get("data"):
            body = base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8")
        elif "parts" in payload:
            for part in payload["parts"]:
                if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
                    body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8")
                    break

        return {
            "id": message.get("id"),
            "thread_id": message.get("threadId"),
            "from": header_dict.get("from", ""),
            "to": header_dict.get("to", ""),
            "subject": header_dict.get("subject", ""),
            "date": header_dict.get("date", ""),
            "body": body,
            "snippet": message.get("snippet", ""),
            "labels": message.get("labelIds", []),
        }

    def execute(self, tool_name: str, **kwargs) -> Any:
        """Execute a Gmail tool."""
        method = getattr(self, f"_execute_{tool_name}", None)
        if method is None:
            raise ValueError(f"Unknown tool: {tool_name}")
        return method(**kwargs)

    def _execute_send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        reply_to_message_id: str = None,
    ) -> dict:
        """Send an email."""
        service = self._get_service()

        # If replying, try to get the thread ID
        thread_id = None
        if reply_to_message_id:
            try:
                original = service.users().messages().get(
                    userId="me", id=reply_to_message_id
                ).execute()
                thread_id = original.get("threadId")
            except Exception as e:
                logger.warning(f"Could not get thread for reply: {e}")

        message = self._create_message(
            to=to_email,
            subject=subject,
            body=body,
            reply_to_message_id=reply_to_message_id,
            thread_id=thread_id,
        )

        try:
            sent = service.users().messages().send(
                userId="me", body=message
            ).execute()
            logger.info(f"Sent email to {to_email}: {subject}")
            return {
                "success": True,
                "message_id": sent.get("id"),
                "thread_id": sent.get("threadId"),
                "to": to_email,
                "subject": subject,
            }
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return {"success": False, "error": str(e)}

    def _execute_get_recent_replies(
        self,
        hours_back: float = 24,
        from_email: str = None,
    ) -> list[dict]:
        """Get recent replies."""
        service = self._get_service()

        # Build query
        after_date = datetime.now() - timedelta(hours=hours_back)
        query = f"in:inbox after:{after_date.strftime('%Y/%m/%d')}"

        if from_email:
            query += f" from:{from_email}"

        # Also filter for replies to our emails
        query += f" to:{self.config.from_email}"

        try:
            results = service.users().messages().list(
                userId="me", q=query, maxResults=50
            ).execute()

            messages = results.get("messages", [])
            replies = []

            for msg in messages:
                full_msg = service.users().messages().get(
                    userId="me", id=msg["id"], format="full"
                ).execute()
                parsed = self._parse_message(full_msg)

                # Check if it's actually a reply (has "Re:" or is in a thread)
                if "re:" in parsed["subject"].lower() or len(messages) > 1:
                    replies.append(parsed)

            return replies

        except Exception as e:
            logger.error(f"Failed to get replies: {e}")
            return []

    def _execute_get_thread_by_email(
        self,
        email_address: str,
        max_messages: int = 20,
    ) -> list[dict]:
        """Get conversation thread with a specific email address."""
        service = self._get_service()

        query = f"(from:{email_address} OR to:{email_address})"

        try:
            results = service.users().messages().list(
                userId="me", q=query, maxResults=max_messages
            ).execute()

            messages = results.get("messages", [])
            thread = []

            for msg in messages:
                full_msg = service.users().messages().get(
                    userId="me", id=msg["id"], format="full"
                ).execute()
                thread.append(self._parse_message(full_msg))

            # Sort by date (oldest first)
            thread.sort(key=lambda x: x.get("date", ""))

            return thread

        except Exception as e:
            logger.error(f"Failed to get thread: {e}")
            return []

    def _execute_check_for_unread(self, label: str = "INBOX") -> list[dict]:
        """Check for unread emails."""
        service = self._get_service()

        query = f"in:{label} is:unread"

        try:
            results = service.users().messages().list(
                userId="me", q=query, maxResults=50
            ).execute()

            messages = results.get("messages", [])
            unread = []

            for msg in messages:
                full_msg = service.users().messages().get(
                    userId="me", id=msg["id"], format="full"
                ).execute()
                unread.append(self._parse_message(full_msg))

            return unread

        except Exception as e:
            logger.error(f"Failed to check unread: {e}")
            return []

    def _execute_mark_as_read(self, message_id: str) -> dict:
        """Mark a message as read."""
        service = self._get_service()

        try:
            service.users().messages().modify(
                userId="me",
                id=message_id,
                body={"removeLabelIds": ["UNREAD"]},
            ).execute()
            return {"success": True, "message_id": message_id}
        except Exception as e:
            logger.error(f"Failed to mark as read: {e}")
            return {"success": False, "error": str(e)}

    def _execute_search_emails(self, query: str, max_results: int = 10) -> list[dict]:
        """Search emails with a Gmail query."""
        service = self._get_service()

        try:
            results = service.users().messages().list(
                userId="me", q=query, maxResults=max_results
            ).execute()

            messages = results.get("messages", [])
            found = []

            for msg in messages:
                full_msg = service.users().messages().get(
                    userId="me", id=msg["id"], format="full"
                ).execute()
                found.append(self._parse_message(full_msg))

            return found

        except Exception as e:
            logger.error(f"Failed to search emails: {e}")
            return []
