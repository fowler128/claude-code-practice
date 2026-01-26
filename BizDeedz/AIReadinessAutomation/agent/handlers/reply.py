"""
Handler for email replies from leads.
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

logger = logging.getLogger(__name__)


class ReplyHandler:
    """
    Handles email replies from leads.

    Flow:
    1. Check for new replies in inbox
    2. Match replies to leads
    3. Analyze intent (book, question, pause, unsubscribe)
    4. Generate and send appropriate response
    5. Update lead status
    """

    def __init__(
        self,
        agent: LeadNurturingAgent,
        memory: AgentMemory,
        sheets: SheetsTool,
        gmail: GmailTool,
    ):
        self.agent = agent
        self.memory = memory
        self.sheets = sheets
        self.gmail = gmail
        self.state_machine = LeadStateMachine()

    def process_replies(self, hours_back: float = 6) -> list[dict]:
        """
        Process new email replies.

        Returns list of results for each processed reply.
        """
        results = []

        # Get recent replies
        replies = self.gmail.execute("get_recent_replies", hours_back=hours_back)

        logger.info(f"Found {len(replies)} potential replies to process")

        for reply in replies:
            try:
                result = self.process_single_reply(reply)
                if result:  # Only append if we actually processed it
                    results.append(result)
            except Exception as e:
                logger.error(f"Error processing reply: {e}")
                results.append({
                    "email_id": reply.get("id"),
                    "success": False,
                    "error": str(e),
                })

        return results

    def _extract_email_address(self, from_field: str) -> Optional[str]:
        """Extract email address from 'From' field."""
        match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", from_field)
        return match.group() if match else None

    def process_single_reply(self, reply: dict) -> Optional[dict]:
        """Process a single reply email."""
        email_id = reply.get("id")
        from_field = reply.get("from", "")
        sender_email = self._extract_email_address(from_field)

        if not sender_email:
            logger.warning(f"Could not extract email from: {from_field}")
            return None

        # Check if this is from a lead we know
        lead_data = self.sheets.execute("get_lead_by_email", email=sender_email)
        if not lead_data:
            logger.info(f"Reply from unknown sender: {sender_email}")
            return None

        # Check if we've already processed this reply
        if self.memory.was_action_taken(sender_email, f"process_reply_{email_id}", since_hours=24):
            logger.debug(f"Already processed reply {email_id}")
            return None

        logger.info(f"Processing reply from lead: {sender_email}")

        reply_content = reply.get("body", reply.get("snippet", ""))
        reply_subject = reply.get("subject", "")

        # Record the incoming message
        self.memory.add_message(
            lead_email=sender_email,
            message=ConversationMessage(
                role="lead",
                content=reply_content,
                timestamp=datetime.now().isoformat(),
                email_id=email_id,
                email_subject=reply_subject,
            ),
        )

        # Get conversation history for context
        conversation_history = [
            msg.to_dict() for msg in self.memory.get_conversation(sender_email)
        ]

        # Analyze the reply with AI
        analysis = self.agent.handle_reply(
            lead_data=lead_data,
            reply_content=reply_content,
            conversation_history=conversation_history,
        )

        action = analysis.get("action", "respond")
        logger.info(f"Reply analysis for {sender_email}: action={action}")

        # Handle based on action
        result = self._handle_action(
            action=action,
            analysis=analysis,
            lead_data=lead_data,
            reply=reply,
            conversation_history=conversation_history,
        )

        # Mark email as read
        self.gmail.execute("mark_as_read", message_id=email_id)

        # Record the action
        self.memory.record_action(AgentAction(
            action_type=f"process_reply_{email_id}",
            lead_email=sender_email,
            timestamp=datetime.now().isoformat(),
            details={
                "reply_subject": reply_subject,
                "analysis_action": action,
            },
            result=result,
            success=result.get("success", True),
        ))

        return result

    def _handle_action(
        self,
        action: str,
        analysis: dict,
        lead_data: dict,
        reply: dict,
        conversation_history: list,
    ) -> dict:
        """Handle the determined action for a reply."""
        email = lead_data.get("email")

        if action == "pause":
            return self._handle_pause(email, analysis)

        elif action == "unsubscribe":
            return self._handle_unsubscribe(email, analysis)

        elif action == "escalate":
            return self._handle_escalate(email, lead_data, analysis, reply)

        elif action == "book":
            # Lead indicated they want to book
            return self._handle_booking_intent(email, lead_data, analysis)

        else:  # Default: respond
            return self._handle_respond(email, lead_data, analysis, reply)

    def _handle_pause(self, email: str, analysis: dict) -> dict:
        """Handle pause request."""
        self.sheets.execute("update_lead_status", email=email, status=LeadState.PAUSED.value)
        self.sheets.execute("add_lead_note", email=email, note="Lead requested pause via email")

        # Send acknowledgment
        ack_email = {
            "subject": "Re: AI Readiness Scorecard",
            "body": """Hi,

