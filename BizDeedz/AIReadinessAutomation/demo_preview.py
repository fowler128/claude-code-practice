#!/usr/bin/env python3
"""
BizDeedz AI Agent - Demo Preview

This script demonstrates how the autonomous agent works by simulating
the full lead nurturing workflow with mock data and responses.

Run with: python demo_preview.py
"""

import json
from datetime import datetime, timedelta
from textwrap import dedent

# ANSI colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(60)}{Colors.END}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.END}\n")

def print_step(num, text):
    print(f"{Colors.CYAN}{Colors.BOLD}[Step {num}]{Colors.END} {text}")

def print_agent(text):
    print(f"{Colors.GREEN}🤖 Agent:{Colors.END} {text}")

def print_tool(tool, action):
    print(f"{Colors.YELLOW}   🔧 Tool [{tool}]:{Colors.END} {action}")

def print_email(subject, body, to=None):
    print(f"{Colors.BLUE}   📧 Email:{Colors.END}")
    if to:
        print(f"      To: {to}")
    print(f"      Subject: {subject}")
    print(f"      ---")
    for line in body.split('\n')[:8]:
        print(f"      {line}")
    if len(body.split('\n')) > 8:
        print(f"      ...")

def print_json_block(data):
    formatted = json.dumps(data, indent=2)
    for line in formatted.split('\n'):
        print(f"      {Colors.CYAN}{line}{Colors.END}")

def pause():
    # Non-interactive mode: just print a separator
    print(f"\n{Colors.BOLD}─────────────────────────────────────────{Colors.END}\n")


def demo_new_lead():
    """Demonstrate new lead processing."""
    print_header("SCENARIO 1: New Lead Submission")

    lead = {
        "name": "Sarah Johnson",
        "email": "sarah@johnsonlawfirm.com",
        "phone": "(555) 234-5678",
        "firmName": "Johnson Family Law",
        "practiceArea": "Family Law",
        "monthlyLeads": "25-50",
        "primaryNeed": "Intake automation",
        "status": "NEW_SUBMISSION",
        "timestamp": datetime.now().isoformat()
    }

    print("A new lead just submitted the form:\n")
    print_json_block(lead)

    pause()

    # Step 1: Detection
    print_step(1, "Agent detects new submission")
    print_tool("sheets", "get_all_leads(status_filter='NEW_SUBMISSION')")
    print_agent("Found 1 new lead: sarah@johnsonlawfirm.com")

    pause()

    # Step 2: Analysis
    print_step(2, "Agent analyzes lead with Claude")
    print_agent("Analyzing lead profile, practice area, and stated needs...")
    print()

    analysis = {
        "priority": "high",
        "score": 78,
        "personalization_notes": "Family law firm with 25-50 monthly leads seeking intake automation - strong fit. High volume suggests immediate ROI potential from faster response times.",
        "recommended_approach": "high_touch",
        "pain_points": [
            "Likely losing leads due to slow intake response",
            "After-hours inquiries probably going unanswered",
            "Manual intake causing bottlenecks"
        ],
        "practice_area_insights": "Family law has high emotional stakes - clients often shopping multiple firms. Speed to first contact is critical.",
        "red_flags": []
    }

    print(f"{Colors.GREEN}🧠 AI Analysis Result:{Colors.END}")
    print_json_block(analysis)

    print_tool("sheets", "save_ai_analysis(email='sarah@...', priority='high', score=78)")

    pause()

    # Step 3: Email Generation
    print_step(3, "Agent generates personalized booking invite")
    print_agent("Generating email based on analysis and context...")
    print()

    email_subject = "AI Readiness Scorecard - Book Your Diagnostic (Johnson Family Law)"
    email_body = dedent("""
        Hi Sarah,

        Thank you for requesting the AI Readiness Audit for Johnson Family Law.

        With 25-50 leads coming in monthly, I can see why intake automation is top
        of mind. In family law especially, being first to respond often wins the client
        - and right now you may be losing cases to firms with faster intake.

        Next step: Book your 20-30 minute diagnostic here:
        https://calendar.google.com/calendar/appointments/xxxxx

        On the call, we'll map out:
        - Your current intake flow and where leads fall through
        - How after-hours inquiries are (or aren't) being handled
        - Quick wins you can implement before any major AI investment

        This is operational guidance only - no legal advice, no sales pitch.

        - BizDeedz
    """).strip()

    print_email(email_subject, email_body, to="sarah@johnsonlawfirm.com")

    pause()

    # Step 4: Send and Update
    print_step(4, "Agent sends email and updates status")
    print_tool("gmail", "send_email(to='sarah@johnsonlawfirm.com', subject='AI Readiness...')")
    print_agent("Email sent successfully. Message ID: 18d4f2a3b5c6")
    print_tool("sheets", "update_lead_status(email='sarah@...', status='BOOKING_INVITE_SENT')")
    print_tool("sheets", "record_email_sent(email='sarah@...', type='booking_invite')")
    print_tool("memory", "add_message(role='agent', content='...')")

    print()
    print(f"{Colors.GREEN}✅ Lead processed successfully!{Colors.END}")
    print(f"   Status: NEW_SUBMISSION → BOOKING_INVITE_SENT")
    print(f"   Priority: HIGH")
    print(f"   Next: Follow-up in 24 hours if no booking")


