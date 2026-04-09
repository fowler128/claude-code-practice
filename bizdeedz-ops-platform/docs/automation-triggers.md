# BizDeedz Ops Platform - Automation Triggers & Make.com Scenarios

## Overview

This document describes the automation triggers and Make.com (formerly Integromat) scenarios that power the BizDeedz Ops Platform. These automations handle:

1. **Matter lifecycle events** - Input checklist creation, conflicts checks
2. **Invoice generation** - Friday billing runs, Stripe integration
3. **Payment processing** - Webhook handling, auto-unpause
4. **AR management** - Overdue detection, firm pausing
5. **Notifications** - Email alerts, reminders

---

## Trigger 1: Matter Created

### When
New row inserted into `matters` table

### Actions

1. **Create Input Checklist**
   - Call Supabase function `create_matter_inputs(matter_id, case_type)`
   - Copies templates from `input_templates` based on case type

2. **Create Entity Records**
   - Insert debtor into `entities` table
   - Insert spouse into `entities` table (if provided)
   - Link entities to matter via `matter_entities`

3. **Run Conflicts Check**
   - Call Supabase function `run_conflicts_check(matter_id, 'system')`
   - Updates `matters.conflicts_status`
   - Creates audit record in `conflict_checks`

4. **Send Notification** (optional)
   - Notify assigned team member
   - Include matter details and conflicts status

### Implementation

```sql
-- Database trigger (already in schema)
CREATE TRIGGER trg_matter_created AFTER INSERT ON matters
    FOR EACH ROW EXECUTE FUNCTION on_matter_created();
```

### Make.com Scenario
Not required - handled by Supabase triggers

---

## Trigger 2: Inputs Marked Complete

### When
`matters.inputs_status` changes to `'complete'`

### Actions

1. **Set Timestamp**
   - Update `matters.inputs_complete_at = NOW()`

2. **Update Stage** (if conflicts cleared)
   - If `conflicts_status IN ('clear', 'approved')`:
     - Move `status_stage` to `'in_progress'`
     - Set `in_progress_at = NOW()`

3. **Start SLA Clock**
   - SLA tracking begins from `inputs_complete_at`

### Implementation

