"""
Google Calendar tool for booking detection.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Optional

from googleapiclient.discovery import build

from .base import GoogleBaseTool, ToolDefinition

logger = logging.getLogger(__name__)


class CalendarTool(GoogleBaseTool):
    """Tool for detecting and managing calendar bookings."""

    SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

    @property
    def definitions(self) -> list[ToolDefinition]:
        return [
            ToolDefinition(
                name="get_upcoming_events",
                description="Get upcoming calendar events. Use this to check for new bookings.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "days_ahead": {
                            "type": "number",
                            "description": "How many days ahead to look (default: 7)",
                        },
                        "max_results": {
                            "type": "number",
                            "description": "Maximum events to return (default: 20)",
                        },
                    },
                    "required": [],
                },
            ),
            ToolDefinition(
                name="find_booking_by_email",
                description="Check if a specific lead has booked by searching calendar events for their email.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "email": {
                            "type": "string",
                            "description": "The lead's email address to search for",
                        },
                        "days_ahead": {
                            "type": "number",
                            "description": "How many days ahead to search (default: 30)",
                        },
                    },
                    "required": ["email"],
                },
            ),
            ToolDefinition(
                name="get_recent_bookings",
                description="Get recently created calendar events (new bookings). Checks for events created in the last N hours.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "hours_back": {
                            "type": "number",
                            "description": "How many hours back to check for new bookings (default: 24)",
                        },
                    },
                    "required": [],
                },
            ),
            ToolDefinition(
                name="get_events_for_date",
                description="Get all events scheduled for a specific date.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "date": {
                            "type": "string",
                            "description": "Date in YYYY-MM-DD format",
                        },
                    },
                    "required": ["date"],
                },
            ),
            ToolDefinition(
                name="check_event_attendees",
                description="Get the attendees of a specific calendar event.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "event_id": {
                            "type": "string",
                            "description": "The calendar event ID",
                        },
                    },
                    "required": ["event_id"],
                },
            ),
        ]

    def _get_service(self):
        """Get or create the Calendar API service."""
        if self._service is None:
            creds = self._get_credentials()
            self._service = build("calendar", "v3", credentials=creds)
        return self._service

    def _parse_event(self, event: dict) -> dict:
        """Parse a calendar event into a simplified format."""
        start = event.get("start", {})
        end = event.get("end", {})

        # Handle all-day events vs time-specific events
        start_time = start.get("dateTime", start.get("date", ""))
        end_time = end.get("dateTime", end.get("date", ""))

        attendees = event.get("attendees", [])
        attendee_emails = [a.get("email", "") for a in attendees]

        return {
            "id": event.get("id"),
            "summary": event.get("summary", ""),
            "description": event.get("description", ""),
            "start": start_time,
            "end": end_time,
            "created": event.get("created", ""),
            "updated": event.get("updated", ""),
            "status": event.get("status", ""),
            "attendees": attendee_emails,
            "organizer": event.get("organizer", {}).get("email", ""),
            "html_link": event.get("htmlLink", ""),
            "location": event.get("location", ""),
        }

    def execute(self, tool_name: str, **kwargs) -> Any:
        """Execute a calendar tool."""
        method = getattr(self, f"_execute_{tool_name}", None)
        if method is None:
            raise ValueError(f"Unknown tool: {tool_name}")
        return method(**kwargs)

    def _execute_get_upcoming_events(
        self,
        days_ahead: int = 7,
        max_results: int = 20,
    ) -> list[dict]:
        """Get upcoming calendar events."""
        service = self._get_service()

        now = datetime.utcnow()
        time_min = now.isoformat() + "Z"
        time_max = (now + timedelta(days=days_ahead)).isoformat() + "Z"

        try:
            events_result = service.events().list(
                calendarId=self.config.calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                maxResults=max_results,
                singleEvents=True,
                orderBy="startTime",
            ).execute()

            events = events_result.get("items", [])
            return [self._parse_event(e) for e in events]

        except Exception as e:
            logger.error(f"Failed to get upcoming events: {e}")
            return []

    def _execute_find_booking_by_email(
        self,
        email: str,
        days_ahead: int = 30,
    ) -> Optional[dict]:
        """Find a booking for a specific email address."""
        service = self._get_service()

        now = datetime.utcnow()
        time_min = now.isoformat() + "Z"
        time_max = (now + timedelta(days=days_ahead)).isoformat() + "Z"

        try:
            events_result = service.events().list(
                calendarId=self.config.calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                maxResults=100,
                singleEvents=True,
                orderBy="startTime",
            ).execute()

            events = events_result.get("items", [])

            for event in events:
                # Check attendees
                attendees = event.get("attendees", [])
                for attendee in attendees:
                    if attendee.get("email", "").lower() == email.lower():
                        parsed = self._parse_event(event)
                        parsed["matched_attendee"] = email
                        return parsed

                # Check description/summary for email
                description = event.get("description", "").lower()
                summary = event.get("summary", "").lower()
                if email.lower() in description or email.lower() in summary:
                    parsed = self._parse_event(event)
                    parsed["matched_in"] = "description_or_summary"
                    return parsed

            return None

        except Exception as e:
            logger.error(f"Failed to find booking: {e}")
            return None

    def _execute_get_recent_bookings(self, hours_back: float = 24) -> list[dict]:
        """Get recently created events (new bookings)."""
        service = self._get_service()

        # Look for events in the future that were recently created
        now = datetime.utcnow()
        time_min = now.isoformat() + "Z"
        time_max = (now + timedelta(days=60)).isoformat() + "Z"
        updated_min = (now - timedelta(hours=hours_back)).isoformat() + "Z"

        try:
            events_result = service.events().list(
                calendarId=self.config.calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                updatedMin=updated_min,
                maxResults=50,
                singleEvents=True,
                orderBy="updated",
            ).execute()

            events = events_result.get("items", [])
            recent = []

            for event in events:
                # Check if this is likely an AI Readiness booking
                summary = event.get("summary", "").lower()
                description = event.get("description", "").lower()

                # Look for keywords that indicate this is our booking
                keywords = ["ai readiness", "diagnostic", "audit", "bizdeedz", "scorecard"]
                is_our_booking = any(kw in summary or kw in description for kw in keywords)

                # Also check if it has external attendees
                attendees = event.get("attendees", [])
                has_external_attendee = any(
                    not a.get("self", False) for a in attendees
                )

                if is_our_booking or has_external_attendee:
                    recent.append(self._parse_event(event))

            return recent

        except Exception as e:
            logger.error(f"Failed to get recent bookings: {e}")
            return []

    def _execute_get_events_for_date(self, date: str) -> list[dict]:
        """Get all events for a specific date."""
        service = self._get_service()

        try:
            # Parse the date
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            time_min = date_obj.isoformat() + "Z"
            time_max = (date_obj + timedelta(days=1)).isoformat() + "Z"

            events_result = service.events().list(
                calendarId=self.config.calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy="startTime",
            ).execute()

            events = events_result.get("items", [])
            return [self._parse_event(e) for e in events]

        except Exception as e:
            logger.error(f"Failed to get events for date: {e}")
            return []

    def _execute_check_event_attendees(self, event_id: str) -> dict:
        """Get attendees for a specific event."""
        service = self._get_service()

        try:
            event = service.events().get(
                calendarId=self.config.calendar_id,
                eventId=event_id,
            ).execute()

            attendees = event.get("attendees", [])
            return {
                "event_id": event_id,
                "summary": event.get("summary", ""),
                "attendees": [
                    {
                        "email": a.get("email"),
                        "name": a.get("displayName", ""),
                        "response_status": a.get("responseStatus", ""),
                        "is_organizer": a.get("organizer", False),
                    }
                    for a in attendees
                ],
            }

        except Exception as e:
            logger.error(f"Failed to get event attendees: {e}")
            return {"error": str(e)}
