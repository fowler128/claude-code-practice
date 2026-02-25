import { useState, useEffect, useCallback, useMemo } from "react";

/* ── colour tokens (n8n dark theme) ── */
const T = {
  bg: "#0d1117", s1: "#161b22", s2: "#1c2333", s3: "#21283b",
  bd: "#30363d", bd2: "#484f58",
  w: "#e6edf3", tm: "#8b949e", td: "#6e7681",
  ac: "#58a6ff", ac2: "#388bfd", p: "#a371f7", p2: "#8957e5",
  g: "#3fb950", y: "#d29922", r: "#f85149", o: "#db6d28",
  gd: "linear-gradient(135deg,#58a6ff,#a371f7)",
  card: "#161b22cc",
};

/* ── 83-item checklist across 16 categories ── */
const CHECKLIST = [
  { cat: "Case Setup", items: [
    { id: 1, text: "Engagement letter signed", form: "Firm", req: true },
    { id: 2, text: "Retainer fee received", form: "Firm", req: true },
    { id: 3, text: "Case opened in BankruptcyPRO", form: "BPro", req: true },
    { id: 4, text: "Client portal access created", form: "Portal", req: false },
    { id: 5, text: "Conflict check completed", form: "Firm", req: true },
    { id: 6, text: "Case assigned to paralegal", form: "Firm", req: true },
  ]},
  { cat: "Credit Counseling", items: [
    { id: 7, text: "Pre-filing credit counseling certificate obtained", form: "Form 101", req: true },
    { id: 8, text: "Certificate filed with court", form: "ECF", req: true },
    { id: 9, text: "Post-filing debtor education scheduled", form: "Form 423", req: false },
  ]},
  { cat: "Income Documentation", items: [
    { id: 10, text: "Last 6 months pay stubs collected", form: "Sched I", req: true },
    { id: 11, text: "Prior year tax return obtained", form: "Form 122A", req: true },
    { id: 12, text: "YTD income calculated", form: "Sched I", req: true },
    { id: 13, text: "Spouse income documented (if applicable)", form: "Sched I", req: false },
    { id: 14, text: "Self-employment income documented", form: "Sched I", req: false },
    { id: 15, text: "Social Security / pension verified", form: "Sched I", req: false },
    { id: 16, text: "All income sources cross-referenced", form: "Sched I", req: true },
  ]},
  { cat: "Expense Documentation", items: [
    { id: 17, text: "Monthly budget worksheet completed", form: "Sched J", req: true },
    { id: 18, text: "Mortgage / rent verified", form: "Sched J", req: true },
    { id: 19, text: "Utility bills collected", form: "Sched J", req: false },
    { id: 20, text: "Insurance premiums documented", form: "Sched J", req: true },
    { id: 21, text: "Vehicle expenses calculated", form: "Sched J", req: true },
    { id: 22, text: "Childcare / education expenses", form: "Sched J", req: false },
    { id: 23, text: "Medical expenses documented", form: "Sched J", req: false },
  ]},
  { cat: "Means Test", items: [
    { id: 24, text: "Form 122A-1 completed (Ch.7) or 122C-1 (Ch.13)", form: "Form 122", req: true },
    { id: 25, text: "CMI calculated correctly", form: "Form 122", req: true },
    { id: 26, text: "Median income comparison run", form: "Form 122", req: true },
    { id: 27, text: "Allowable deductions entered", form: "Form 122", req: true },
    { id: 28, text: "Means test result documented", form: "Form 122", req: true },
  ]},
  { cat: "Assets — Real Property", items: [
    { id: 29, text: "Real property listed on Schedule A/B", form: "Sched A/B", req: true },
    { id: 30, text: "Property valuations obtained", form: "Sched A/B", req: true },
    { id: 31, text: "Homestead exemption applied", form: "Sched C", req: true },
    { id: 32, text: "Mortgage balances verified", form: "Sched D", req: true },
    { id: 33, text: "Deed / title documents collected", form: "SOFA", req: false },
  ]},
  { cat: "Assets — Personal Property", items: [
    { id: 34, text: "Vehicle values (NADA/KBB) obtained", form: "Sched A/B", req: true },
    { id: 35, text: "Bank account balances on filing date", form: "Sched A/B", req: true },
    { id: 36, text: "Household goods estimated", form: "Sched A/B", req: true },
    { id: 37, text: "Jewelry / collections valued", form: "Sched A/B", req: false },
    { id: 38, text: "Retirement accounts documented", form: "Sched A/B", req: true },
    { id: 39, text: "Tax refund estimated", form: "Sched A/B", req: true },
    { id: 40, text: "All personal property exemptions claimed", form: "Sched C", req: true },
  ]},
  { cat: "Secured Creditors", items: [
    { id: 41, text: "All secured debts listed on Schedule D", form: "Sched D", req: true },
    { id: 42, text: "Collateral descriptions accurate", form: "Sched D", req: true },
    { id: 43, text: "Loan balances verified with statements", form: "Sched D", req: true },
    { id: 44, text: "Reaffirmation / surrender elections noted", form: "SOI", req: true },
  ]},
  { cat: "Unsecured Creditors", items: [
    { id: 45, text: "Credit report pulled and reviewed", form: "Sched E/F", req: true },
    { id: 46, text: "All priority debts identified (taxes, DSO)", form: "Sched E/F", req: true },
    { id: 47, text: "All general unsecured debts listed", form: "Sched E/F", req: true },
    { id: 48, text: "Creditor addresses verified", form: "Sched E/F", req: true },
    { id: 49, text: "Account numbers confirmed", form: "Sched E/F", req: true },
    { id: 50, text: "Disputed debts flagged", form: "Sched E/F", req: false },
  ]},
  { cat: "SOFA (Statement of Financial Affairs)", items: [
    { id: 51, text: "Income for current + prior 2 years", form: "SOFA #4", req: true },
    { id: 52, text: "Payments to creditors >$600 (90 days)", form: "SOFA #7", req: true },
    { id: 53, text: "Payments to insiders (1 year)", form: "SOFA #8", req: true },
    { id: 54, text: "Lawsuits / garnishments listed", form: "SOFA #10", req: true },
    { id: 55, text: "Property transfers (2 years)", form: "SOFA #18", req: true },
    { id: 56, text: "Closed bank accounts (1 year)", form: "SOFA #19", req: true },
    { id: 57, text: "Safe deposit boxes disclosed", form: "SOFA #20", req: false },
    { id: 58, text: "All SOFA questions answered", form: "SOFA", req: true },
  ]},
  { cat: "Exemptions", items: [
    { id: 59, text: "Exemption scheme selected (TX state vs federal)", form: "Sched C", req: true },
    { id: 60, text: "All exemptions properly coded", form: "Sched C", req: true },
    { id: 61, text: "Wildcard exemption applied if needed", form: "Sched C", req: false },
    { id: 62, text: "Exemption amounts within statutory limits", form: "Sched C", req: true },
  ]},
  { cat: "Ch.13 Plan (if applicable)", items: [
    { id: 63, text: "Plan payment calculated", form: "Plan", req: false },
    { id: 64, text: "Plan duration set (36 or 60 months)", form: "Plan", req: false },
    { id: 65, text: "Adequate protection payments addressed", form: "Plan", req: false },
    { id: 66, text: "Priority claims treatment specified", form: "Plan", req: false },
    { id: 67, text: "Feasibility confirmed (Schedule J surplus)", form: "Plan", req: false },
  ]},
  { cat: "Filing & Court", items: [
    { id: 68, text: "All petitions and schedules assembled", form: "Petition", req: true },
    { id: 69, text: "Filing fee paid or fee waiver filed", form: "ECF", req: true },
    { id: 70, text: "Petition filed via ECF", form: "ECF", req: true },
    { id: 71, text: "341 meeting date noted", form: "ECF", req: true },
    { id: 72, text: "Trustee assignment confirmed", form: "ECF", req: true },
    { id: 73, text: "Certificate of service filed", form: "ECF", req: false },
  ]},
  { cat: "QC Review", items: [
    { id: 74, text: "Paralegal self-review completed", form: "QC", req: true },
    { id: 75, text: "Attorney review completed", form: "QC", req: true },
    { id: 76, text: "All math verified (income, expenses, means test)", form: "QC", req: true },
    { id: 77, text: "Cross-schedule consistency check", form: "QC", req: true },
    { id: 78, text: "Client signature obtained on all forms", form: "QC", req: true },
    { id: 79, text: "Zero open exceptions confirmed", form: "QC", req: true },
  ]},
  { cat: "Post-Filing", items: [
    { id: 80, text: "341 meeting prep package sent to client", form: "Firm", req: true },
    { id: 81, text: "Trustee document requests fulfilled", form: "Firm", req: true },
    { id: 82, text: "Post-filing debtor education certificate filed", form: "Form 423", req: true },
  ]},
  { cat: "Communications", items: [
    { id: 83, text: "Attorney memo: schedules complete", form: "Firm", req: true },
  ]},
];