def demo_reply_handling():
    """Demonstrate reply handling."""
    print_header("SCENARIO 2: Lead Replies with Question")

    print("24 hours later, Sarah replies to our email:\n")

    reply = {
        "from": "Sarah Johnson <sarah@johnsonlawfirm.com>",
        "subject": "Re: AI Readiness Scorecard - Book Your Diagnostic",
        "body": dedent("""
            Hi,

            This sounds interesting but I'm a bit skeptical. We tried a chatbot
            last year and it was a disaster - clients hated it.

            How is this different? And what's the cost involved?

            Sarah
        """).strip(),
        "timestamp": datetime.now().isoformat()
    }

    print_json_block(reply)

    pause()

    # Step 1: Detection
    print_step(1, "Agent detects reply")
    print_tool("gmail", "get_recent_replies(hours_back=6)")
    print_agent("Found reply from sarah@johnsonlawfirm.com")
    print_tool("sheets", "get_lead_by_email(email='sarah@johnsonlawfirm.com')")
    print_agent("Matched to existing lead (status: BOOKING_INVITE_SENT)")

    pause()

    # Step 2: Intent Analysis
    print_step(2, "Agent analyzes reply intent with Claude")
    print_tool("memory", "get_conversation(email='sarah@...')")
    print_agent("Analyzing reply content and conversation history...")
    print()

    analysis = {
        "action": "respond",
        "intent_detected": "Objection handling - skeptical due to past bad experience with chatbot. Also asking about pricing. Shows interest but needs reassurance.",
        "response_email": {
            "subject": "Re: AI Readiness Scorecard - Book Your Diagnostic",
            "body": "..."  # Will show full below
        },
        "status_update": "CONVERSATION_ACTIVE",
        "notes": "Valid concern about previous chatbot failure. Address by differentiating our approach (assessment, not implementation). Pricing question suggests genuine interest."
    }

    print(f"{Colors.GREEN}🧠 AI Intent Analysis:{Colors.END}")
    print_json_block({k: v for k, v in analysis.items() if k != "response_email"})

    pause()

    # Step 3: Generate Response
    print_step(3, "Agent generates contextual response")

    response_body = dedent("""
        Hi Sarah,

        That chatbot experience sounds frustrating - and honestly, it's exactly
        why we do the diagnostic BEFORE recommending any tools.

        Here's how this is different:

        1. We're not selling you a chatbot (or any tool). The scorecard identifies
           what's actually broken in your intake flow first.

        2. Most firms don't need AI chat - they need faster human response. We
           often find the fix is workflow changes, not new technology.

        3. The diagnostic call is free. If you move forward with implementation,
           pricing depends on scope - but that's a separate conversation after
           you see the scorecard.

        If your past chatbot was client-facing and felt impersonal, I get the
        hesitation. What we assess is usually back-office: how your team handles
        intake, where handoffs break down, what's slowing case setup.

        Still worth 20 minutes?
        https://calendar.google.com/calendar/appointments/xxxxx

        - BizDeedz
    """).strip()

    print_email(
        "Re: AI Readiness Scorecard - Book Your Diagnostic",
        response_body,
        to="sarah@johnsonlawfirm.com"
    )

    pause()

    # Step 4: Send
    print_step(4, "Agent sends response and updates records")
    print_tool("gmail", "send_email(to='sarah@...', reply_to_message_id='...')")
    print_agent("Response sent successfully")
    print_tool("sheets", "update_lead_status(status='CONVERSATION_ACTIVE')")
    print_tool("memory", "add_message(role='lead', content='...')")
    print_tool("memory", "add_message(role='agent', content='...')")

    print()
    print(f"{Colors.GREEN}✅ Reply handled autonomously!{Colors.END}")
    print(f"   Detected: Objection + pricing question")
    print(f"   Action: Addressed concerns, reframed value, re-offered booking")
    print(f"   Status: BOOKING_INVITE_SENT → CONVERSATION_ACTIVE")