```sql
-- Supabase Edge Function or Database Trigger
CREATE OR REPLACE FUNCTION on_inputs_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.inputs_status = 'complete' AND OLD.inputs_status != 'complete' THEN
        NEW.inputs_complete_at = NOW();

        -- Auto-advance if conflicts are clear
        IF NEW.conflicts_status IN ('clear') AND NEW.status_stage = 'waiting_inputs' THEN
            NEW.status_stage = 'conflicts_review';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Trigger 3: Stage Changed to Delivered

### When
`matters.status_stage` changes to `'delivered'`

### Preconditions (enforced by UI/API)
- QC must be completed (`deliveries.qc_completed = true` exists)

### Actions

1. **Create Delivery Record**
   ```sql
   INSERT INTO deliveries (matter_id, delivery_type, delivered_by, qc_completed)
   VALUES (matter_id, matter.case_type, current_user, true);
   ```

2. **Create Billables**
   - Call `create_delivery_billables(matter_id, case_type, rush)`
   - Creates base fee billable
   - Creates rush fee billable (if `matter.rush = true`)

3. **Update Timestamps**
   ```sql
   UPDATE matters SET delivered_at = NOW() WHERE id = matter_id;
   ```

4. **Send Notification**
   - Email firm contact that delivery is ready
   - Include download link (if applicable)

### Make.com Scenario: Delivery Notification

```
Trigger: Supabase Webhook (deliveries INSERT)
│
├─► HTTP: Get Matter Details
│   └─► Supabase: SELECT from matters, firms, contacts
│
├─► Email: Send Delivery Notification
│   ├─► To: firm.billing_email
│   ├─► Subject: "BizDeedz Delivery Ready: {matter_name}"
│   └─► Body: Delivery details + next steps
│
└─► Log: Record notification sent
```

---

## Trigger 4: Friday Invoice Run

### When
Scheduled: Every Friday at 5:00 PM CT (configurable)

### Actions

1. **Query Unbilled Items**
   ```sql
   SELECT * FROM v_uninvoiced_billables;
   ```

2. **Group by Firm**
   - Aggregate billables by `firm_id`
   - Calculate totals

3. **Create Invoices**
   - For each firm with billables:
     - Create `invoices` record with status `'draft'`
     - Link billables to invoice via `billables.invoice_id`

4. **Create Stripe Invoices** (Phase 1.5)
   - For each invoice:
     - Find or create Stripe Customer
     - Create Stripe Invoice Items
     - Create and finalize Stripe Invoice
     - Update `invoices.stripe_invoice_id`

5. **Send Invoices**
   - Update `invoices.status = 'sent'`
   - Set `invoices.sent_at = NOW()`

### Make.com Scenario: Friday Invoice Generation

```
Trigger: Schedule (Every Friday 5:00 PM CT)
│
├─► Supabase: Query v_uninvoiced_billables
│   └─► Returns: [{firm_id, firm_name, billing_email, total_amount, billables[]}]
│
├─► Iterator: For each firm
│   │
│   ├─► Supabase: INSERT into invoices
│   │   └─► Returns: new_invoice_id
│   │
│   ├─► Supabase: UPDATE billables SET invoice_id = new_invoice_id
│   │
│   ├─► Stripe: Search Customers by email
│   │   └─► Router: Exists? Use ID : Create Customer
│   │
│   ├─► Iterator: For each billable
│   │   └─► Stripe: Create Invoice Item
│   │       ├─► Customer: customer_id
│   │       ├─► Amount: billable.amount * 100 (cents)
│   │       └─► Description: From v_invoice_line_items
│   │
│   ├─► Stripe: Create Invoice
│   │   └─► Auto-advance: false
│   │
│   ├─► Stripe: Finalize Invoice
│   │   └─► Auto-send: true
│   │
│   └─► Supabase: UPDATE invoices
│       ├─► stripe_invoice_id = stripe.id
│       ├─► status = 'sent'
│       └─► sent_at = NOW()
│
└─► Slack/Email: Summary notification to BizDeedz team
    └─► "Friday invoices complete: X firms, $Y,YYY.YY total"