const ALL_ITEMS = CHECKLIST.flatMap(c => c.items.map(i => ({ ...i, cat: c.cat })));
const STATUSES = ["Intake", "Doc Collection", "Drafting", "QC Review", "Filed", "Post-Filing"];
const SLA_DAYS = { Intake: 2, "Doc Collection": 7, Drafting: 5, "QC Review": 2, Filed: 1, "Post-Filing": 14 };

/* ── n8n workflow data ── */
const WORKFLOWS = [
  { id: "WF-001", name: "New Case Intake Trigger", nodes: 12, trigger: "Webhook", sla: "< 2 hrs", status: "active", desc: "Fires on new client form submission. Creates case record, assigns paralegal, sends welcome email, provisions portal access." },
  { id: "WF-002", name: "Document Collection Chase", nodes: 18, trigger: "Schedule (daily)", sla: "24 hr response", status: "active", desc: "Scans all open cases for missing documents. Sends reminder emails to clients, escalates to paralegal after 48 hrs, flags overdue items." },
  { id: "WF-003", name: "Schedule Drafting Pipeline", nodes: 24, trigger: "Status change → Drafting", sla: "5 business days", status: "active", desc: "Orchestrates the full schedule assembly: pulls data from BankruptcyPRO, runs means test validation, generates draft schedules, queues for QC." },
  { id: "WF-004", name: "QC Gate & Exception Router", nodes: 15, trigger: "Status change → QC Review", sla: "2 business days", status: "active", desc: "Validates 100% checklist completion, zero open exceptions. Routes passed cases to attorney review. Blocks advancement on failures." },
  { id: "WF-005", name: "Filing & Court Sync", nodes: 9, trigger: "Attorney approval", sla: "Same day", status: "paused", desc: "Assembles final petition package, generates filing checklist, logs ECF filing confirmation, captures 341 meeting date." },
  { id: "WF-006", name: "Post-Filing Monitor", nodes: 11, trigger: "Schedule (weekly)", sla: "14 days", status: "active", desc: "Tracks trustee requests, debtor education deadlines, discharge timeline. Sends client reminders and escalates overdue items." },
];

