"""
Handler for follow-up emails.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from ..agent import LeadNurturingAgent
from ..memory import AgentMemory, ConversationMessage, AgentAction
from ..state import LeadStateMachine, LeadState
from ..tools.sheets import SheetsTool
from ..tools.gmail import GmailTool

logger = logging.getLogger(__name__)


class FollowUpHandler:
    """
    Handles follow-up email decisions and sending.

    Flow:
    1. Get leads eligible for follow-up
    2. For each lead, use AI to decide if/when to follow up
    3. Generate personalized follow-up content
    4. Send follow-up and update status
    """

    def __init__(
        self,
        agent: LeadNurturingAgent,
        memory: AgentMemory,
        sheets: SheetsTool,
        gmail: GmailTool,
        config,
    ):
        self.agent = agent
        self.memory = memory
        self.sheets = sheets
        self.gmail = gmail
        self.config = config
        self.state_machine = LeadStateMachine()

    def process_follow_ups(self) -> list[dict]:
        """
        Process all leads that may need follow-up.

        Returns list of results for each processed lead.
        """
        results = []

        # Get leads that might need follow-up
        eligible_leads = self._get_eligible_leads()

        logger.info(f"Found {len(eligible_leads)} leads eligible for follow-up check")

        for lead_data in eligible_leads:
            try:
                result = self.process_single_lead(lead_data)
                results.append(result)
            except Exception as e:
                logger.error(f"Error processing follow-up for {lead_data.get('email')}: {e}")
                results.append({
                    "email": lead_data.get("email"),
                    "success": False,
                    "error": str(e),
                })

        return results

    def _get_eligible_leads(self) -> list[dict]:
        """Get leads that are eligible for follow-up."""
        all_leads = self.sheets.execute("get_all_leads")

        eligible_statuses = [
            LeadState.BOOKING_INVITE_SENT.value,
            LeadState.FOLLOW_UP_1.value,
            LeadState.FOLLOW_UP_2.value,
        ]

        eligible = []
        now = datetime.now()

        for lead in all_leads:
            status = lead.get("status")
            if status not in eligible_statuses:
                continue

            # Check time since last email
            last_email = lead.get("lastEmailSent")
            if not last_email:
                continue

            try:
                last_email_time = datetime.fromisoformat(
                    last_email.replace("Z", "+00:00").replace("+00:00", "")
                )
                hours_since = (now - last_email_time).total_seconds() / 3600

                # Only include if enough time has passed (min 12 hours)
                if hours_since >= 12:
                    lead["_hours_since_last_contact"] = hours_since
                    eligible.append(lead)

            except (ValueError, TypeError) as e:
                logger.warning(f"Could not parse last email time for {lead.get('email')}: {e}")

        return eligible

    def process_single_lead(self, lead_data: dict) -> dict:
        """Process follow-up decision for a single lead."""
        email = lead_data.get("email")
        current_status = lead_data.get("status")
        hours_since = lead_data.get("_hours_since_last_contact", 0)
        follow_up_stage = self.state_machine.get_follow_up_stage(current_status)

        logger.info(
            f"Checking follow-up for {email}: stage={follow_up_stage}, "
            f"hours_since_contact={hours_since:.1f}"
        )

        # Get conversation history
        conversation_history = [
            msg.to_dict() for msg in self.memory.get_conversation(email)
        ]

        # Use AI to decide on follow-up
        decision = self.agent.decide_follow_up(
            lead_data=lead_data,
            hours_since_last_contact=hours_since,
            follow_up_count=follow_up_stage,
            conversation_history=conversation_history,
        )

        should_follow_up = decision.get("should_follow_up", False)

        if not should_follow_up:
            logger.info(f"AI decided not to follow up with {email}: {decision.get('reason')}")
            return {
                "email": email,
                "success": True,
                "action": "no_follow_up",
                "reason": decision.get("reason"),
            }

        # Check for recommended wait time
        wait_hours = decision.get("wait_hours")
        if wait_hours and hours_since < wait_hours:
            logger.info(f"AI recommends waiting {wait_hours}h, currently at {hours_since:.1f}h")
            return {
                "email": email,
                "success": True,
                "action": "wait",
                "wait_until_hours": wait_hours,
                "current_hours": hours_since,
            }

        # Send follow-up
        return self.send_follow_up(lead_data, follow_up_stage, decision)

    def send_follow_up(
        self,
        lead_data: dict,
        current_stage: int,
        ai_decision: dict,
    ) -> dict:
        """Send a follow-up email."""
        email = lead_data.get("email")
        next_stage = current_stage + 1

        # Check if we've hit max follow-ups
        if next_stage > self.config.max_follow_ups:
            logger.info(f"Max follow-ups reached for {email}")
            return {
                "email": email,
                "success": True,
                "action": "max_follow_ups_reached",
            }

        # Get conversation history for context
        conversation_history = [
            msg.to_dict() for msg in self.memory.get_conversation(email)
        ]

        # Generate follow-up email (use AI-provided content or generate new)
        if ai_decision.get("email"):
            email_content = ai_decision["email"]
        else:
            email_content = self.agent.generate_email(
                lead_data=lead_data,
                email_type=f"follow_up_{next_stage}",
                conversation_history=conversation_history,
            )

        # Send email
        send_result = self.gmail.execute(
            "send_email",
            to_email=email,
            subject=email_content.get("subject", f"Quick follow-up: AI Readiness diagnostic"),
            body=email_content.get("body", ""),
        )

        if not send_result.get("success"):
            logger.error(f"Failed to send follow-up to {email}")
            return {
                "email": email,
                "success": False,
                "error": send_result.get("error"),
            }

        # Record the message
        self.memory.add_message(
            lead_email=email,
            message=ConversationMessage(
                role="agent",
                content=email_content.get("body", ""),
                timestamp=datetime.now().isoformat(),
                email_id=send_result.get("message_id"),
                email_subject=email_content.get("subject"),
                metadata={"email_type": f"follow_up_{next_stage}"},
            ),
        )

        # Record the action
        self.memory.record_action(AgentAction(
            action_type=f"send_follow_up_{next_stage}",
            lead_email=email,
            timestamp=datetime.now().isoformat(),
            details={
                "stage": next_stage,
                "subject": email_content.get("subject"),
                "ai_reasoning": ai_decision.get("reason"),
            },
            result=send_result,
            success=True,
        ))

        # Update lead status
        new_status = self._get_next_follow_up_status(next_stage)
        self.sheets.execute("update_lead_status", email=email, status=new_status)
        self.sheets.execute("record_email_sent", email=email, email_type=f"follow_up_{next_stage}")
        self.sheets.execute("update_lead_field", email=email, field="followUpStage", value=str(next_stage))

        logger.info(f"Sent follow-up {next_stage} to {email}")

        return {
            "email": email,
            "success": True,
            "action": f"follow_up_{next_stage}_sent",
            "message_id": send_result.get("message_id"),
            "new_status": new_status,
        }

    def _get_next_follow_up_status(self, stage: int) -> str:
        """Get the status for a follow-up stage."""
        status_map = {
            1: LeadState.FOLLOW_UP_1.value,
            2: LeadState.FOLLOW_UP_2.value,
            3: LeadState.FOLLOW_UP_3.value,
        }
        return status_map.get(stage, LeadState.FOLLOW_UP_3.value)

    def get_follow_up_schedule(self) -> list[dict]:
        """
        Get a schedule of upcoming follow-ups.

        Returns list of leads with expected follow-up times.
        """
        eligible_leads = self._get_eligible_leads()
        schedule = []

        for lead in eligible_leads:
            email = lead.get("email")
            status = lead.get("status")
            hours_since = lead.get("_hours_since_last_contact", 0)
            stage = self.state_machine.get_follow_up_stage(status)

            # Determine next follow-up interval
            intervals = self.config.follow_up_hours
            if stage < len(intervals):
                next_interval = intervals[stage]
                hours_until = max(0, next_interval - hours_since)

                schedule.append({
                    "email": email,
                    "name": lead.get("name"),
                    "current_stage": stage,
                    "next_stage": stage + 1,
                    "hours_since_last_contact": round(hours_since, 1),
                    "hours_until_next_follow_up": round(hours_until, 1),
                    "target_interval_hours": next_interval,
                })

        # Sort by hours until follow-up
        schedule.sort(key=lambda x: x["hours_until_next_follow_up"])

        return schedule