def demo_booking_detection():
    """Demonstrate booking detection."""
    print_header("SCENARIO 3: Lead Books Appointment")

    print("Sarah decides to book. She clicks the calendar link and schedules:\n")

    booking = {
        "id": "event_abc123",
        "summary": "AI Readiness Diagnostic - Johnson Family Law",
        "start": (datetime.now() + timedelta(days=2, hours=10)).isoformat(),
        "end": (datetime.now() + timedelta(days=2, hours=10, minutes=30)).isoformat(),
        "attendees": ["sarah@johnsonlawfirm.com"],
        "created": datetime.now().isoformat()
    }

    print_json_block(booking)

    pause()

    # Step 1: Detection
    print_step(1, "Agent detects new booking")
    print_tool("calendar", "get_recent_bookings(hours_back=24)")
    print_agent("Found 1 new calendar event with external attendee")
    print_tool("sheets", "get_lead_by_email(email='sarah@johnsonlawfirm.com')")
    print_agent("Matched booking to lead: Sarah Johnson")

    pause()

    # Step 2: Update Status
    print_step(2, "Agent updates lead status")
    print_tool("sheets", "update_lead_status(email='sarah@...', status='BOOKED')")
    print_tool("sheets", "add_lead_note(note='Booking detected: AI Readiness Diagnostic at...')")
    print_tool("memory", "record_action(action_type='detect_booking')")

    pause()

    # Step 3: Send Checklist
    print_step(3, "Agent generates and sends pre-call checklist")
    print_agent("Generating personalized prep checklist based on conversation history...")
    print()

    checklist_body = dedent("""
        Hi Sarah,

        You're confirmed for the AI Readiness Diagnostic on Thursday at 10:00 AM.

        To make our 30 minutes count, here's what would help (bring what you can):

        For your intake assessment:
        - How leads currently reach you (web form, phone, referrals?)
        - Who handles initial contact and how quickly
        - What happens after hours / weekends

        For workflow mapping:
        - Your current case management system
        - Where things get stuck between intake → case setup
        - Any SOPs you have (screenshots work great)

        Given your past chatbot experience, I'll specifically look at where
        automation makes sense vs. where it doesn't for family law firms.

        No prep required if you prefer - we can work from discussion.

        See you Thursday!

        - BizDeedz
    """).strip()

    print_email(
        "Your AI Readiness Diagnostic - Prep Checklist (Johnson Family Law)",
        checklist_body,
        to="sarah@johnsonlawfirm.com"
    )

    print_tool("gmail", "send_email(to='sarah@...', subject='Your AI Readiness Diagnostic...')")
    print_tool("sheets", "update_lead_status(status='CHECKLIST_SENT')")

    print()
    print(f"{Colors.GREEN}✅ Booking processed automatically!{Colors.END}")
    print(f"   Status: CONVERSATION_ACTIVE → BOOKED → CHECKLIST_SENT")
    print(f"   Personalized checklist sent")
    print(f"   No manual intervention required")