```

---

## Trigger 5: AR Aging Check

### When
Scheduled: Daily at 9:00 AM CT

### Actions

1. **Query Overdue Invoices**
   ```sql
   SELECT * FROM v_ar_aging WHERE should_pause = true;
   ```

2. **Update Invoice Status**
   ```sql
   UPDATE invoices SET status = 'overdue'
   WHERE status = 'sent'
   AND (SELECT COUNT(*) FROM generate_series...) > 3;
   ```

3. **Pause Firms** (if policy enabled)
   - For invoices > 3 business days:
     - Update `firms.status = 'on_hold'`
     - Update `matters.status_stage = 'paused_ar'` for firm's active matters

4. **Send Notifications**
   - Email BizDeedz team: "AR Alert: X invoices overdue"
   - Email firm (if configured): Payment reminder

### Make.com Scenario: Daily AR Check

```
Trigger: Schedule (Daily 9:00 AM CT)
│
├─► Supabase: Query v_ar_aging WHERE business_days_outstanding > 3
│
├─► Filter: Invoices not already marked overdue
│
├─► Iterator: For each overdue invoice
│   │
│   ├─► Supabase: UPDATE invoices SET status = 'overdue'
│   │
│   ├─► Router: Days > 3 (Warning) vs Days > 7 (Pause)
│   │   │
│   │   ├─► [3-7 days] Email: Send payment reminder to firm
│   │   │
│   │   └─► [8+ days]
│   │       ├─► Supabase: UPDATE firms SET status = 'on_hold'
│   │       ├─► Supabase: UPDATE matters SET status_stage = 'paused_ar'
│   │       └─► Email: Notify BizDeedz team
│   │
│   └─► Log: Record action taken
│
└─► Slack: Daily AR summary
```

---

## Trigger 6: Stripe Payment Webhook

### When
Stripe webhook event: `invoice.payment_succeeded`

### Actions

1. **Find Invoice**
   ```sql
   SELECT * FROM invoices WHERE stripe_invoice_id = event.data.object.id;
   ```

2. **Update Invoice Status**
   ```sql
   UPDATE invoices
   SET status = 'paid', paid_at = NOW()
   WHERE stripe_invoice_id = stripe_id;
   ```

3. **Create Payment Record** (optional)
   ```sql
   INSERT INTO payments (invoice_id, stripe_payment_intent_id, amount, status, paid_at)
   VALUES (...);
   ```

4. **Check Firm AR Status**
   ```sql
   SELECT COUNT(*) FROM invoices
   WHERE firm_id = X AND status IN ('sent', 'overdue');
   ```

5. **Unpause Firm** (if no other overdue)
   - If count = 0:
     - Update `firms.status = 'active'`
     - Update `matters.status_stage` from `'paused_ar'` to previous state

6. **Send Confirmation**
   - Email BizDeedz: "Payment received: {firm} - ${amount}"

### Make.com Scenario: Stripe Payment Handler

```
Trigger: Stripe Webhook (invoice.payment_succeeded)
│
├─► Supabase: SELECT from invoices WHERE stripe_invoice_id = event.id
│   └─► Returns: invoice record
│
├─► Supabase: UPDATE invoices SET status = 'paid', paid_at = NOW()
│
├─► Supabase: INSERT into payments (audit record)
│
├─► Supabase: SELECT COUNT(*) overdue invoices for firm
│
└─► Router: Has other overdue?
    │
    ├─► [No] Unpause Firm
    │   ├─► Supabase: UPDATE firms SET status = 'active'
    │   ├─► Supabase: UPDATE matters SET status_stage = (previous)
    │   └─► Email: Notify team "Firm unpause: {firm_name}"
    │
    └─► [Yes] Do nothing (firm stays paused)
```

---

## Trigger 7: Deficiency List Generated

### When
User clicks "Generate Deficiency List" for a matter

### Actions

1. **Query Missing Inputs**
   ```sql
   SELECT * FROM matter_inputs
   WHERE matter_id = X AND required = true AND received = false;
   ```

2. **Create Deficiency Records**
   ```sql
   INSERT INTO deficiencies (matter_id, category, deficiency_text, created_by)
   SELECT matter_id, input_category, input_type, current_user
   FROM matter_inputs WHERE ...;
   ```

3. **Generate Email/Document**
   - Format deficiency list for client
   - Include matter reference
   - List each missing item by category

4. **Send to Client** (optional, with approval)
   - Email to firm contact
   - Or generate PDF for manual sending

### Make.com Scenario (optional): Deficiency Email

```
Trigger: Supabase Webhook (deficiencies bulk INSERT)
│
├─► Aggregate: Group deficiencies by matter_id
│
├─► HTTP: Get matter and firm details
│
├─► Text: Format deficiency list
│   └─► Template with categories and items
│
└─► Email: Send to firm contact
    ├─► Subject: "Action Required: Missing Documents - {matter_name}"
    └─► Body: Formatted deficiency list
```

---

## Email Templates

### 1. Delivery Notification

**Subject:** `BizDeedz Delivery Ready: {matter_name}`

**Body:**
```
Dear {contact_name},

Your matter has been completed and is ready for review.

Matter: {matter_name}
Case Type: {case_type}
Delivered: {delivered_at}

Please review the deliverables at your earliest convenience. If you have any revisions, please consolidate all feedback into a single response.

Thank you for your business.

Best regards,
BizDeedz Team
```

### 2. Payment Reminder (4-7 days)

**Subject:** `Payment Reminder: Invoice {invoice_number}`

**Body:**
```
Dear {contact_name},

This is a friendly reminder that your invoice is now {days} days outstanding.

Invoice: {invoice_number}
Amount: ${total}
Due: On receipt

Please remit payment at your earliest convenience via the Stripe payment link below.