Got it - I've paused all follow-ups. When you're ready to continue, just reply to this email.

- BizDeedz""",
        }

        send_result = self.gmail.execute(
            "send_email",
            to_email=email,
            subject=ack_email["subject"],
            body=ack_email["body"],
        )

        return {
            "email": email,
            "success": True,
            "action": "paused",
            "response_sent": send_result.get("success"),
        }

    def _handle_unsubscribe(self, email: str, analysis: dict) -> dict:
        """Handle unsubscribe request."""
        self.sheets.execute("update_lead_status", email=email, status=LeadState.UNSUBSCRIBED.value)
        self.sheets.execute("add_lead_note", email=email, note="Lead unsubscribed via email")

        # Send acknowledgment
        ack_email = {
            "subject": "Re: AI Readiness Scorecard",
            "body": """Hi,

You've been removed from our list. You won't receive any more emails from us about the AI Readiness Scorecard.

If you ever change your mind, feel free to reach out.

- BizDeedz""",
        }

        send_result = self.gmail.execute(
            "send_email",
            to_email=email,
            subject=ack_email["subject"],
            body=ack_email["body"],
        )

        return {
            "email": email,
            "success": True,
            "action": "unsubscribed",
            "response_sent": send_result.get("success"),
        }

    def _handle_escalate(
        self,
        email: str,
        lead_data: dict,
        analysis: dict,
        reply: dict,
    ) -> dict:
        """Handle escalation to human."""
        self.sheets.execute("update_lead_status", email=email, status=LeadState.ESCALATED.value)
        self.sheets.execute(
            "add_lead_note",
            email=email,
            note=f"Escalated: {analysis.get('notes', 'Complex reply needs human review')}",
        )

        # TODO: Send notification to escalation email if configured

        return {
            "email": email,
            "success": True,
            "action": "escalated",
            "reason": analysis.get("notes"),
        }

    def _handle_booking_intent(
        self,
        email: str,
        lead_data: dict,
        analysis: dict,
    ) -> dict:
        """Handle when lead indicates booking intent."""
        response_email = analysis.get("response_email", {})

        if not response_email:
            # Generate a booking-focused response
            response_email = self.agent.generate_email(
                lead_data=lead_data,
                email_type="booking_confirmation",
                additional_context="Lead expressed interest in booking",
            )

        send_result = self.gmail.execute(
            "send_email",
            to_email=email,
            subject=response_email.get("subject", "Re: AI Readiness Scorecard - Book Now"),
            body=response_email.get("body", ""),
        )

        if send_result.get("success"):
            self.memory.add_message(
                lead_email=email,
                message=ConversationMessage(
                    role="agent",
                    content=response_email.get("body", ""),
                    timestamp=datetime.now().isoformat(),
                    email_id=send_result.get("message_id"),
                    email_subject=response_email.get("subject"),
                    metadata={"email_type": "booking_intent_response"},
                ),
            )

        # Update status to conversation active
        self.sheets.execute(
            "update_lead_status",
            email=email,
            status=LeadState.CONVERSATION_ACTIVE.value,
        )

        return {
            "email": email,
            "success": True,
            "action": "booking_intent_response",
            "response_sent": send_result.get("success"),
        }

    def _handle_respond(
        self,
        email: str,
        lead_data: dict,
        analysis: dict,
        reply: dict,
    ) -> dict:
        """Handle general response to lead."""
        response_email = analysis.get("response_email", {})

        if not response_email or not response_email.get("body"):
            logger.warning(f"No response email in analysis for {email}")
            return {
                "email": email,
                "success": False,
                "error": "No response generated",
            }

        # Send the response
        send_result = self.gmail.execute(
            "send_email",
            to_email=email,
            subject=response_email.get("subject", "Re: AI Readiness Scorecard"),
            body=response_email.get("body"),
            reply_to_message_id=reply.get("id"),
        )

        if send_result.get("success"):
            # Record the outgoing message
            self.memory.add_message(
                lead_email=email,
                message=ConversationMessage(
                    role="agent",
                    content=response_email.get("body"),
                    timestamp=datetime.now().isoformat(),
                    email_id=send_result.get("message_id"),
                    email_subject=response_email.get("subject"),
                    metadata={"email_type": "reply_response"},
                ),
            )

            # Update status
            new_status = analysis.get("status_update")
            if new_status:
                self.sheets.execute("update_lead_status", email=email, status=new_status)
            else:
                self.sheets.execute(
                    "update_lead_status",
                    email=email,
                    status=LeadState.CONVERSATION_ACTIVE.value,
                )

            self.sheets.execute("record_email_sent", email=email, email_type="reply_response")

        return {
            "email": email,
            "success": send_result.get("success", False),
            "action": "responded",
            "message_id": send_result.get("message_id"),
        }
