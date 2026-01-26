"""
Configuration for the AI Readiness Lead Nurturing Agent.
"""
import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class AgentConfig:
    """Main configuration for the autonomous agent."""

    # Anthropic API
    anthropic_api_key: str = field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", ""))
    model: str = "claude-sonnet-4-20250514"
    max_tokens: int = 4096

    # Google API
    google_credentials_path: str = field(
        default_factory=lambda: os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")
    )
    google_token_path: str = field(
        default_factory=lambda: os.getenv("GOOGLE_TOKEN_PATH", "token.json")
    )

    # Google Sheet
    spreadsheet_id: str = field(default_factory=lambda: os.getenv("SPREADSHEET_ID", ""))
    sheet_name: str = "Leads"

    # Gmail
    from_name: str = "BizDeedz"
    from_email: str = field(default_factory=lambda: os.getenv("FROM_EMAIL", ""))

    # Calendar
    booking_link: str = field(default_factory=lambda: os.getenv("BOOKING_LINK", ""))
    calendar_id: str = field(default_factory=lambda: os.getenv("CALENDAR_ID", "primary"))

    # Agent behavior
    polling_interval_seconds: int = 300  # 5 minutes
    follow_up_hours: list = field(default_factory=lambda: [24, 72, 168])  # 24h, 72h, 7d
    max_follow_ups: int = 3

    # Memory and state
    memory_db_path: str = field(
        default_factory=lambda: os.getenv("MEMORY_DB_PATH", "agent_memory.db")
    )

    # Logging
    log_level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    log_file: Optional[str] = field(default_factory=lambda: os.getenv("LOG_FILE"))

    # Human-in-the-loop
    require_approval_for_emails: bool = False
    escalation_email: str = field(default_factory=lambda: os.getenv("ESCALATION_EMAIL", ""))

    def validate(self) -> list[str]:
        """Validate configuration and return list of errors."""
        errors = []

        if not self.anthropic_api_key:
            errors.append("ANTHROPIC_API_KEY is required")
        if not self.spreadsheet_id:
            errors.append("SPREADSHEET_ID is required")
        if not self.from_email:
            errors.append("FROM_EMAIL is required")
        if not self.booking_link:
            errors.append("BOOKING_LINK is required")

        return errors


@dataclass
class LeadStatus:
    """Standard lead statuses."""
    NEW_SUBMISSION = "NEW_SUBMISSION"
    ANALYZING = "ANALYZING"
    BOOKING_INVITE_SENT = "BOOKING_INVITE_SENT"
    FOLLOW_UP_1 = "FOLLOW_UP_1"
    FOLLOW_UP_2 = "FOLLOW_UP_2"
    FOLLOW_UP_3 = "FOLLOW_UP_3"
    REPLY_RECEIVED = "REPLY_RECEIVED"
    CONVERSATION_ACTIVE = "CONVERSATION_ACTIVE"
    BOOKED = "BOOKED"
    CHECKLIST_SENT = "CHECKLIST_SENT"
    CALL_COMPLETED = "CALL_COMPLETED"
    QUALIFIED = "QUALIFIED"
    NOT_A_FIT = "NOT_A_FIT"
    SCORECARD_DELIVERED = "SCORECARD_DELIVERED"
    PAUSED = "PAUSED"
    UNSUBSCRIBED = "UNSUBSCRIBED"
    ESCALATED = "ESCALATED"


# Google API Scopes
GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar.readonly",
]


def load_config() -> AgentConfig:
    """Load configuration from environment variables."""
    return AgentConfig()
