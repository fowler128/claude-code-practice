"""
Handler for new lead submissions.
"""
import logging
from datetime import datetime
from typing import Optional

from ..agent import LeadNurturingAgent
from ..memory import AgentMemory, ConversationMessage, AgentAction
from ..state import LeadStateMachine, LeadContext, LeadState
from ..tools.sheets import SheetsTool
from ..tools.gmail import GmailTool

logger = logging.getLogger(__name__)


class NewLeadHandler:
    """
    Handles new lead submissions.

    Flow:
    1. Detect new leads (status = NEW_SUBMISSION)
    2. Analyze lead with AI (determine priority, personalization)
    3. Generate personalized booking invite
    4. Send email
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

    def process_new_leads(self) -> list[dict]:
        """
        Process all new lead submissions.

        Returns list of results for each processed lead.
        """
        results = []

        # Get all leads with NEW_SUBMISSION status
        new_leads = self.sheets.execute("get_all_leads", status_filter="NEW_SUBMISSION")

        logger.info(f"Found {len(new_leads)} new leads to process")

        for lead_data in new_leads:
            try:
                result = self.process_single_lead(lead_data)
                results.append(result)
            except Exception as e:
                logger.error(f"Error processing lead {lead_data.get('email')}: {e}")
                results.append({
                    "email": lead_data.get("email"),
                    "success": False,
                    "error": str(e),
                })

        return results

    def process_single_lead(self, lead_data: dict) -> dict:
        """Process a single new lead."""
        email = lead_data.get("email")
        logger.info(f"Processing new lead: {email}")

        # 1. Update status to ANALYZING
        self.sheets.execute("update_lead_status", email=email, status=LeadState.ANALYZING.value)

        # 2. Analyze lead with AI
        analysis = self.agent.analyze_lead(lead_data)
        logger.info(f"Lead analysis for {email}: priority={analysis.get('priority')}")

        # Save analysis
        self.memory.save_analysis(
            lead_email=email,
            analysis=analysis,
            priority=analysis.get("priority"),
            qualification_score=analysis.get("score"),
        )

        # Also save to sheet
        self.sheets.execute(
            "save_ai_analysis",
            email=email,
            analysis=str(analysis),
            priority=analysis.get("priority"),
            qualification_score=analysis.get("score"),
        )

        # 3. Generate personalized booking invite
        email_content = self.agent.generate_email(
            lead_data=lead_data,
            email_type="booking_invite",
            additional_context=f"AI Analysis: {analysis.get('personalization_notes', '')}",
        )

        # 4. Send email
        send_result = self.gmail.execute(
            "send_email",
            to_email=email,
            subject=email_content["subject"],
            body=email_content["body"],
        )

        if not send_result.get("success"):
            logger.error(f"Failed to send email to {email}: {send_result.get('error')}")
            return {
                "email": email,
                "success": False,
                "error": send_result.get("error"),
            }

        # 5. Record the conversation
        self.memory.add_message(
            lead_email=email,
            message=ConversationMessage(
                role="agent",
                content=email_content["body"],
                timestamp=datetime.now().isoformat(),
                email_id=send_result.get("message_id"),
                email_subject=email_content["subject"],
                metadata={"email_type": "booking_invite"},
            ),
        )

        # 6. Record the action
        self.memory.record_action(AgentAction(
            action_type="send_booking_invite",
            lead_email=email,
            timestamp=datetime.now().isoformat(),
            details={
                "subject": email_content["subject"],
                "analysis": analysis,
            },
            result=send_result,
            success=True,
        ))

        # 7. Update lead status
        self.sheets.execute(
            "update_lead_status",
            email=email,
            status=LeadState.BOOKING_INVITE_SENT.value,
        )
        self.sheets.execute("record_email_sent", email=email, email_type="booking_invite")

        logger.info(f"Successfully processed new lead: {email}")

        return {
            "email": email,
            "success": True,
            "action": "booking_invite_sent",
            "priority": analysis.get("priority"),
            "message_id": send_result.get("message_id"),
        }
