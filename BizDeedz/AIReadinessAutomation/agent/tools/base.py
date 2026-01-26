"""
Base tool class and registry for agent tools.
"""
import logging
from abc import ABC, abstractmethod
from typing import Any
from dataclasses import dataclass

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

import os
import pickle

logger = logging.getLogger(__name__)


@dataclass
class ToolDefinition:
    """Definition of a tool for the Claude API."""
    name: str
    description: str
    input_schema: dict


class BaseTool(ABC):
    """Base class for all agent tools."""

    def __init__(self, config):
        self.config = config
        self._service = None

    @property
    @abstractmethod
    def definitions(self) -> list[ToolDefinition]:
        """Return list of tool definitions for this tool class."""
        pass

    @abstractmethod
    def execute(self, tool_name: str, **kwargs) -> Any:
        """Execute a specific tool by name."""
        pass


class GoogleBaseTool(BaseTool):
    """Base class for Google API tools with shared authentication."""

    SCOPES = []

    def __init__(self, config):
        super().__init__(config)
        self._credentials = None

    def _get_credentials(self) -> Credentials:
        """Get or refresh Google API credentials."""
        if self._credentials and self._credentials.valid:
            return self._credentials

        creds = None
        token_path = self.config.google_token_path

        # Load existing token
        if os.path.exists(token_path):
            with open(token_path, "rb") as token:
                creds = pickle.load(token)

        # Refresh or get new credentials
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.config.google_credentials_path, self.SCOPES
                )
                creds = flow.run_local_server(port=0)

            # Save credentials
            with open(token_path, "wb") as token:
                pickle.dump(creds, token)

        self._credentials = creds
        return creds


class ToolRegistry:
    """Registry for managing and accessing agent tools."""

    def __init__(self):
        self._tools: dict[str, tuple[BaseTool, str]] = {}
        self._tool_classes: list[BaseTool] = []

    def register(self, tool_class: BaseTool):
        """Register a tool class with the registry."""
        self._tool_classes.append(tool_class)

        for definition in tool_class.definitions:
            self._tools[definition.name] = (tool_class, definition.name)
            logger.debug(f"Registered tool: {definition.name}")

    def get_all_definitions(self) -> list[dict]:
        """Get all tool definitions in Anthropic API format."""
        definitions = []
        for tool_class in self._tool_classes:
            for defn in tool_class.definitions:
                definitions.append({
                    "name": defn.name,
                    "description": defn.description,
                    "input_schema": defn.input_schema,
                })
        return definitions

    def execute(self, tool_name: str, **kwargs) -> Any:
        """Execute a tool by name."""
        if tool_name not in self._tools:
            raise ValueError(f"Unknown tool: {tool_name}")

        tool_class, method_name = self._tools[tool_name]
        return tool_class.execute(tool_name, **kwargs)

    def get_handlers(self) -> dict[str, callable]:
        """Get a dict of tool name -> handler function."""
        handlers = {}
        for tool_name, (tool_class, _) in self._tools.items():
            handlers[tool_name] = lambda **kw, tc=tool_class, tn=tool_name: tc.execute(tn, **kw)
        return handlers