/* ── helpers ── */
const uid = () => Math.random().toString(36).slice(2, 9);
const d2s = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const dt2s = (d) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

/* ── persistent storage ── */
const load = (k, d) => { try { const v = localStorage.getItem("bk_" + k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem("bk_" + k, JSON.stringify(v)); } catch {} };

/* ── main app ── */
export default function App() {
  const [view, setView] = useState("dashboard");
  const [cases, setCases] = useState(() => load("cases", []));
  const [logs, setLogs] = useState(() => load("logs", []));
  const [checks, setChecks] = useState(() => load("checks", {}));
  const [exceptions, setExceptions] = useState(() => load("exceptions", {}));
  const [modal, setModal] = useState(null);
  const [selCase, setSelCase] = useState(null);
  const [toast, setToast] = useState("");
  const [eTo, setETo] = useState("");
  const [sending, setSending] = useState(false);
  const [newCase, setNewCase] = useState({ debtor: "", chapter: "7", district: "Northern TX", attorney: "" });
  const [sideOpen, setSideOpen] = useState(true);

  useEffect(() => { save("cases", cases); }, [cases]);
  useEffect(() => { save("logs", logs); }, [logs]);
  useEffect(() => { save("checks", checks); }, [checks]);
  useEffect(() => { save("exceptions", exceptions); }, [exceptions]);

  const tt = useCallback((m) => { setToast(m); setTimeout(() => setToast(""), 2500); }, []);
  const log = useCallback((caseId, action) => {
    setLogs(p => [{ id: uid(), caseId, action, ts: Date.now() }, ...p].slice(0, 500));
  }, []);

  /* case CRUD */
  const addCase = () => {
    if (!newCase.debtor.trim()) { tt("Enter debtor name"); return; }
    const c = { id: "BK-" + uid().toUpperCase(), ...newCase, status: "Intake", created: Date.now(), statusDate: Date.now() };
    setCases(p => [c, ...p]);
    log(c.id, "Case created");
    setModal(null);
    setNewCase({ debtor: "", chapter: "7", district: "Northern TX", attorney: "" });
    tt("Case created");
  };

  const setStatus = (id, s) => {
    /* QC gate: block advancement past QC Review unless 100% complete + 0 exceptions */
    const caseChecks = checks[id] || {};
    const caseExc = (exceptions[id] || []).filter(e => e.status === "open");
    const reqItems = ALL_ITEMS.filter(i => i.req);
    const completed = reqItems.filter(i => caseChecks[i.id]).length;
    const statusIdx = STATUSES.indexOf(s);

    if (statusIdx >= 4) { /* Filing or Post-Filing */
      if (completed < reqItems.length) { tt(`QC BLOCKED: ${reqItems.length - completed} required items incomplete`); return; }
      if (caseExc.length > 0) { tt(`QC BLOCKED: ${caseExc.length} open exception(s)`); return; }
    }
    setCases(p => p.map(c => c.id === id ? { ...c, status: s, statusDate: Date.now() } : c));
    log(id, `Status → ${s}`);
    tt(`Status updated to ${s}`);
  };

  /* checklist */
  const toggleCheck = (caseId, itemId) => {
    setChecks(p => {
      const cc = { ...p, [caseId]: { ...(p[caseId] || {}), [itemId]: !(p[caseId] || {})[itemId] } };
      return cc;
    });
    const item = ALL_ITEMS.find(i => i.id === itemId);
    log(caseId, `${checks[caseId]?.[itemId] ? "Unchecked" : "Checked"}: ${item?.text}`);
  };

  /* exceptions */
  const addException = (caseId, itemId) => {
    const item = ALL_ITEMS.find(i => i.id === itemId);
    const exc = { id: uid(), itemId, text: item?.text || "", status: "open", created: Date.now() };
    setExceptions(p => ({ ...p, [caseId]: [...(p[caseId] || []), exc] }));
    log(caseId, `Exception created: ${item?.text}`);
    tt("Exception flagged");
  };

  const resolveException = (caseId, excId) => {
    setExceptions(p => ({
      ...p, [caseId]: (p[caseId] || []).map(e => e.id === excId ? { ...e, status: "resolved", resolved: Date.now() } : e)
    }));
    log(caseId, "Exception resolved");
    tt("Exception resolved");
  };

  /* computed stats */
  const stats = useMemo(() => {
    const active = cases.filter(c => c.status !== "Post-Filing").length;
    const overdue = cases.filter(c => {
      const days = daysBetween(c.statusDate, Date.now());
      return days > (SLA_DAYS[c.status] || 7);
    }).length;
    const qcReady = cases.filter(c => {
      const cc = checks[c.id] || {};
      const req = ALL_ITEMS.filter(i => i.req);
      return req.every(i => cc[i.id]) && !(exceptions[c.id] || []).some(e => e.status === "open") && c.status === "QC Review";
    }).length;
    const openExc = Object.values(exceptions).flat().filter(e => e.status === "open").length;
    return { active, overdue, qcReady, openExc };
  }, [cases, checks, exceptions]);

  const caseProgress = (id) => {
    const cc = checks[id] || {};
    const total = ALL_ITEMS.length;
    const done = ALL_ITEMS.filter(i => cc[i.id]).length;
    return Math.round((done / total) * 100);
  };

  const caseSLA = (c) => {
    const days = daysBetween(c.statusDate, Date.now());
    const limit = SLA_DAYS[c.status] || 7;
    if (days > limit) return "overdue";
    if (days >= limit - 1) return "warning";
    return "on-track";
  };

  const caseOpenExc = (id) => (exceptions[id] || []).filter(e => e.status === "open").length;

  const buildMemo = (id) => {
    const c = cases.find(x => x.id === id);
    if (!c) return "";
    const prog = caseProgress(id);
    const openE = caseOpenExc(id);
    const cc = checks[id] || {};
    const missing = ALL_ITEMS.filter(i => i.req && !cc[i.id]);
    return `MEMORANDUM\n\nTO: Attorney\nFROM: Paralegal (BizDeedz Pipeline)\nRE: ${c.id} — ${c.debtor} (Ch.${c.chapter})\nDATE: ${d2s(Date.now())}\n\nSTATUS: ${c.status}\nPROGRESS: ${prog}% complete\nOPEN EXCEPTIONS: ${openE}\n\n${prog === 100 && openE === 0 ? "All required checklist items are complete with zero open exceptions. Case is ready for attorney review and filing." : `INCOMPLETE ITEMS (${missing.length}):\n${missing.map(m => `  • ${m.text} [${m.form}]`).join("\n")}`}\n\nDISTRICT: ${c.district}\nCHAPTER: ${c.chapter}\nCREATED: ${d2s(c.created)}`;
  };

  const cur = selCase ? cases.find(c => c.id === selCase) : null;

  /* ── styles ── */
  const iStyle = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + T.bd, background: T.s2, color: T.w, fontSize: 13, outline: "none" };
  const btnP = { padding: "7px 16px", borderRadius: 6, border: "none", background: T.gd, color: T.w, fontSize: 12, fontWeight: 600, cursor: "pointer" };
  const btnS = { padding: "7px 14px", borderRadius: 6, border: "1px solid " + T.bd, background: "transparent", color: T.tm, fontSize: 12, cursor: "pointer" };
  const badge = (color) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 600, background: color + "22", color });

  /* ── sidebar nav items ── */
  const NAV = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "kanban", icon: "📋", label: "Kanban Board" },
    { id: "cases", icon: "📁", label: "All Cases" },
    { id: "workflows", icon: "⚡", label: "n8n Workflows" },
    { id: "audit", icon: "📜", label: "Audit Log" },
  ];

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.w, fontFamily: "'Segoe UI',system-ui,sans-serif", fontSize: 13 }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width: sideOpen ? 220 : 56, background: T.s1, borderRight: "1px solid " + T.bd, transition: "width .2s", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: sideOpen ? "18px 16px" : "18px 12px", borderBottom: "1px solid " + T.bd, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setSideOpen(!sideOpen)}>
          <span style={{ fontSize: 20 }}>⚖️</span>
          {sideOpen && <span style={{ fontWeight: 700, fontSize: 14, background: T.gd, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>BK Pipeline</span>}
        </div>
        <div style={{ flex: 1, padding: "8px 0" }}>
          {NAV.map(n => (
            <div key={n.id} onClick={() => setView(n.id)} style={{
              padding: sideOpen ? "10px 16px" : "10px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
              background: view === n.id ? T.ac + "18" : "transparent", borderRight: view === n.id ? "3px solid " + T.ac : "3px solid transparent",
              color: view === n.id ? T.ac : T.tm, transition: "all .15s"
            }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              {sideOpen && <span style={{ fontSize: 13, fontWeight: view === n.id ? 600 : 400 }}>{n.label}</span>}
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid " + T.bd }}>
          <button onClick={() => setModal("new")} style={{ ...btnP, width: "100%", fontSize: sideOpen ? 12 : 18, padding: sideOpen ? "8px 0" : "6px 0" }}>
            {sideOpen ? "+ New Case" : "+"}
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>

        {/* ═══ DASHBOARD ═══ */}
        {view === "dashboard" && <>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, background: T.gd, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pipeline Dashboard</h2>

          {/* stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Active Cases", val: stats.active, color: T.ac, icon: "📂" },
              { label: "Overdue (SLA)", val: stats.overdue, color: T.r, icon: "⏰" },
              { label: "QC-Ready", val: stats.qcReady, color: T.g, icon: "✅" },
              { label: "Open Exceptions", val: stats.openExc, color: T.o, icon: "⚠️" },
            ].map((s, i) => (
              <div key={i} style={{ background: T.s1, border: "1px solid " + T.bd, borderRadius: 10, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: T.tm, fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>{s.label}</span>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* pipeline table */}
          <div style={{ background: T.s1, border: "1px solid " + T.bd, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid " + T.bd, fontWeight: 600, fontSize: 14 }}>Pipeline Overview</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: T.s2 }}>
                    {["Case ID", "Debtor", "Ch.", "Status", "Progress", "SLA", "Exceptions", ""].map((h, i) => (
                      <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: T.tm, textTransform: "uppercase", letterSpacing: .5, borderBottom: "1px solid " + T.bd }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cases.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: T.td }}>No cases yet. Click "+ New Case" to get started.</td></tr>}
                  {cases.map(c => {
                    const prog = caseProgress(c.id);
                    const sla = caseSLA(c);
                    const exc = caseOpenExc(c.id);
                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid " + T.bd, cursor: "pointer" }} onClick={() => { setSelCase(c.id); setModal("detail"); }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: T.ac }}>{c.id}</td>
                        <td style={{ padding: "10px 14px" }}>{c.debtor}</td>
                        <td style={{ padding: "10px 14px" }}>{c.chapter}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={badge(c.status === "Post-Filing" ? T.g : c.status === "Filed" ? T.ac : T.p)}>{c.status}</span>
                        </td>
                        <td style={{ padding: "10px 14px", minWidth: 120 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: T.s3, borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: prog + "%", height: "100%", background: prog === 100 ? T.g : T.gd, borderRadius: 3, transition: "width .3s" }} />
                            </div>
                            <span style={{ fontSize: 11, color: T.tm, minWidth: 30 }}>{prog}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={badge(sla === "overdue" ? T.r : sla === "warning" ? T.y : T.g)}>
                            {sla === "overdue" ? "OVERDUE" : sla === "warning" ? "AT RISK" : "ON TRACK"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {exc > 0 ? <span style={badge(T.r)}>{exc} open</span> : <span style={{ color: T.td }}>—</span>}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ color: T.tm, fontSize: 16 }}>→</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* ═══ KANBAN ═══ */}
        {view === "kanban" && <>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, background: T.gd, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Kanban Board</h2>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUSES.length}, minmax(180px, 1fr))`, gap: 12, overflowX: "auto" }}>
            {STATUSES.map(s => {
              const sc = cases.filter(c => c.status === s);
              return (
                <div key={s} style={{ background: T.s1, border: "1px solid " + T.bd, borderRadius: 10, minHeight: 300 }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid " + T.bd, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{s}</span>
                    <span style={{ ...badge(T.ac), fontSize: 10 }}>{sc.length}</span>
                  </div>
                  <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                    {sc.map(c => {
                      const prog = caseProgress(c.id);
                      const sla = caseSLA(c);
                      const exc = caseOpenExc(c.id);
                      return (
                        <div key={c.id} onClick={() => { setSelCase(c.id); setModal("detail"); }}
                          style={{ background: T.s2, border: "1px solid " + T.bd, borderRadius: 8, padding: 12, cursor: "pointer", borderLeft: `3px solid ${sla === "overdue" ? T.r : sla === "warning" ? T.y : T.g}` }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: T.ac, marginBottom: 4 }}>{c.id}</div>
                          <div style={{ fontSize: 12, marginBottom: 6 }}>{c.debtor}</div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                            <span style={badge(T.p)}>Ch.{c.chapter}</span>
                            {exc > 0 && <span style={badge(T.r)}>⚠ {exc}</span>}
                          </div>
                          <div style={{ height: 4, background: T.s3, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: prog + "%", height: "100%", background: prog === 100 ? T.g : T.ac, borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 10, color: T.td, marginTop: 4 }}>{prog}% complete</div>
                        </div>
                      );
                    })}
                    {sc.length === 0 && <div style={{ padding: 20, textAlign: "center", color: T.td, fontSize: 11 }}>No cases</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </>}

        {/* ═══ ALL CASES ═══ */}
        {view === "cases" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, background: T.gd, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>All Cases</h2>
            <button onClick={() => setModal("new")} style={btnP}>+ New Case</button>
          </div>
          <div style={{ background: T.s1, border: "1px solid " + T.bd, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: T.s2 }}>
                    {["Case ID", "Debtor", "Chapter", "District", "Status", "Attorney", "Created", "Progress", "SLA", "Exceptions"].map((h, i) => (
                      <th key={i} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: T.tm, textTransform: "uppercase", letterSpacing: .5, borderBottom: "1px solid " + T.bd, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cases.length === 0 && <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: T.td }}>No cases</td></tr>}
                  {cases.map(c => {
                    const prog = caseProgress(c.id);
                    const sla = caseSLA(c);
                    const exc = caseOpenExc(c.id);
                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid " + T.bd, cursor: "pointer" }} onClick={() => { setSelCase(c.id); setModal("detail"); }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: T.ac, whiteSpace: "nowrap" }}>{c.id}</td>
                        <td style={{ padding: "8px 12px" }}>{c.debtor}</td>
                        <td style={{ padding: "8px 12px" }}>Ch. {c.chapter}</td>
                        <td style={{ padding: "8px 12px", fontSize: 11 }}>{c.district}</td>
                        <td style={{ padding: "8px 12px" }}><span style={badge(c.status === "Filed" || c.status === "Post-Filing" ? T.g : T.p)}>{c.status}</span></td>
                        <td style={{ padding: "8px 12px", fontSize: 11 }}>{c.attorney || "—"}</td>
                        <td style={{ padding: "8px 12px", fontSize: 11, color: T.tm, whiteSpace: "nowrap" }}>{d2s(c.created)}</td>
                        <td style={{ padding: "8px 12px", minWidth: 100 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ flex: 1, height: 5, background: T.s3, borderRadius: 3 }}>
                              <div style={{ width: prog + "%", height: "100%", background: prog === 100 ? T.g : T.ac, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 10, color: T.tm }}>{prog}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={badge(sla === "overdue" ? T.r : sla === "warning" ? T.y : T.g)}>
                            {sla === "overdue" ? "OVER" : sla === "warning" ? "RISK" : "OK"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {exc > 0 ? <span style={badge(T.r)}>{exc}</span> : <span style={{ color: T.td }}>0</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* ═══ N8N WORKFLOWS ═══ */}
        {view === "workflows" && <>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, background: T.gd, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>n8n Automation Dashboard</h2>
          <p style={{ color: T.tm, fontSize: 12, marginBottom: 20 }}>6 workflows powering the BK Pipeline — from intake to discharge</p>

          {/* pipeline visualization */}
          <div style={{ background: T.s1, border: "1px solid " + T.bd, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Pipeline Flow</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", paddingBottom: 8 }}>
              {STATUSES.map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ background: T.s2, border: "1px solid " + T.bd, borderRadius: 8, padding: "10px 16px", textAlign: "center", minWidth: 110 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.ac, marginBottom: 2 }}>{s}</div>
                    <div style={{ fontSize: 10, color: T.td }}>SLA: {SLA_DAYS[s]}d</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{cases.filter(c => c.status === s).length}</div>
                  </div>
                  {i < STATUSES.length - 1 && <span style={{ color: T.td, fontSize: 18 }}>→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* workflow cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 14, marginBottom: 20 }}>
            {WORKFLOWS.map(w => (
              <div key={w.id} style={{ background: T.s1, border: "1px solid " + T.bd, borderRadius: 10, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.td, marginBottom: 2 }}>{w.id}</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{w.name}</div>
                  </div>
                  <span style={badge(w.status === "active" ? T.g : T.y)}>{w.status}</span>
                </div>
                <p style={{ fontSize: 11, color: T.tm, lineHeight: 1.5, marginBottom: 12 }}>{w.desc}</p>
                <div style={{ display: "flex", gap: 12, fontSize: 10, color: T.td }}>
                  <span>🔗 {w.nodes} nodes</span>
                  <span>⚡ {w.trigger}</span>
                  <span>⏱ {w.sla}</span>
                </div>
              </div>
            ))}
          </div>

          {/* deployment timeline */}
          <div style={{ background: T.s1, border: "1px solid " + T.bd, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Deployment Timeline</div>
            <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
              {[
                { week: "Wk 1-2", label: "Intake + Doc Collection", wfs: "WF-001, WF-002", color: T.ac },
                { week: "Wk 3-4", label: "Drafting Pipeline", wfs: "WF-003", color: T.p },
                { week: "Wk 5-6", label: "QC Gate + Filing", wfs: "WF-004, WF-005", color: T.g },
                { week: "Wk 7-8", label: "Post-Filing Monitor", wfs: "WF-006", color: T.y },
              ].map((phase, i) => (
                <div key={i} style={{ flex: 1, padding: "12px 14px", borderLeft: i > 0 ? "1px solid " + T.bd : "none", borderTop: "3px solid " + phase.color }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: phase.color, marginBottom: 4 }}>{phase.week}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{phase.label}</div>
                  <div style={{ fontSize: 10, color: T.td }}>{phase.wfs}</div>
                </div>
              ))}
            </div>
          </div>
        </>}

        {/* ═══ AUDIT LOG ═══ */}
        {view === "audit" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, background: T.gd, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Audit Log</h2>
            <span style={{ fontSize: 11, color: T.td }}>{logs.length} entries</span>
          </div>
          <div style={{ background: T.s1, border: "1px solid " + T.bd, borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.s2 }}>
                  {["Timestamp", "Case", "Action"].map((h, i) => (
                    <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, color: T.tm, textTransform: "uppercase", borderBottom: "1px solid " + T.bd }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && <tr><td colSpan={3} style={{ padding: 40, textAlign: "center", color: T.td }}>No activity yet</td></tr>}
                {logs.slice(0, 100).map(l => (
                  <tr key={l.id} style={{ borderBottom: "1px solid " + T.bd }}>
                    <td style={{ padding: "8px 14px", fontSize: 11, color: T.tm, whiteSpace: "nowrap" }}>{dt2s(l.ts)}</td>
                    <td style={{ padding: "8px 14px", fontWeight: 600, color: T.ac }}>{l.caseId}</td>
                    <td style={{ padding: "8px 14px", fontSize: 12 }}>{l.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}
      </div>

      {/* ═══ MODALS ═══ */}
      {modal && (
        <div onClick={() => { setModal(null); setSelCase(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.s1, border: "1px solid " + T.bd, borderRadius: 12, maxHeight: "90vh", overflow: "auto", maxWidth: modal === "detail" ? 760 : 480, width: "95%" }}>

            {/* NEW CASE */}
            {modal === "new" && (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, background: T.gd, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>New Case</h3>
                {[
                  { label: "Debtor Name", key: "debtor", type: "text" },
                  { label: "Attorney", key: "attorney", type: "text" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: T.td, marginBottom: 4, textTransform: "uppercase" }}>{f.label}</label>
                    <input value={newCase[f.key]} onChange={e => setNewCase({ ...newCase, [f.key]: e.target.value })} style={iStyle} placeholder={f.label} />
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: T.td, marginBottom: 4, textTransform: "uppercase" }}>Chapter</label>
                    <select value={newCase.chapter} onChange={e => setNewCase({ ...newCase, chapter: e.target.value })} style={iStyle}>
                      <option value="7">Chapter 7</option>
                      <option value="13">Chapter 13</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: T.td, marginBottom: 4, textTransform: "uppercase" }}>District</label>
                    <select value={newCase.district} onChange={e => setNewCase({ ...newCase, district: e.target.value })} style={iStyle}>
                      {["Northern TX", "Eastern TX", "Southern TX", "Western TX"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => setModal(null)} style={btnS}>Cancel</button>
                  <button onClick={addCase} style={btnP}>Create Case</button>
                </div>
              </div>
            )}

            {/* CASE DETAIL */}
            {modal === "detail" && cur && (
              <div style={{ padding: 0 }}>
                {/* header */}
                <div style={{ padding: "18px 22px", borderBottom: "1px solid " + T.bd, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.td, marginBottom: 2 }}>{cur.id} • Ch.{cur.chapter} • {cur.district}</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{cur.debtor}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setModal("memo"); }} style={{ ...btnS, fontSize: 11 }}>📄 Memo</button>
                    <button onClick={() => { setModal("email"); setETo(""); }} style={{ ...btnS, fontSize: 11 }}>✉ Gmail Draft</button>
                    <button onClick={() => { setModal(null); setSelCase(null); }} style={{ ...btnS, fontSize: 16, padding: "4px 10px" }}>✕</button>
                  </div>
                </div>

                {/* status bar */}
                <div style={{ padding: "12px 22px", borderBottom: "1px solid " + T.bd, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => setStatus(cur.id, s)} style={{
                      padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      border: cur.status === s ? "none" : "1px solid " + T.bd,
                      background: cur.status === s ? T.gd : "transparent",
                      color: cur.status === s ? T.w : T.tm,
                    }}>{s}</button>
                  ))}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 12, fontSize: 11 }}>
                    <span style={{ color: T.tm }}>Progress: <strong style={{ color: T.w }}>{caseProgress(cur.id)}%</strong></span>
                    <span style={badge(caseSLA(cur) === "overdue" ? T.r : caseSLA(cur) === "warning" ? T.y : T.g)}>
                      SLA: {caseSLA(cur) === "overdue" ? "OVERDUE" : caseSLA(cur) === "warning" ? "AT RISK" : "ON TRACK"}
                    </span>
                  </div>
                </div>

                {/* checklist + exceptions */}
                <div style={{ padding: "16px 22px", maxHeight: 450, overflow: "auto" }}>
                  {CHECKLIST.map(cat => {
                    const cc = checks[cur.id] || {};
                    const done = cat.items.filter(i => cc[i.id]).length;
                    const total = cat.items.length;
                    return (
                      <div key={cat.cat} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 12, color: T.ac }}>{cat.cat}</span>
                          <span style={{ fontSize: 10, color: done === total ? T.g : T.tm }}>{done}/{total}</span>
                        </div>
                        {cat.items.map(item => {
                          const checked = (checks[cur.id] || {})[item.id];
                          const hasExc = (exceptions[cur.id] || []).some(e => e.itemId === item.id && e.status === "open");
                          return (
                            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid " + T.bd + "44" }}>
                              <input type="checkbox" checked={!!checked} onChange={() => toggleCheck(cur.id, item.id)}
                                style={{ accentColor: T.g, width: 15, height: 15, cursor: "pointer" }} />
                              <span style={{ flex: 1, fontSize: 12, color: checked ? T.g : T.w, textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.7 : 1 }}>
                                {item.text}
                              </span>
                              {item.req && <span style={{ fontSize: 9, color: T.r, fontWeight: 700 }}>REQ</span>}
                              <span style={{ fontSize: 9, color: T.td }}>[{item.form}]</span>
                              {!checked && !hasExc && (
                                <button onClick={() => addException(cur.id, item.id)} title="Flag exception"
                                  style={{ background: "none", border: "none", cursor: "pointer", color: T.o, fontSize: 14, padding: "0 4px" }}>⚠</button>
                              )}
                              {hasExc && <span style={{ fontSize: 10, color: T.r }}>⛔ EXC</span>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* exceptions panel */}
                  {(exceptions[cur.id] || []).length > 0 && (
                    <div style={{ marginTop: 16, padding: 14, background: T.r + "11", border: "1px solid " + T.r + "33", borderRadius: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: T.r, marginBottom: 8 }}>Exceptions ({(exceptions[cur.id] || []).filter(e => e.status === "open").length} open)</div>
                      {(exceptions[cur.id] || []).map(exc => (
                        <div key={exc.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid " + T.r + "22" }}>
                          <span style={{ flex: 1, fontSize: 11, color: exc.status === "resolved" ? T.g : T.r, textDecoration: exc.status === "resolved" ? "line-through" : "none" }}>
                            {exc.text}
                          </span>
                          <span style={badge(exc.status === "resolved" ? T.g : T.r)}>{exc.status}</span>
                          {exc.status === "open" && (
                            <button onClick={() => resolveException(cur.id, exc.id)} style={{ ...btnS, fontSize: 10, padding: "3px 8px" }}>Resolve</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MEMO PREVIEW */}
            {modal === "memo" && cur && (
              <div style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.w }}>Attorney Memo</h3>
                  <button onClick={() => setModal("detail")} style={btnS}>← Back</button>
                </div>
                <pre style={{ fontFamily: "system-ui", fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-wrap", background: T.s2, padding: 16, borderRadius: 8, border: "1px solid " + T.bd, color: T.tm, margin: 0 }}>{buildMemo(cur.id)}</pre>
              </div>
            )}

            {/* GMAIL DRAFT */}
            {modal === "email" && cur && (
              <div style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.w }}>✉ Create Gmail Draft</h3>
                  <button onClick={() => setModal("detail")} style={btnS}>← Back</button>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: T.td, marginBottom: 4, textTransform: "uppercase" }}>Attorney Email</label>
                  <input value={eTo} onChange={e => setETo(e.target.value)} placeholder="attorney@popelaw.com" style={iStyle} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: T.td, marginBottom: 4, textTransform: "uppercase" }}>Preview</label>
                  <pre style={{ fontFamily: "system-ui", fontSize: 10, lineHeight: 1.5, whiteSpace: "pre-wrap", background: T.s2, padding: 12, borderRadius: 8, border: "1px solid " + T.bd, color: T.td, margin: 0, maxHeight: 200, overflow: "auto" }}>{buildMemo(cur.id)}</pre>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => setModal("detail")} style={btnS}>Cancel</button>
                  <button disabled={sending} onClick={async () => {
                    if (!eTo.trim()) { tt("Enter email"); return; }
                    setSending(true);
                    try {
                      const resp = await fetch("https://api.anthropic.com/v1/messages", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          model: "claude-sonnet-4-20250514",
                          max_tokens: 1000,
                          messages: [{ role: "user", content: "Create a Gmail draft to " + eTo + " with subject: " + cur.id + " — Schedules Status Update and body:\n\n" + buildMemo(cur.id) }],
                          mcp_servers: [{ type: "url", url: "https://gmail.mcp.claude.com/mcp", name: "gmail" }]
                        })
                      });
                      if (resp.ok) {
                        tt("✅ Gmail draft created — check your Drafts folder");
                        log(cur.id, "Gmail draft created → " + eTo);
                      } else { tt("Draft creation failed — copy memo manually"); }
                    } catch { tt("Connection error — copy memo manually"); }
                    setSending(false);
                  }} style={{ ...btnP, opacity: sending ? 0.6 : 1, cursor: sending ? "wait" : "pointer" }}>
                    {sending ? "Creating..." : "Create Gmail Draft"}
                  </button>
                </div>
                <div style={{ fontSize: 9, color: T.td, marginTop: 10, textAlign: "center" }}>Creates a DRAFT only — you review and send from Gmail.</div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: T.s2, border: "1px solid " + T.bd, borderRadius: 8, padding: "10px 20px", color: T.w, fontSize: 12, fontWeight: 600, zIndex: 1100, boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
