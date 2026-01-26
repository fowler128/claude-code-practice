"""
Handler for booking detection and post-booking flow.
"""
import logging
import re
from datetime import datetime
from typing import Optional

from ..agent import LeadNurturingAgent
from ..memory import AgentMemory, ConversationMessage, AgentAction
from ..state import LeadStateMachine, LeadState
from ..tools.sheets import SheetsTool
from ..tools.gmail import GmailTool
from ..tools.calendar import CalendarTool

logger = logging.getLogger(__name__)


class BookingHandler:
    """
    Handles booking detection and post-booking flow.

    Flow:
    1. Check calendar for new bookings
    2. Match bookings to leads
    3. Update lead status to BOOKED
    4. Send pre-call checklist
    """

    def __init__(
        self,
        agent: LeadNurturingAgent,
        memory: AgentMemory,
        sheets: SheetsTool,
        gmail: GmailTool,
        calendar: CalendarTool,
    ):
        self.agent = agent
        self.memory = memory
        self.sheets = sheets
        self.gmail = gmail
        self.calendar = calendar
        self.state_machine = LeadStateMachine()

    def process_bookings(self, hours_back: float = 24) -> list[dict]:
        """
        Detect and process new bookings.

        Returns list of results for each processed booking.
        """
        results = []

        # Get recent bookings from calendar
        recent_bookings = self.calendar.execute("get_recent_bookings", hours_back=hours_back)

        logger.info(f"Found {len(recent_bookings)} recent calendar events")

        for booking in recent_bookings:
            try:
                result = self.process_single_booking(booking)
                if result:
                    results.append(result)
            except Exception as e:
                logger.error(f"Error processing booking: {e}")
                results.append({
                    "event_id": booking.get("id"),
                    "success": False,
                    "error": str(e),
                })

        # Also check leads who might have booked (by checking their email in calendar)
        leads_in_follow_up = self._get_leads_awaiting_booking()
        for lead in leads_in_follow_up:
            try:
                result = self.check_lead_for_booking(lead)
                if result and result.get("booked"):
                    results.append(result)
            except Exception as e:
                logger.error(f"Error checking lead for booking: {e}")

        return results

    def _get_leads_awaiting_booking(self) -> list[dict]:
        """Get leads who are in states where they might book."""
        all_leads = self.sheets.execute("get_all_leads")
        awaiting_states = [
            LeadState.BOOKING_INVITE_SENT.value,
            LeadState.FOLLOW_UP_1.value,
            LeadState.FOLLOW_UP_2.value,
            LeadState.FOLLOW_UP_3.value,
            LeadState.CONVERSATION_ACTIVE.value,
        ]
        return [l for l in all_leads if l.get("status") in awaiting_states]

    def check_lead_for_booking(self, lead_data: dict) -> Optional[dict]:
        """Check if a specific lead has booked."""
        email = lead_data.get("email")

        # Check if we've already detected a booking for this lead
        if self.memory.was_action_taken(email, "detect_booking", since_hours=168):  # 7 days
            return None

        # Search calendar for this lead's email
        booking = self.calendar.execute("find_booking_by_email", email=email)

        if booking:
            return self._handle_detected_booking(lead_data, booking)

        return {"email": email, "booked": False}

    def process_single_booking(self, booking: dict) -> Optional[dict]:
        """Process a single calendar booking event."""
        event_id = booking.get("id")
        attendees = booking.get("attendees", [])

        if not attendees:
            logger.debug(f"Booking {event_id} has no attendees")
            return None

        # Try to match each attendee to a lead
        for attendee_email in attendees:
            lead_data = self.sheets.execute("get_lead_by_email", email=attendee_email)
            if lead_data:
                # Found a matching lead
                current_status = lead_data.get("status")

                # Check if already booked
                if current_status in [LeadState.BOOKED.value, LeadState.CHECKLIST_SENT.value]:
                    continue

                return self._handle_detected_booking(lead_data, booking)

        return None

    def _handle_detected_booking(self, lead_data: dict, booking: dict) -> dict:
        """Handle a detected booking for a lead."""
        email = lead_data.get("email")

        logger.info(f"Detected booking for lead: {email}")

        # Update status to BOOKED
        self.sheets.execute("update_lead_status", email=email, status=LeadState.BOOKED.value)

        # Add note about the booking
        booking_time = booking.get("start", "Unknown time")
        self.sheets.execute(
            "add_lead_note",
            email=email,
            note=f"Booking detected: {booking.get('summary')} at {booking_time}",
        )

        # Record the action
        self.memory.record_action(AgentAction(
            action_type="detect_booking",
            lead_email=email,
            timestamp=datetime.now().isoformat(),
            details={
                "event_id": booking.get("id"),
                "event_summary": booking.get("summary"),
                "event_start": booking_time,
            },
            result={"status": "booked"},
            success=True,
        ))

        # Send pre-call checklist
        checklist_result = self.send_pre_call_checklist(lead_data, booking)

        return {
            "email": email,
            "success": True,
            "booked": True,
            "action": "booking_detected",
            "event_id": booking.get("id"),
            "booking_time": booking_time,
            "checklist_sent": checklist_result.get("success"),
        }

    def send_pre_call_checklist(self, lead_data: dict, booking: dict = None) -> dict:
        """Send the pre-call checklist email."""
        email = lead_data.get("email")

        # Check if we've already sent the checklist
        if self.memory.was_action_taken(email, "send_checklist", since_hours=168):
            logger.info(f"Checklist already sent to {email}")
            return {"success": True, "already_sent": True}

        # Get conversation history for personalization
        conversation_history = [
            msg.to_dict() for msg in self.memory.get_conversation(email)
        ]

        # Build context
        additional_context = ""
        if booking:
            additional_context = f"Booked for: {booking.get('start', 'TBD')}"

        # Generate personalized checklist email
        email_content = self.agent.generate_email(
            lead_data=lead_data,
            email_type="pre_call_checklist",
            conversation_history=conversation_history,
            additional_context=additional_context,
        )

        # Send email
        send_result = self.gmail.execute(
            "send_email",
            to_email=email,
            subject=email_content["subject"],
            body=email_content["body"],
        )

        if send_result.get("success"):
            # Record the message
            self.memory.add_message(
                lead_email=email,
                message=ConversationMessage(
                    role="agent",
                    content=email_content["body"],
                    timestamp=datetime.now().isoformat(),
                    email_id=send_result.get("message_id"),
                    email_subject=email_content["subject"],
                    metadata={"email_type": "pre_call_checklist"},
                ),
            )

            # Record the action
            self.memory.record_action(AgentAction(
                action_type="send_checklist",
                lead_email=email,
                timestamp=datetime.now().isoformat(),
                details={"subject": email_content["subject"]},
                result=send_result,
                success=True,
            ))

            # Update status
            self.sheets.execute(
                "update_lead_status",
                email=email,
                status=LeadState.CHECKLIST_SENT.value,
            )
            self.sheets.execute("record_email_sent", email=email, email_type="pre_call_checklist")

            logger.info(f"Sent pre-call checklist to {email}")

        return {
            "email": email,
            "success": send_result.get("success", False),
            "message_id": send_result.get("message_id"),
        }

    def process_leads_needing_checklist(self) -> list[dict]:
        """
        Process leads who are BOOKED but haven't received checklist.

        This handles cases where booking was manually set.
        """
        results = []

        all_leads = self.sheets.execute("get_all_leads", status_filter=LeadState.BOOKED.value)

        for lead_data in all_leads:
            email = lead_data.get("email")

            # Check if checklist already sent
            if not self.memory.was_action_taken(email, "send_checklist", since_hours=168):
                result = self.send_pre_call_checklist(lead_data)
                results.append(result)

        return results