def demo_follow_up_decision():
    """Demonstrate intelligent follow-up decision."""
    print_header("SCENARIO 4: Smart Follow-up Decision")

    print("Different scenario: A lead (Mike) received booking invite 26 hours ago.")
    print("Agent is deciding whether to send follow-up #1...\n")

    lead = {
        "name": "Mike Roberts",
        "email": "mike@robertspi.com",
        "firmName": "Roberts Personal Injury",
        "practiceArea": "Personal Injury",
        "monthlyLeads": "50-100",
        "status": "BOOKING_INVITE_SENT",
        "lastEmailSent": (datetime.now() - timedelta(hours=26)).isoformat(),
        "followUpStage": 0,
        "priority": "high"
    }

    print_json_block(lead)

    pause()

    print_step(1, "Agent evaluates follow-up need")
    print_tool("sheets", "get_leads_needing_follow_up(min_hours=24)")
    print_agent("Found mike@robertspi.com - 26 hours since last contact, stage 0")
    print_tool("memory", "get_conversation(email='mike@...')")
    print_agent("No replies received. Checking AI decision...")
    print()

    pause()

    print_step(2, "Agent decides with Claude")
    print_agent("Analyzing engagement signals and optimal timing...")
    print()

    decision = {
        "should_follow_up": True,
        "wait_hours": None,
        "reason": "High-priority PI firm with 50-100 monthly leads. No engagement yet at 26 hours. Standard first follow-up timing. PI firms are often busy with case work - a gentle nudge is appropriate.",
        "email": {
            "subject": "Quick follow-up: AI Readiness diagnostic",
            "body": "..."
        }
    }

    print(f"{Colors.GREEN}🧠 AI Follow-up Decision:{Colors.END}")
    print_json_block({k: v for k, v in decision.items() if k != "email"})

    pause()

    print_step(3, "Agent generates follow-up (different angle)")

    followup_body = dedent("""
        Hi Mike,

        Quick follow-up on the AI Readiness Audit for Roberts Personal Injury.

        With 50-100 leads monthly, you're likely leaving money on the table if
        intake takes more than 5 minutes. PI leads are notorious for calling
        multiple firms - first response often wins.

        The diagnostic takes 20-30 minutes and shows you exactly where leads
        slip through:
        https://calendar.google.com/calendar/appointments/xxxxx

        If this week doesn't work, reply "next week" and I'll follow up then.

        - BizDeedz
    """).strip()

    print_email(
        "Quick follow-up: AI Readiness diagnostic",
        followup_body,
        to="mike@robertspi.com"
    )

    print()
    print(f"{Colors.GREEN}✅ Follow-up decision made intelligently!{Colors.END}")
    print(f"   Decision: Send follow-up #1")
    print(f"   Reasoning: High priority, appropriate timing, no engagement")
    print(f"   Status: BOOKING_INVITE_SENT → FOLLOW_UP_1")


def demo_pause_handling():
    """Demonstrate pause request handling."""
    print_header("SCENARIO 5: Lead Requests Pause")

    print("Mike replies to the follow-up:\n")

    reply = {
        "from": "Mike Roberts <mike@robertspi.com>",
        "subject": "Re: Quick follow-up: AI Readiness diagnostic",
        "body": "Hey, swamped with trial prep right now. Can you check back in a month?",
        "timestamp": datetime.now().isoformat()
    }

    print_json_block(reply)

    pause()

    print_step(1, "Agent analyzes intent")
    print_agent("Analyzing reply...")
    print()

    analysis = {
        "action": "pause",
        "intent_detected": "Soft pause request - busy with trial prep, asks for follow-up in a month. Not a rejection, just bad timing.",
        "response_email": {
            "subject": "Re: Quick follow-up: AI Readiness diagnostic",
            "body": "..."
        },
        "status_update": "PAUSED",
        "notes": "Set reminder to re-engage in 30 days. Trial prep indicates active caseload - good sign for eventual fit."
    }

    print(f"{Colors.GREEN}🧠 AI Intent Detection:{Colors.END}")
    print_json_block(analysis)

    pause()

    print_step(2, "Agent sends acknowledgment")

    ack_body = dedent("""
        Hi Mike,

        Totally understand - trial prep takes priority. I've paused all follow-ups.

        I'll check back in about a month. If you wrap up sooner and want to
        knock this out, just reply here.

        Good luck with the trial!

        - BizDeedz
    """).strip()

    print_email(
        "Re: Quick follow-up: AI Readiness diagnostic",
        ack_body,
        to="mike@robertspi.com"
    )

    print_tool("gmail", "send_email(...)")
    print_tool("sheets", "update_lead_status(status='PAUSED')")
    print_tool("sheets", "add_lead_note(note='Paused - trial prep, follow up in 30 days')")

    print()
    print(f"{Colors.GREEN}✅ Pause request handled gracefully!{Colors.END}")
    print(f"   Detected: Soft pause (not rejection)")
    print(f"   Action: Stopped automation, sent friendly acknowledgment")
    print(f"   Status: FOLLOW_UP_1 → PAUSED")
    print(f"   Note: Agent noted to re-engage in 30 days")


