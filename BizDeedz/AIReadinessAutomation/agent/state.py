"""
Lead state machine for managing lead lifecycle.
"""
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, Callable

logger = logging.getLogger(__name__)


class LeadState(Enum):
    """All possible lead states."""
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


@dataclass
class StateTransition:
    """Definition of a valid state transition."""
    from_state: LeadState
    to_state: LeadState
    trigger: str
    condition: Optional[Callable] = None
    action: Optional[Callable] = None


# Valid state transitions
TRANSITIONS = [
    # New lead flow
    StateTransition(LeadState.NEW_SUBMISSION, LeadState.ANALYZING, "analyze"),
    StateTransition(LeadState.ANALYZING, LeadState.BOOKING_INVITE_SENT, "send_booking_invite"),

    # Follow-up sequence
    StateTransition(LeadState.BOOKING_INVITE_SENT, LeadState.FOLLOW_UP_1, "send_follow_up_1"),
    StateTransition(LeadState.FOLLOW_UP_1, LeadState.FOLLOW_UP_2, "send_follow_up_2"),
    StateTransition(LeadState.FOLLOW_UP_2, LeadState.FOLLOW_UP_3, "send_follow_up_3"),

    # Reply handling (can happen from multiple states)
    StateTransition(LeadState.BOOKING_INVITE_SENT, LeadState.REPLY_RECEIVED, "receive_reply"),
    StateTransition(LeadState.FOLLOW_UP_1, LeadState.REPLY_RECEIVED, "receive_reply"),
    StateTransition(LeadState.FOLLOW_UP_2, LeadState.REPLY_RECEIVED, "receive_reply"),
    StateTransition(LeadState.FOLLOW_UP_3, LeadState.REPLY_RECEIVED, "receive_reply"),

    # Conversation flow
    StateTransition(LeadState.REPLY_RECEIVED, LeadState.CONVERSATION_ACTIVE, "engage_conversation"),
    StateTransition(LeadState.CONVERSATION_ACTIVE, LeadState.CONVERSATION_ACTIVE, "continue_conversation"),

    # Booking (can happen from multiple states)
    StateTransition(LeadState.BOOKING_INVITE_SENT, LeadState.BOOKED, "detect_booking"),
    StateTransition(LeadState.FOLLOW_UP_1, LeadState.BOOKED, "detect_booking"),
    StateTransition(LeadState.FOLLOW_UP_2, LeadState.BOOKED, "detect_booking"),
    StateTransition(LeadState.FOLLOW_UP_3, LeadState.BOOKED, "detect_booking"),
    StateTransition(LeadState.REPLY_RECEIVED, LeadState.BOOKED, "detect_booking"),
    StateTransition(LeadState.CONVERSATION_ACTIVE, LeadState.BOOKED, "detect_booking"),

    # Post-booking flow
    StateTransition(LeadState.BOOKED, LeadState.CHECKLIST_SENT, "send_checklist"),
    StateTransition(LeadState.CHECKLIST_SENT, LeadState.CALL_COMPLETED, "complete_call"),

    # Qualification
    StateTransition(LeadState.CALL_COMPLETED, LeadState.QUALIFIED, "qualify"),
    StateTransition(LeadState.CALL_COMPLETED, LeadState.NOT_A_FIT, "disqualify"),

    # Delivery
    StateTransition(LeadState.QUALIFIED, LeadState.SCORECARD_DELIVERED, "deliver_scorecard"),

    # Pause/Unsubscribe (from any active state)
    StateTransition(LeadState.BOOKING_INVITE_SENT, LeadState.PAUSED, "pause"),
    StateTransition(LeadState.FOLLOW_UP_1, LeadState.PAUSED, "pause"),
    StateTransition(LeadState.FOLLOW_UP_2, LeadState.PAUSED, "pause"),
    StateTransition(LeadState.FOLLOW_UP_3, LeadState.PAUSED, "pause"),
    StateTransition(LeadState.CONVERSATION_ACTIVE, LeadState.PAUSED, "pause"),

    StateTransition(LeadState.BOOKING_INVITE_SENT, LeadState.UNSUBSCRIBED, "unsubscribe"),
    StateTransition(LeadState.FOLLOW_UP_1, LeadState.UNSUBSCRIBED, "unsubscribe"),
    StateTransition(LeadState.FOLLOW_UP_2, LeadState.UNSUBSCRIBED, "unsubscribe"),
    StateTransition(LeadState.FOLLOW_UP_3, LeadState.UNSUBSCRIBED, "unsubscribe"),
    StateTransition(LeadState.PAUSED, LeadState.UNSUBSCRIBED, "unsubscribe"),

    # Escalation (from any state)
    StateTransition(LeadState.REPLY_RECEIVED, LeadState.ESCALATED, "escalate"),
    StateTransition(LeadState.CONVERSATION_ACTIVE, LeadState.ESCALATED, "escalate"),

    # Resume from pause
    StateTransition(LeadState.PAUSED, LeadState.BOOKING_INVITE_SENT, "resume"),
]