[Pay Now: {stripe_invoice_url}]

Thank you.

BizDeedz Team
```

### 3. Work Paused Notice (8+ days)

**Subject:** `Important: Work Paused - Payment Required`

**Body:**
```
Dear {contact_name},

Due to outstanding payment, work on your matters has been temporarily paused.

Outstanding Invoice: {invoice_number}
Amount: ${total}
Days Outstanding: {days}

To resume work, please remit payment immediately:
[Pay Now: {stripe_invoice_url}]

Once payment is received, work will resume automatically.

If you have questions about this invoice, please contact us.

BizDeedz Team
```

### 4. Deficiency List

**Subject:** `Action Required: Missing Documents - {matter_name}`

**Body:**
```
Dear {contact_name},

To proceed with {matter_name}, we need the following documents:

**Identity:**
- [ ] Government ID (front/back)

**Income:**
- [ ] Paystubs - last 6 months

**Banking:**
- [ ] Bank statements - last 3 months

Please provide these items at your earliest convenience. The deadline for this matter is {deadline}.

Thank you.

BizDeedz Team
```

---

## Integration Endpoints

### Stripe

- **API Version:** 2023-10-16
- **Endpoints Used:**
  - `POST /v1/customers` - Create customer
  - `GET /v1/customers/search` - Find by email
  - `POST /v1/invoiceitems` - Create invoice item
  - `POST /v1/invoices` - Create invoice
  - `POST /v1/invoices/{id}/finalize` - Finalize invoice
  - `POST /v1/invoices/{id}/send` - Send invoice

### QuickBooks (Phase 1.5)

- **Endpoints Used:**
  - `POST /v3/company/{realmId}/customer` - Create customer
  - `POST /v3/company/{realmId}/invoice` - Create invoice
  - `POST /v3/company/{realmId}/payment` - Record payment

### Supabase

- **Webhooks:** POST to Make.com on table changes
- **Edge Functions:** For complex business logic
- **RPC:** For stored procedures

---

## Error Handling

### Retry Strategy

1. **Network Errors:** Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s)
2. **Rate Limits:** Honor `Retry-After` header
3. **Validation Errors:** Log and alert team, do not retry

### Monitoring

- Log all automation runs to `audit_logs` table
- Slack alerts for:
  - Failed automation runs
  - Stripe webhook failures
  - AR threshold breaches

### Fallback Procedures

1. **Invoice Generation Fails:**
   - Alert team via Slack
   - Manual generation available in UI

2. **Payment Webhook Fails:**
   - Invoice remains in "sent" status
   - Manual "Mark Paid" available in UI

3. **Email Delivery Fails:**
   - Retry with backup email provider
   - Log failure for manual follow-up

---

## Configuration

### Environment Variables

```
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SendGrid or similar)
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=billing@bizdeedz.com

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# QuickBooks (Phase 1.5)
QBO_CLIENT_ID=xxx
QBO_CLIENT_SECRET=xxx
QBO_REALM_ID=xxx
```

### Scheduling

| Automation | Schedule | Timezone |
|------------|----------|----------|
| Friday Invoices | Friday 5:00 PM | America/Chicago |
| AR Aging Check | Daily 9:00 AM | America/Chicago |
| Retainer Reminders | 1st of month 9:00 AM | America/Chicago |

---

## Testing

### Test Scenarios

1. **Matter Creation Flow**
   - Create matter → verify inputs created → verify conflicts run

2. **Invoice Flow**
   - Create billables → run Friday invoices → verify Stripe invoice created

3. **Payment Flow**
   - Simulate Stripe webhook → verify invoice marked paid → verify firm unpause

4. **AR Pause Flow**
   - Create overdue invoice → run AR check → verify firm paused

### Test Data

Use the sample data in `001_schema.sql` for testing. Test firm IDs:
- Johnson & Associates: `11111111-1111-1111-1111-111111111111`
- Smith Legal Group: `22222222-2222-2222-2222-222222222222`
- Davis Bankruptcy Law: `33333333-3333-3333-3333-333333333333`
