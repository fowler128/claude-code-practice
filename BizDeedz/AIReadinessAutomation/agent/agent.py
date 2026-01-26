"""
Core autonomous agent using Claude with tool use.
"""
import json
import logging
from typing import Any, Callable
from dataclasses import dataclass, field

import anthropic

from .config import AgentConfig

logger = logging.getLogger(__name__)


@dataclass
class Tool:
    """Definition of a tool the agent can use."""
    name: str
    description: str
    input_schema: dict
    handler: Callable[..., Any]


@dataclass
class AgentResponse:
    """Response from the agent."""
    action: str
    content: str
    tool_calls: list[dict] = field(default_factory=list)
    tool_results: list[dict] = field(default_factory=list)
    reasoning: str = ""
    confidence: float = 1.0


class LeadNurturingAgent:
    """
    Autonomous agent for end-to-end lead nurturing.

    This agent can:
    - Analyze new leads and determine optimal engagement strategy
    - Personalize all communications based on lead context
    - Handle email replies conversationally
    - Detect bookings and trigger appropriate follow-ups
    - Make autonomous decisions about timing and content
    - Qualify leads through intelligent conversation
    - Escalate when human intervention is needed
    """

    def __init__(self, config: AgentConfig, tools: list[Tool] = None):
        self.config = config
        self.client = anthropic.Anthropic(api_key=config.anthropic_api_key)
        self.tools = tools or []
        self._tool_handlers = {tool.name: tool.handler for tool in self.tools}

    def _get_tool_definitions(self) -> list[dict]:
        """Convert tools to Anthropic API format."""
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "input_schema": tool.input_schema,
            }
            for tool in self.tools
        ]

    def _execute_tool(self, tool_name: str, tool_input: dict) -> Any:
        """Execute a tool and return the result."""
        if tool_name not in self._tool_handlers:
            return {"error": f"Unknown tool: {tool_name}"}

        try:
            handler = self._tool_handlers[tool_name]
            result = handler(**tool_input)
            logger.info(f"Tool {tool_name} executed successfully")
            return result
        except Exception as e:
            logger.error(f"Tool {tool_name} failed: {e}")
            return {"error": str(e)}

    def run(
        self,
        system_prompt: str,
        user_message: str,
        context: dict = None,
        max_iterations: int = 10,
    ) -> AgentResponse:
        """
        Run the agent with a task.

        The agent will use tools as needed to complete the task,
        iterating until done or max_iterations is reached.
        """
        messages = []
        tool_calls = []
        tool_results = []

        # Add context to the user message if provided
        if context:
            context_str = f"\n\nContext:\n```json\n{json.dumps(context, indent=2, default=str)}\n```"
            user_message = user_message + context_str

        messages.append({"role": "user", "content": user_message})

        for iteration in range(max_iterations):
            logger.debug(f"Agent iteration {iteration + 1}/{max_iterations}")

            # Call Claude
            response = self.client.messages.create(
                model=self.config.model,
                max_tokens=self.config.max_tokens,
                system=system_prompt,
                tools=self._get_tool_definitions() if self.tools else None,
                messages=messages,
            )

            # Check stop reason
            if response.stop_reason == "end_turn":
                # Agent is done, extract final response
                final_text = ""
                for block in response.content:
                    if hasattr(block, "text"):
                        final_text += block.text

                return AgentResponse(
                    action="complete",
                    content=final_text,
                    tool_calls=tool_calls,
                    tool_results=tool_results,
                )

            elif response.stop_reason == "tool_use":
                # Agent wants to use tools
                assistant_content = response.content
                messages.append({"role": "assistant", "content": assistant_content})

                # Process each tool use
                tool_use_results = []
                for block in assistant_content:
                    if block.type == "tool_use":
                        tool_name = block.name
                        tool_input = block.input
                        tool_use_id = block.id

                        logger.info(f"Agent using tool: {tool_name}")
                        tool_calls.append({
                            "tool": tool_name,
                            "input": tool_input,
                        })

                        # Execute the tool
                        result = self._execute_tool(tool_name, tool_input)
                        tool_results.append({
                            "tool": tool_name,
                            "result": result,
                        })

                        tool_use_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": json.dumps(result, default=str),
                        })

                # Add tool results to messages
                messages.append({"role": "user", "content": tool_use_results})

            else:
                # Unexpected stop reason
                logger.warning(f"Unexpected stop reason: {response.stop_reason}")
                return AgentResponse(
                    action="error",
                    content=f"Unexpected stop reason: {response.stop_reason}",
                    tool_calls=tool_calls,
                    tool_results=tool_results,
                )

        # Max iterations reached
        logger.warning("Agent reached max iterations")
        return AgentResponse(
            action="max_iterations",
            content="Agent reached maximum iterations without completing the task.",
            tool_calls=tool_calls,
            tool_results=tool_results,
        )

    def analyze_lead(self, lead_data: dict) -> dict:
        """
        Analyze a new lead and determine engagement strategy.

        Returns:
            dict with keys: priority, personalization_notes, recommended_approach
        """
        from .prompts.system import LEAD_ANALYSIS_PROMPT

        response = self.run(
            system_prompt=LEAD_ANALYSIS_PROMPT,
            user_message="Analyze this lead and provide engagement recommendations.",
            context=lead_data,
            max_iterations=3,
        )

        try:
            # Try to parse JSON from response
            import re
            json_match = re.search(r"\{[\s\S]*\}", response.content)
            if json_match:
                return json.loads(json_match.group())
        except (json.JSONDecodeError, AttributeError):
            pass

        return {
            "priority": "medium",
            "personalization_notes": response.content,
            "recommended_approach": "standard",
        }

    def generate_email(
        self,
        lead_data: dict,
        email_type: str,
        conversation_history: list = None,
        additional_context: str = None,
    ) -> dict:
        """
        Generate a personalized email for a lead.

        Args:
            lead_data: Lead information
            email_type: Type of email (booking_invite, follow_up, checklist, etc.)
            conversation_history: Previous email exchanges
            additional_context: Any additional context

        Returns:
            dict with keys: subject, body
        """
        from .prompts.system import EMAIL_GENERATION_PROMPT

        context = {
            "lead": lead_data,
            "email_type": email_type,
            "conversation_history": conversation_history or [],
            "booking_link": self.config.booking_link,
            "from_name": self.config.from_name,
        }

        if additional_context:
            context["additional_context"] = additional_context

        response = self.run(
            system_prompt=EMAIL_GENERATION_PROMPT,
            user_message=f"Generate a {email_type} email for this lead.",
            context=context,
            max_iterations=3,
        )

        try:
            import re
            json_match = re.search(r"\{[\s\S]*\}", response.content)
            if json_match:
                return json.loads(json_match.group())
        except (json.JSONDecodeError, AttributeError):
            pass

        # Fallback: try to extract subject and body
        lines = response.content.strip().split("\n")
        subject = "AI Readiness Scorecard - Next Steps"
        body = response.content

        for i, line in enumerate(lines):
            if line.lower().startswith("subject:"):
                subject = line[8:].strip()
                body = "\n".join(lines[i + 1 :]).strip()
                break

        return {"subject": subject, "body": body}

    def handle_reply(
        self,
        lead_data: dict,
        reply_content: str,
        conversation_history: list,
    ) -> dict:
        """
        Handle an email reply from a lead.

        Returns:
            dict with keys: action, response_email, status_update, notes
            action can be: respond, book, escalate, pause, unsubscribe
        """
        from .prompts.system import REPLY_HANDLING_PROMPT

        context = {
            "lead": lead_data,
            "reply": reply_content,
            "conversation_history": conversation_history,
            "booking_link": self.config.booking_link,
        }

        response = self.run(
            system_prompt=REPLY_HANDLING_PROMPT,
            user_message="Analyze this reply and determine the appropriate response.",
            context=context,
            max_iterations=5,
        )

        try:
            import re
            json_match = re.search(r"\{[\s\S]*\}", response.content)
            if json_match:
                return json.loads(json_match.group())
        except (json.JSONDecodeError, AttributeError):
            pass

        return {
            "action": "respond",
            "response_email": {
                "subject": "Re: AI Readiness Scorecard",
                "body": response.content,
            },
            "status_update": None,
            "notes": "Generated response",
        }

    def decide_follow_up(
        self,
        lead_data: dict,
        hours_since_last_contact: float,
        follow_up_count: int,
        conversation_history: list = None,
    ) -> dict:
        """
        Decide whether and how to follow up with a lead.

        Returns:
            dict with keys: should_follow_up, wait_hours, email (if should_follow_up)
        """
        from .prompts.system import FOLLOW_UP_DECISION_PROMPT

        context = {
            "lead": lead_data,
            "hours_since_last_contact": hours_since_last_contact,
            "follow_up_count": follow_up_count,
            "max_follow_ups": self.config.max_follow_ups,
            "standard_intervals": self.config.follow_up_hours,
            "conversation_history": conversation_history or [],
        }

        response = self.run(
            system_prompt=FOLLOW_UP_DECISION_PROMPT,
            user_message="Should we follow up with this lead? If yes, what should we say?",
            context=context,
            max_iterations=3,
        )

        try:
            import re
            json_match = re.search(r"\{[\s\S]*\}", response.content)
            if json_match:
                return json.loads(json_match.group())
        except (json.JSONDecodeError, AttributeError):
            pass

        return {
            "should_follow_up": False,
            "reason": response.content,
        }

    def qualify_lead(self, lead_data: dict, conversation_history: list) -> dict:
        """
        Qualify a lead based on conversation and available data.

        Returns:
            dict with keys: qualified, score, reasons, next_steps
        """
        from .prompts.system import QUALIFICATION_PROMPT

        context = {
            "lead": lead_data,
            "conversation_history": conversation_history,
        }

        response = self.run(
            system_prompt=QUALIFICATION_PROMPT,
            user_message="Qualify this lead based on the available information.",
            context=context,
            max_iterations=3,
        )

        try:
            import re
            json_match = re.search(r"\{[\s\S]*\}", response.content)
            if json_match:
                return json.loads(json_match.group())
        except (json.JSONDecodeError, AttributeError):
            pass

        return {
            "qualified": True,
            "score": 50,
            "reasons": [response.content],
            "next_steps": "Continue nurturing",
        }
