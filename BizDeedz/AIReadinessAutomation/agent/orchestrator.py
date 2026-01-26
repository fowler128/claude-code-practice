"""
Main orchestrator for the autonomous lead nurturing agent.

This module coordinates all agent activities and provides the main entry point.
"""
import logging
import time
from datetime import datetime
from typing import Optional

from .agent import LeadNurturingAgent
from .config import AgentConfig, load_config
from .memory import AgentMemory
from .tools.sheets import SheetsTool
from .tools.gmail import GmailTool
from .tools.calendar import CalendarTool
from .handlers.new_lead import NewLeadHandler
from .handlers.reply import ReplyHandler
from .handlers.booking import BookingHandler
from .handlers.followup import FollowUpHandler

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Main orchestrator that coordinates all agent activities.

    The orchestrator:
    1. Initializes all components (agent, tools, handlers)
    2. Runs the main processing loop
    3. Handles errors and retries
    4. Logs all activity
    """

    def __init__(self, config: AgentConfig = None):
        """Initialize the orchestrator with configuration."""
        self.config = config or load_config()

        # Validate configuration
        errors = self.config.validate()
        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")

        # Initialize components
        self._init_components()

        logger.info("AgentOrchestrator initialized successfully")

    def _init_components(self):
        """Initialize all agent components."""
        # Memory system
        self.memory = AgentMemory(self.config.memory_db_path)

        # Tools
        self.sheets = SheetsTool(self.config)
        self.gmail = GmailTool(self.config)
        self.calendar = CalendarTool(self.config)

        # Core agent
        self.agent = LeadNurturingAgent(self.config)

        # Handlers
        self.new_lead_handler = NewLeadHandler(
            agent=self.agent,
            memory=self.memory,
            sheets=self.sheets,
            gmail=self.gmail,
        )

        self.reply_handler = ReplyHandler(
            agent=self.agent,
            memory=self.memory,
            sheets=self.sheets,
            gmail=self.gmail,
        )

        self.booking_handler = BookingHandler(
            agent=self.agent,
            memory=self.memory,
            sheets=self.sheets,
            gmail=self.gmail,
            calendar=self.calendar,
        )

        self.follow_up_handler = FollowUpHandler(
            agent=self.agent,
            memory=self.memory,
            sheets=self.sheets,
            gmail=self.gmail,
            config=self.config,
        )

    def run_once(self) -> dict:
        """
        Run a single processing cycle.

        Returns a summary of all actions taken.
        """
        logger.info("Starting processing cycle")
        start_time = datetime.now()

        results = {
            "timestamp": start_time.isoformat(),
            "new_leads": [],
            "replies": [],
            "bookings": [],
            "follow_ups": [],
            "errors": [],
        }

        # 1. Process new leads
        try:
            logger.info("Processing new leads...")
            results["new_leads"] = self.new_lead_handler.process_new_leads()
            logger.info(f"Processed {len(results['new_leads'])} new leads")
        except Exception as e:
            logger.error(f"Error processing new leads: {e}")
            results["errors"].append({"stage": "new_leads", "error": str(e)})

        # 2. Process email replies
        try:
            logger.info("Processing email replies...")
            results["replies"] = self.reply_handler.process_replies()
            logger.info(f"Processed {len(results['replies'])} replies")
        except Exception as e:
            logger.error(f"Error processing replies: {e}")
            results["errors"].append({"stage": "replies", "error": str(e)})

        # 3. Detect and process bookings
        try:
            logger.info("Processing bookings...")
            results["bookings"] = self.booking_handler.process_bookings()
            logger.info(f"Processed {len(results['bookings'])} bookings")
        except Exception as e:
            logger.error(f"Error processing bookings: {e}")
            results["errors"].append({"stage": "bookings", "error": str(e)})

        # 4. Process follow-ups
        try:
            logger.info("Processing follow-ups...")
            results["follow_ups"] = self.follow_up_handler.process_follow_ups()
            logger.info(f"Processed {len(results['follow_ups'])} follow-up decisions")
        except Exception as e:
            logger.error(f"Error processing follow-ups: {e}")
            results["errors"].append({"stage": "follow_ups", "error": str(e)})

        # Calculate summary
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        results["summary"] = {
            "duration_seconds": round(duration, 2),
            "total_new_leads_processed": len(results["new_leads"]),
            "total_replies_processed": len(results["replies"]),
            "total_bookings_detected": len([b for b in results["bookings"] if b.get("booked")]),
            "total_follow_ups_sent": len([f for f in results["follow_ups"] if "sent" in f.get("action", "")]),
            "total_errors": len(results["errors"]),
        }

        logger.info(f"Processing cycle complete in {duration:.2f}s")
        logger.info(f"Summary: {results['summary']}")

        return results

    def run_continuous(self, interval_seconds: int = None):
        """
        Run the agent continuously with a polling interval.

        Args:
            interval_seconds: Override the default polling interval
        """
        interval = interval_seconds or self.config.polling_interval_seconds

        logger.info(f"Starting continuous agent loop with {interval}s interval")

        try:
            while True:
                try:
                    results = self.run_once()

                    # Log summary
                    summary = results.get("summary", {})
                    if summary.get("total_errors", 0) > 0:
                        logger.warning(f"Cycle completed with {summary['total_errors']} errors")

                except Exception as e:
                    logger.error(f"Error in processing cycle: {e}")

                # Wait for next cycle
                logger.info(f"Waiting {interval} seconds until next cycle...")
                time.sleep(interval)

        except KeyboardInterrupt:
            logger.info("Agent stopped by user")
        finally:
            self.shutdown()

    def shutdown(self):
        """Clean up resources."""
        logger.info("Shutting down agent...")
        self.memory.close()
        logger.info("Agent shutdown complete")

    # Convenience methods for manual operations

    def process_new_leads(self) -> list[dict]:
        """Manually trigger new lead processing."""
        return self.new_lead_handler.process_new_leads()

    def process_replies(self, hours_back: float = 6) -> list[dict]:
        """Manually trigger reply processing."""
        return self.reply_handler.process_replies(hours_back)

    def process_bookings(self, hours_back: float = 24) -> list[dict]:
        """Manually trigger booking detection."""
        return self.booking_handler.process_bookings(hours_back)

    def process_follow_ups(self) -> list[dict]:
        """Manually trigger follow-up processing."""
        return self.follow_up_handler.process_follow_ups()

    def get_lead_status(self, email: str) -> Optional[dict]:
        """Get current status and history for a lead."""
        lead_data = self.sheets.execute("get_lead_by_email", email=email)
        if not lead_data:
            return None

        conversation = self.memory.get_conversation(email)
        recent_actions = self.memory.get_recent_actions(lead_email=email, limit=10)
        analysis = self.memory.get_analysis(email)

        return {
            "lead_data": lead_data,
            "conversation_messages": len(conversation),
            "recent_actions": [
                {
                    "action": a.action_type,
                    "timestamp": a.timestamp,
                    "success": a.success,
                }
                for a in recent_actions
            ],
            "ai_analysis": analysis,
        }

    def get_follow_up_schedule(self) -> list[dict]:
        """Get the current follow-up schedule."""
        return self.follow_up_handler.get_follow_up_schedule()

    def get_pipeline_summary(self) -> dict:
        """Get a summary of the current lead pipeline."""
        all_leads = self.sheets.execute("get_all_leads")

        # Count by status
        status_counts = {}
        for lead in all_leads:
            status = lead.get("status", "UNKNOWN")
            status_counts[status] = status_counts.get(status, 0) + 1

        # Count by priority
        priority_counts = {"high": 0, "medium": 0, "low": 0, "unset": 0}
        for lead in all_leads:
            priority = lead.get("priority", "").lower()
            if priority in priority_counts:
                priority_counts[priority] += 1
            else:
                priority_counts["unset"] += 1

        return {
            "total_leads": len(all_leads),
            "by_status": status_counts,
            "by_priority": priority_counts,
            "follow_up_queue": len(self.get_follow_up_schedule()),
        }