class LeadStateMachine:
    """State machine for managing lead lifecycle transitions."""

    def __init__(self):
        self._transitions: dict[tuple[LeadState, str], StateTransition] = {}
        self._build_transition_map()

    def _build_transition_map(self):
        """Build a lookup map for transitions."""
        for t in TRANSITIONS:
            key = (t.from_state, t.trigger)
            self._transitions[key] = t

    def can_transition(self, from_state: str, trigger: str) -> bool:
        """Check if a transition is valid."""
        try:
            state = LeadState(from_state)
        except ValueError:
            return False

        return (state, trigger) in self._transitions

    def get_next_state(self, from_state: str, trigger: str) -> Optional[str]:
        """Get the next state for a given trigger."""
        try:
            state = LeadState(from_state)
        except ValueError:
            return None

        transition = self._transitions.get((state, trigger))
        if transition:
            return transition.to_state.value
        return None

    def get_valid_triggers(self, from_state: str) -> list[str]:
        """Get all valid triggers from a given state."""
        try:
            state = LeadState(from_state)
        except ValueError:
            return []

        triggers = []
        for (s, trigger), _ in self._transitions.items():
            if s == state:
                triggers.append(trigger)
        return triggers

    def is_terminal_state(self, state: str) -> bool:
        """Check if a state is terminal (no outgoing transitions)."""
        try:
            state_enum = LeadState(state)
        except ValueError:
            return True

        return not any(s == state_enum for (s, _) in self._transitions.keys())

    def is_follow_up_state(self, state: str) -> bool:
        """Check if state is in the follow-up sequence."""
        return state in [
            LeadState.BOOKING_INVITE_SENT.value,
            LeadState.FOLLOW_UP_1.value,
            LeadState.FOLLOW_UP_2.value,
            LeadState.FOLLOW_UP_3.value,
        ]

    def get_follow_up_stage(self, state: str) -> int:
        """Get the follow-up stage number (0-3)."""
        mapping = {
            LeadState.BOOKING_INVITE_SENT.value: 0,
            LeadState.FOLLOW_UP_1.value: 1,
            LeadState.FOLLOW_UP_2.value: 2,
            LeadState.FOLLOW_UP_3.value: 3,
        }
        return mapping.get(state, -1)


@dataclass
class LeadContext:
    """Context object for a lead, used by the state machine."""
    email: str
    current_state: str
    name: str = ""
    firm_name: str = ""
    practice_area: str = ""
    monthly_leads: str = ""
    primary_need: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    last_contact: Optional[datetime] = None
    follow_up_count: int = 0
    conversation_history: list = field(default_factory=list)
    ai_analysis: dict = field(default_factory=dict)
    qualification_score: Optional[float] = None
    notes: list = field(default_factory=list)

    @classmethod
    def from_sheet_row(cls, data: dict) -> "LeadContext":
        """Create a LeadContext from a sheet row dictionary."""
        return cls(
            email=data.get("email", ""),
            current_state=data.get("status", LeadState.NEW_SUBMISSION.value),
            name=data.get("name", ""),
            firm_name=data.get("firmName", ""),
            practice_area=data.get("practiceArea", ""),
            monthly_leads=data.get("monthlyLeads", ""),
            primary_need=data.get("primaryNeed", ""),
            follow_up_count=int(data.get("followUpStage", 0) or 0),
        )

    def to_dict(self) -> dict:
        """Convert to dictionary for serialization."""
        return {
            "email": self.email,
            "status": self.current_state,
            "name": self.name,
            "firmName": self.firm_name,
            "practiceArea": self.practice_area,
            "monthlyLeads": self.monthly_leads,
            "primaryNeed": self.primary_need,
            "followUpCount": self.follow_up_count,
            "conversationHistory": self.conversation_history,
            "aiAnalysis": self.ai_analysis,
            "qualificationScore": self.qualification_score,
        }
