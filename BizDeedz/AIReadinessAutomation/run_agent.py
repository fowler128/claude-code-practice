#!/usr/bin/env python3
"""
BizDeedz AI Readiness Lead Nurturing Agent

Entry point for running the autonomous agent.

Usage:
    # Run once
    python run_agent.py --once

    # Run continuously (default)
    python run_agent.py

    # Run with custom interval
    python run_agent.py --interval 600

    # Get pipeline status
    python run_agent.py --status

    # Get follow-up schedule
    python run_agent.py --schedule
"""
import argparse
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from agent import AgentOrchestrator, load_config


def setup_logging(log_level: str = "INFO", log_file: str = None):
    """Configure logging."""
    handlers = [logging.StreamHandler(sys.stdout)]

    if log_file:
        handlers.append(logging.FileHandler(log_file))

    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=handlers,
    )


def print_json(data: dict):
    """Pretty print JSON data."""
    print(json.dumps(data, indent=2, default=str))


def main():
    parser = argparse.ArgumentParser(
        description="BizDeedz AI Lead Nurturing Agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python run_agent.py                    # Run continuously
    python run_agent.py --once             # Run single cycle
    python run_agent.py --interval 300     # Custom interval (5 min)
    python run_agent.py --status           # Show pipeline status
    python run_agent.py --schedule         # Show follow-up schedule
    python run_agent.py --lead john@example.com  # Get lead details
        """,
    )

    parser.add_argument(
        "--once",
        action="store_true",
        help="Run a single processing cycle and exit",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=None,
        help="Polling interval in seconds (default: from config)",
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Print pipeline status and exit",
    )
    parser.add_argument(
        "--schedule",
        action="store_true",
        help="Print follow-up schedule and exit",
    )
    parser.add_argument(
        "--lead",
        type=str,
        help="Get detailed status for a specific lead by email",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging level (default: INFO)",
    )
    parser.add_argument(
        "--log-file",
        type=str,
        help="Log to file in addition to stdout",
    )

    args = parser.parse_args()

    # Setup logging
    setup_logging(args.log_level, args.log_file)
    logger = logging.getLogger(__name__)

    # Load config and create orchestrator
    try:
        config = load_config()
        orchestrator = AgentOrchestrator(config)
    except Exception as e:
        logger.error(f"Failed to initialize agent: {e}")
        sys.exit(1)

    # Handle different modes
    try:
        if args.status:
            # Print pipeline status
            print("\n=== Pipeline Status ===\n")
            status = orchestrator.get_pipeline_summary()
            print_json(status)

        elif args.schedule:
            # Print follow-up schedule
            print("\n=== Follow-up Schedule ===\n")
            schedule = orchestrator.get_follow_up_schedule()
            if schedule:
                for item in schedule:
                    print(
                        f"  {item['email']}: "
                        f"Stage {item['current_stage']} -> {item['next_stage']}, "
                        f"Due in {item['hours_until_next_follow_up']:.1f}h"
                    )
            else:
                print("  No pending follow-ups")

        elif args.lead:
            # Get specific lead status
            print(f"\n=== Lead Status: {args.lead} ===\n")
            lead_status = orchestrator.get_lead_status(args.lead)
            if lead_status:
                print_json(lead_status)
            else:
                print(f"  Lead not found: {args.lead}")

        elif args.once:
            # Run single cycle
            print("\n=== Running Single Cycle ===\n")
            results = orchestrator.run_once()
            print("\n=== Results ===\n")
            print_json(results)

        else:
            # Run continuously
            print("\n=== Starting Continuous Agent ===\n")
            print(f"  Polling interval: {args.interval or config.polling_interval_seconds}s")
            print("  Press Ctrl+C to stop\n")
            orchestrator.run_continuous(args.interval)

    except KeyboardInterrupt:
        print("\nStopped by user")
    except Exception as e:
        logger.error(f"Agent error: {e}")
        raise
    finally:
        orchestrator.shutdown()


if __name__ == "__main__":
    main()
