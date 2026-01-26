"""
Memory system for persisting agent state and conversation history.
"""
import json
import logging
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional, Any
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)


@dataclass
class ConversationMessage:
    """A single message in a conversation."""
    role: str  # 'agent', 'lead', 'system'
    content: str
    timestamp: str
    email_id: Optional[str] = None
    email_subject: Optional[str] = None
    metadata: dict = None

    def to_dict(self) -> dict:
        result = asdict(self)
        if result["metadata"] is None:
            result["metadata"] = {}
        return result


@dataclass
class AgentAction:
    """Record of an action taken by the agent."""
    action_type: str
    lead_email: str
    timestamp: str
    details: dict
    result: dict
    success: bool


class AgentMemory:
    """
    Persistent memory system for the autonomous agent.

    Stores:
    - Conversation history per lead
    - Agent actions and decisions
    - Lead analysis cache
    - Processing state
    """

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._conn = None
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        """Get or create database connection."""
        if self._conn is None:
            self._conn = sqlite3.connect(self.db_path)
            self._conn.row_factory = sqlite3.Row
        return self._conn

    def _init_db(self):
        """Initialize database schema."""
        conn = self._get_conn()
        cursor = conn.cursor()

        # Conversations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_email TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                email_id TEXT,
                email_subject TEXT,
                metadata TEXT
            )
        """)

        # Actions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action_type TEXT NOT NULL,
                lead_email TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                details TEXT,
                result TEXT,
                success INTEGER
            )
        """)

        # Lead analysis cache
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lead_analysis (
                lead_email TEXT PRIMARY KEY,
                analysis TEXT NOT NULL,
                priority TEXT,
                qualification_score REAL,
                updated_at TEXT NOT NULL
            )
        """)

        # Processing state (for tracking what's been processed)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS processing_state (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # Indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_conversations_email
            ON conversations(lead_email)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_actions_email
            ON actions(lead_email)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_actions_timestamp
            ON actions(timestamp)
        """)

        conn.commit()

    # Conversation methods

    def add_message(self, lead_email: str, message: ConversationMessage):
        """Add a message to a lead's conversation history."""
        conn = self._get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO conversations
            (lead_email, role, content, timestamp, email_id, email_subject, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            lead_email,
            message.role,
            message.content,
            message.timestamp,
            message.email_id,
            message.email_subject,
            json.dumps(message.metadata) if message.metadata else None,
        ))

        conn.commit()
        logger.debug(f"Added message to conversation for {lead_email}")

    def get_conversation(self, lead_email: str, limit: int = 50) -> list[ConversationMessage]:
        """Get conversation history for a lead."""
        conn = self._get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT role, content, timestamp, email_id, email_subject, metadata
            FROM conversations
            WHERE lead_email = ?
            ORDER BY timestamp ASC
            LIMIT ?
        """, (lead_email, limit))

        messages = []
        for row in cursor.fetchall():
            messages.append(ConversationMessage(
                role=row["role"],
                content=row["content"],
                timestamp=row["timestamp"],
                email_id=row["email_id"],
                email_subject=row["email_subject"],
                metadata=json.loads(row["metadata"]) if row["metadata"] else None,
            ))

        return messages

    def get_conversation_as_text(self, lead_email: str, limit: int = 20) -> str:
        """Get conversation as formatted text for prompts."""
        messages = self.get_conversation(lead_email, limit)
        if not messages:
            return "No previous conversation."

        lines = []
        for msg in messages:
            role_label = {
                "agent": "BizDeedz",
                "lead": "Lead",
                "system": "System",
            }.get(msg.role, msg.role)

            lines.append(f"[{msg.timestamp}] {role_label}:")
            lines.append(msg.content)
            lines.append("")

        return "\n".join(lines)

    # Action methods

    def record_action(self, action: AgentAction):
        """Record an action taken by the agent."""
        conn = self._get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO actions
            (action_type, lead_email, timestamp, details, result, success)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            action.action_type,
            action.lead_email,
            action.timestamp,
            json.dumps(action.details),
            json.dumps(action.result),
            1 if action.success else 0,
        ))

        conn.commit()
        logger.info(f"Recorded action {action.action_type} for {action.lead_email}")

    def get_recent_actions(
        self,
        lead_email: str = None,
        action_type: str = None,
        limit: int = 20,
    ) -> list[AgentAction]:
        """Get recent actions, optionally filtered."""
        conn = self._get_conn()
        cursor = conn.cursor()

        query = "SELECT * FROM actions WHERE 1=1"
        params = []

        if lead_email:
            query += " AND lead_email = ?"
            params.append(lead_email)
        if action_type:
            query += " AND action_type = ?"
            params.append(action_type)

        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)

        actions = []
        for row in cursor.fetchall():
            actions.append(AgentAction(
                action_type=row["action_type"],
                lead_email=row["lead_email"],
                timestamp=row["timestamp"],
                details=json.loads(row["details"]) if row["details"] else {},
                result=json.loads(row["result"]) if row["result"] else {},
                success=bool(row["success"]),
            ))

        return actions

    def was_action_taken(
        self,
        lead_email: str,
        action_type: str,
        since_hours: float = 24,
    ) -> bool:
        """Check if an action was taken for a lead within a time window."""
        conn = self._get_conn()
        cursor = conn.cursor()

        from datetime import timedelta
        cutoff = (datetime.now() - timedelta(hours=since_hours)).isoformat()

        cursor.execute("""
            SELECT COUNT(*) as count
            FROM actions
            WHERE lead_email = ? AND action_type = ? AND timestamp > ? AND success = 1
        """, (lead_email, action_type, cutoff))

        row = cursor.fetchone()
        return row["count"] > 0

    # Lead analysis cache

    def save_analysis(
        self,
        lead_email: str,
        analysis: dict,
        priority: str = None,
        qualification_score: float = None,
    ):
        """Save lead analysis to cache."""
        conn = self._get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT OR REPLACE INTO lead_analysis
            (lead_email, analysis, priority, qualification_score, updated_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            lead_email,
            json.dumps(analysis),
            priority,
            qualification_score,
            datetime.now().isoformat(),
        ))

        conn.commit()

    def get_analysis(self, lead_email: str) -> Optional[dict]:
        """Get cached analysis for a lead."""
        conn = self._get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT analysis, priority, qualification_score, updated_at
            FROM lead_analysis
            WHERE lead_email = ?
        """, (lead_email,))

        row = cursor.fetchone()
        if row:
            return {
                "analysis": json.loads(row["analysis"]),
                "priority": row["priority"],
                "qualification_score": row["qualification_score"],
                "updated_at": row["updated_at"],
            }
        return None

    # Processing state

    def set_state(self, key: str, value: Any):
        """Set a processing state value."""
        conn = self._get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT OR REPLACE INTO processing_state
            (key, value, updated_at)
            VALUES (?, ?, ?)
        """, (key, json.dumps(value), datetime.now().isoformat()))

        conn.commit()

    def get_state(self, key: str, default: Any = None) -> Any:
        """Get a processing state value."""
        conn = self._get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT value FROM processing_state WHERE key = ?
        """, (key,))

        row = cursor.fetchone()
        if row:
            return json.loads(row["value"])
        return default

    def close(self):
        """Close database connection."""
        if self._conn:
            self._conn.close()
            self._conn = None