def demo_orchestrator_cycle():
    """Show the orchestrator cycle."""
    print_header("ORCHESTRATOR: Full Processing Cycle")

    print("Every 5 minutes, the orchestrator runs a complete cycle:\n")

    print(f"{Colors.BOLD}python run_agent.py{Colors.END}")
    print()

    cycle = """
┌─────────────────────────────────────────────────────────────┐
│                    PROCESSING CYCLE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PROCESS NEW LEADS                                       │
│     └─ Check for status=NEW_SUBMISSION                      │
│     └─ Analyze each with AI                                 │
│     └─ Generate personalized booking invite                 │
│     └─ Send email, update status                            │
│                                                             │
│  2. PROCESS REPLIES                                         │
│     └─ Check inbox for recent replies                       │
│     └─ Match to known leads                                 │
│     └─ Analyze intent (book/pause/unsubscribe/question)     │
│     └─ Generate and send appropriate response               │
│                                                             │
│  3. DETECT BOOKINGS                                         │
│     └─ Check calendar for new events                        │
│     └─ Match attendees to leads                             │
│     └─ Update status to BOOKED                              │
│     └─ Send pre-call checklist                              │
│                                                             │
│  4. PROCESS FOLLOW-UPS                                      │
│     └─ Find leads due for follow-up                         │
│     └─ AI decides: send now / wait / skip                   │
│     └─ Generate contextual follow-up content                │
│     └─ Send and update stage                                │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Cycle complete. Sleep 5 minutes. Repeat.                   │
└─────────────────────────────────────────────────────────────┘
"""
    print(cycle)

    pause()

    print("Example cycle output:\n")

    output = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "duration_seconds": 12.4,
            "total_new_leads_processed": 2,
            "total_replies_processed": 1,
            "total_bookings_detected": 1,
            "total_follow_ups_sent": 3,
            "total_errors": 0
        },
        "new_leads": [
            {"email": "sarah@johnsonlawfirm.com", "action": "booking_invite_sent", "priority": "high"},
            {"email": "tom@smithlaw.com", "action": "booking_invite_sent", "priority": "medium"}
        ],
        "replies": [
            {"email": "mike@robertspi.com", "action": "paused"}
        ],
        "bookings": [
            {"email": "sarah@johnsonlawfirm.com", "action": "booking_detected", "checklist_sent": True}
        ],
        "follow_ups": [
            {"email": "jane@doelaw.com", "action": "follow_up_1_sent"},
            {"email": "bob@familylaw.com", "action": "follow_up_2_sent"},
            {"email": "lisa@estate.com", "action": "no_follow_up", "reason": "replied yesterday"}
        ]
    }

    print_json_block(output)


def main():
    print(f"""
{Colors.BOLD}{Colors.HEADER}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║       BizDeedz AI Lead Nurturing Agent - Demo Preview         ║
║                                                               ║
║   This demo shows how the autonomous agent handles the        ║
║   complete lead nurturing workflow using Claude AI.           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
{Colors.END}
    """)

    print("The demo will walk through 5 scenarios:")
    print("  1. New lead submission → AI analysis → Personalized email")
    print("  2. Lead replies with objection → Intent detection → Smart response")
    print("  3. Lead books appointment → Auto-detection → Pre-call checklist")
    print("  4. Follow-up decision → AI timing analysis → Contextual nudge")
    print("  5. Pause request → Intent recognition → Graceful handling")
    print()

    pause()

    demo_new_lead()
    pause()

    demo_reply_handling()
    pause()

    demo_booking_detection()
    pause()

    demo_follow_up_decision()
    pause()

    demo_pause_handling()
    pause()

    demo_orchestrator_cycle()

    print_header("Demo Complete!")

    print(f"""
{Colors.GREEN}Key Takeaways:{Colors.END}

✅ {Colors.BOLD}Intelligent{Colors.END}: Every decision is made by Claude analyzing context
✅ {Colors.BOLD}Personalized{Colors.END}: Emails reference specific firm details and needs
✅ {Colors.BOLD}Conversational{Colors.END}: Handles replies naturally, addresses objections
✅ {Colors.BOLD}Autonomous{Colors.END}: Detects bookings, sends checklists without intervention
✅ {Colors.BOLD}Respectful{Colors.END}: Recognizes pause/unsubscribe requests instantly
✅ {Colors.BOLD}Persistent{Colors.END}: Remembers full conversation history per lead

{Colors.BOLD}To run the real agent:{Colors.END}

  cd BizDeedz/AIReadinessAutomation
  pip install -r requirements.txt
  cp .env.example .env
  # Edit .env with your API keys
  python run_agent.py --once    # Test single cycle
  python run_agent.py           # Run continuously
""")


if __name__ == "__main__":
    main()
