import { useState, useMemo } from "react";

const SECTIONS = [
  {
    id: "topology",
    label: "Systems Topology",
    icon: "⬡",
    color: "#A87AD4",
    summary: "How the machine is wired",
    items: [
      { name: "n8n Workflow Engine", status: "Primary", progress: 80, desc: "Core automation platform — migrated from Make.com for flexibility and self-hosting" },
      { name: "Claude AI Agent Layer", status: "Active", progress: 85, desc: "EDGE Agent system — skills, playbooks, and diagnostic tools powering delivery" },
      { name: "Client Intake Pipeline", status: "Built", progress: 90, desc: "Intake form → structured case summary → deadline checklist → workflow triggers" },
      { name: "Proposal & Scope Engine", status: "Built", progress: 90, desc: "Prospect info → scoped proposal across all tiers ($2.5K–$25K+)" },
      { name: "Knowledge Base (Playbooks)", status: "Active", progress: 75, desc: "TX district playbooks, trustee database, SOP library — single source of truth" },
      { name: "Content Distribution", status: "In Progress", progress: 45, desc: "LinkedIn scheduling, thought leadership pipeline, lead magnet delivery" },
    ],
    flow: ["Intake", "Qualify", "Scope", "Deliver", "QA", "Handoff"],
  },
  {
    id: "delivery",
    label: "Delivery Engine",
    icon: "▣",
    color: "#D47A7A",
    summary: "Throughput, quality & consistency",
    items: [
      { name: "Diagnostic Sprint", status: "Active", tier: "$2,500", progress: 100, cycle: "2 weeks", desc: "AI Readiness Assessment — firm evaluation with actionable roadmap" },
      { name: "Workflow Buildout", status: "Active", tier: "$7,500", progress: 100, cycle: "4–6 weeks", desc: "Custom automation — intake, compliance, and reporting systems" },
      { name: "Ops Transformation", status: "Active", tier: "$15,000", progress: 100, cycle: "8–12 weeks", desc: "Full operational overhaul — process redesign, training, KPI frameworks" },
      { name: "Full Implementation", status: "Active", tier: "$25,000+", progress: 85, cycle: "12–16 weeks", desc: "End-to-end EDGE deployment with ongoing optimization" },
    ],
    metrics: [
      { label: "Rework Benchmark", value: "25%↓", note: "Proven at Allmand" },
      { label: "Backlog Benchmark", value: "60%↓", note: "Proven at Allmand" },
      { label: "Matters Managed", value: "300+/mo", note: "12 attorneys" },
    ],
  },
  {
    id: "automation",
    label: "Automation Engine",
    icon: "◈",
    color: "#7AACB3",
    summary: "Leverage, not labor",
    items: [
      { name: "Matter Intake Processor", status: "Built", progress: 85, desc: "Raw client info → structured bankruptcy case summary, deadlines, district-specific reqs" },
      { name: "Proposal Generator", status: "Built", progress: 90, desc: "Prospect data → scoped consulting proposals across all BizDeedz service tiers" },
      { name: "Diagnostic Report Builder", status: "Built", progress: 85, desc: "Firm evaluation → formatted AI Readiness Assessment deliverable" },
      { name: "Role Fit Analyzer", status: "Built", progress: 90, desc: "JD analysis → gap identification → talking points → positioning strategy" },
      { name: "Cover Letter Generator", status: "Built", progress: 85, desc: "Role-specific application materials for Director-level legal ops roles" },
      { name: "Content Pipeline", status: "In Progress", progress: 50, desc: "LinkedIn content creation, scheduling, distribution automation" },
    ],
    metrics: [
      { label: "Agents Built", value: "6", note: "production" },
      { label: "Platform", value: "n8n", note: "self-hosted ready" },
      { label: "Prior Stack", value: "Make.com", note: "migrated" },
    ],
  },
  {
    id: "knowledge",
    label: "Knowledge & IP",
    icon: "◆",
    color: "#D4A853",
    summary: "Assets that compound, not just work that ships",
    items: [
      { name: "EDGE Framework™", status: "Productized", progress: 90, desc: "Enterprise Diagnostic & Growth Engine — assessment + transformation methodology" },
      { name: "FLOW Framework™", status: "Documented", progress: 70, desc: "Firm-Level Operations Workflow — end-to-end bankruptcy operations playbook" },
      { name: "Ghost Protocol™", status: "Templated", progress: 60, desc: "Digital boundary-setting and capacity protection framework" },
      { name: "Bulletproof Ops™", status: "In Development", progress: 40, desc: "Compliance-first operational resilience methodology" },
      { name: "TX Northern District Playbook", status: "Complete", progress: 100, desc: "Full bankruptcy procedures, local rules, trustee protocols" },
      { name: "TX Southern District Playbook", status: "Complete", progress: 95, desc: "Houston division workflows and compliance requirements" },
      { name: "TX Eastern District Playbook", status: "In Progress", progress: 65, desc: "Tyler/Sherman division procedures and trustee expectations" },
      { name: "TX Western District Playbook", status: "In Progress", progress: 55, desc: "San Antonio/Austin division protocols" },
      { name: "Trustee Intelligence Database", status: "Active", progress: 85, desc: "37+ Texas trustees — preferences, requirements, patterns, compliance triggers" },
      { name: "AI Readiness Assessment Tool", status: "Productized", progress: 90, desc: "Diagnostic for evaluating law firm operational maturity" },
    ],
    metrics: [
      { label: "Frameworks", value: "4", note: "proprietary" },
      { label: "Playbooks", value: "4", note: "TX districts" },
      { label: "Trustees Profiled", value: "37+", note: "active database" },
    ],
  },
  {
    id: "governance",
    label: "Governance & Risk",
    icon: "▢",
    color: "#8B9DAF",
    summary: "Trust layer — enterprise readiness signals",
    items: [
      { name: "Client Data Handling", status: "Defined", progress: 65, desc: "Storage locations, retention rules, sharing protocols for client matter data" },
      { name: "AI Usage & Disclosure", status: "Defined", progress: 70, desc: "Transparency stance on AI-assisted deliverables and data processing" },
      { name: "Vendor Register", status: "In Progress", progress: 50, desc: "Tools, purpose, risk rating, contract dates, renewal tracking" },
      { name: "Access Controls", status: "In Progress", progress: 45, desc: "Who has access to what — least privilege approach across tool stack" },
      { name: "SOP Documentation Coverage", status: "In Progress", progress: 55, desc: "What's formally documented vs. tribal knowledge — gap tracking" },
      { name: "Incident & Exception Log", status: "Not Started", progress: 10, desc: "What went wrong, root cause, mitigation, preventative controls" },
    ],
    metrics: [
      { label: "Data Protocols", value: "Defined", note: "needs hardening" },
      { label: "AI Disclosure", value: "Defined", note: "client-facing" },
      { label: "Audit Trail", value: "Partial", note: "building out" },
    ],
  },
  {
    id: "financial",
    label: "Financial Engine",
    icon: "◇",
    color: "#D4C27A",
    summary: "Unit economics & runway to replacement",
    items: [
      { name: "Revenue Mix Model", status: "Designing", progress: 35, desc: "Project vs recurring breakdown by offer tier — target: 40% recurring" },
      { name: "Gross Margin by Offer", status: "Not Started", progress: 15, desc: "Revenue minus cost-to-deliver (labor hours + tooling/AI) per tier" },
      { name: "Capacity Forecast", status: "In Progress", progress: 40, desc: "Given current WIP + cycle time → max monthly delivery throughput" },
      { name: "Salary Replacement Track", status: "Active", progress: 30, desc: "Path to replacing six-figure income with consulting revenue" },
      { name: "Job Search Pipeline", status: "Active", progress: 60, desc: "Director-level healthcare tech legal ops roles — parallel strategy" },
    ],
    metrics: [
      { label: "Target Income", value: "6 figures", note: "replacement" },
      { label: "Strategy", value: "Dual", note: "consult + role" },
      { label: "Recurring Goal", value: "40%", note: "of revenue" },
    ],
  },
  {
    id: "pipeline",
    label: "Pipeline & GTM",
    icon: "◎",
    color: "#7AD4A8",
    summary: "Demand generation as an operationalized system",
    items: [
      { name: "LinkedIn Thought Leadership", status: "Active", progress: 70, desc: "Category creation: 'Legal Operations Agents' — positioning as pioneer" },
      { name: "Lead Qualification Process", status: "In Progress", progress: 40, desc: "ICP scoring — firm size, practice area, pain signals, readiness indicators" },
      { name: "Content → Consult Attribution", status: "Not Started", progress: 15, desc: "Tracking which content drives consultation requests — even directional" },
      { name: "Referral Network", status: "Active", progress: 50, desc: "Professional relationships generating warm introductions to prospects" },
      { name: "BizDeedz Brand Identity", status: "Established", progress: 80, desc: "AI-powered workflow automation for small law firms (2–15 attorneys)" },
      { name: "Turea Simpson Brand", status: "In Development", progress: 55, desc: "Executive coaching for high-performing women — boundaries & performance" },
    ],
    metrics: [
      { label: "ICP", value: "2–15 atty", note: "small law firms" },
      { label: "Positioning", value: "Category", note: "Legal Ops Agents" },
      { label: "Dual Brand", value: "Active", note: "BizDeedz + personal" },
    ],
  },
  {
    id: "roadmap",
    label: "Roadmap",
    icon: "▷",
    color: "#C084FC",
    summary: "What's being built next — strategy, not reaction",
    items: [
      { name: "Complete TX District Playbooks", status: "In Progress", progress: 60, desc: "Eastern and Western districts to full coverage — all 4 TX federal districts" },
      { name: "n8n Automation Expansion", status: "In Progress", progress: 50, desc: "Content pipeline, client onboarding sequences, reporting dashboards" },
      { name: "Recurring Revenue Packages", status: "Designing", progress: 25, desc: "Monthly retainer structures for ongoing optimization and support" },
      { name: "Lead Attribution System", status: "Planned", progress: 10, desc: "Track content → consult conversion for smarter GTM investment" },
      { name: "Incident & Exception Logging", status: "Planned", progress: 5, desc: "Formal tracking of delivery issues, root causes, and preventative controls" },
      { name: "Gross Margin Analysis", status: "Planned", progress: 10, desc: "True cost-to-deliver per tier to optimize pricing and capacity" },
    ],
    metrics: [
      { label: "Priority", value: "Playbooks", note: "this quarter" },
      { label: "Next", value: "Revenue", note: "recurring model" },
      { label: "Technical Debt", value: "Moderate", note: "governance gaps" },
    ],
  },
];

const STATUS_COLORS = {
  "Complete": "#4ADE80",
  "Productized": "#D4A853",
  "Active": "#60A5FA",
  "Built": "#818CF8",
  "Established": "#60A5FA",
  "Primary": "#818CF8",
  "Defined": "#60A5FA",
  "Documented": "#A78BFA",
  "Templated": "#F59E0B",
  "In Progress": "#FB923C",
  "In Development": "#FB923C",
  "Building": "#FB923C",
  "Designing": "#94A3B8",
  "Planned": "#64748B",
  "Not Started": "#475569",
};

const SORT_OPTIONS = [
  { id: "progress-desc", label: "Progress ↓" },
  { id: "progress-asc", label: "Progress ↑" },
  { id: "alpha", label: "A–Z" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ value, color, animate = true }) {
  return (
    <div style={{
      width: "100%", height: 5, background: "rgba(255,255,255,0.06)",
      borderRadius: 3, overflow: "hidden", marginTop: 8,
    }}>
      <div style={{
        width: `${value}%`, height: "100%",
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
        borderRadius: 3,
        transition: animate ? "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
      }} />
    </div>
  );
}

function SectionTab({ section, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);
  const avgProgress = Math.round(
    section.items.reduce((s, i) => s + i.progress, 0) / section.items.length
  );
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${section.color}18, ${section.color}08)`
          : hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: isActive ? `1px solid ${section.color}55` : "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12, padding: "14px 16px", cursor: "pointer",
        textAlign: "left", transition: "all 0.2s ease", width: "100%",
        position: "relative", overflow: "hidden",
        transform: hovered && !isActive ? "translateX(2px)" : "none",
      }}
    >
      {isActive && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: 3, height: "100%",
          background: section.color, borderRadius: "3px 0 0 3px",
        }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ color: section.color, fontSize: 13 }}>{section.icon}</span>
        <span style={{
          color: isActive ? "#F1F0EC" : "#9B9A97", fontSize: 12,
          fontWeight: 600, letterSpacing: "0.02em", fontFamily: "'DM Sans', sans-serif",
        }}>{section.label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          color: section.color, fontSize: 22, fontWeight: 700,
          fontFamily: "'Instrument Serif', Georgia, serif", lineHeight: 1,
        }}>{avgProgress}%</span>
        <span style={{ color: "#5A5955", fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
          {section.items.length} items
        </span>
      </div>
      <ProgressBar value={avgProgress} color={section.color} />
    </button>
  );
}

function MetricPill({ metric, color }) {
  return (
    <div style={{
      background: `${color}10`, border: `1px solid ${color}25`,
      borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 100,
    }}>
      <div style={{
        color, fontSize: 18, fontWeight: 700,
        fontFamily: "'Instrument Serif', Georgia, serif", lineHeight: 1.1,
      }}>{metric.value}</div>
      <div style={{
        color: "#9B9A97", fontSize: 10, fontFamily: "'DM Sans', sans-serif",
        marginTop: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
      }}>{metric.label}</div>
      <div style={{
        color: "#5A5955", fontSize: 9, fontFamily: "'DM Mono', monospace", marginTop: 2,
      }}>{metric.note}</div>
    </div>
  );
}

function FlowDiagram({ steps, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap",
      padding: "12px 16px", background: "rgba(255,255,255,0.02)",
      borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)", marginBottom: 12,
    }}>
      <span style={{
        color: "#5A5955", fontSize: 10, fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 8,
      }}>Data Flow</span>
      {steps.map((step, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{
            background: `${color}20`, color, fontSize: 10, fontWeight: 600,
            padding: "3px 10px", borderRadius: 6, fontFamily: "'DM Mono', monospace",
          }}>{step}</span>
          {i < steps.length - 1 && <span style={{ color: "#3A3935", fontSize: 11 }}>→</span>}
        </span>
      ))}
    </div>
  );
}

function ItemRow({ item, color, index, searchQuery }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Auto-expand when searching so description is visible
  const isExpanded = expanded || (searchQuery && searchQuery.length > 1);

  const highlight = (text) => {
    if (!searchQuery || searchQuery.length < 2) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} style={{ background: `${color}55`, color: "#F1F0EC", borderRadius: 2, padding: "0 1px" }}>{part}</mark>
        : part
    );
  };

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "14px 18px",
        background: hovered ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
        borderRadius: 10,
        border: expanded
          ? `1px solid ${color}30`
          : hovered ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.04)",
        animation: `fadeSlideIn 0.35s ease ${index * 0.04}s both`,
        cursor: "pointer",
        transition: "background 0.15s ease, border 0.15s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Expand chevron */}
            <span style={{
              color: expanded ? color : "#4A4945",
              fontSize: 9, transition: "transform 0.2s ease, color 0.2s ease",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              display: "inline-block",
            }}>▶</span>
            <span style={{
              color: "#F1F0EC", fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}>{highlight(item.name)}</span>
            {item.tier && (
              <span style={{
                background: `${color}22`, color, fontSize: 10, fontWeight: 700,
                padding: "2px 9px", borderRadius: 20, fontFamily: "'DM Mono', monospace",
              }}>{item.tier}</span>
            )}
            {item.cycle && (
              <span style={{
                background: "rgba(255,255,255,0.05)", color: "#7A7975", fontSize: 10,
                fontWeight: 500, padding: "2px 9px", borderRadius: 20,
                fontFamily: "'DM Mono', monospace",
              }}>{item.cycle}</span>
            )}
          </div>

          {/* Description — shown when expanded */}
          <div style={{
            overflow: "hidden",
            maxHeight: isExpanded ? 80 : 0,
            opacity: isExpanded ? 1 : 0,
            transition: "max-height 0.25s ease, opacity 0.2s ease",
            marginTop: isExpanded ? 6 : 0,
          }}>
            <p style={{
              color: "#8B8A87", fontSize: 11, lineHeight: 1.6,
              margin: 0, fontFamily: "'DM Sans', sans-serif",
            }}>{highlight(item.desc)}</p>
          </div>
        </div>

        <span style={{
          background: `${STATUS_COLORS[item.status] || "#94A3B8"}15`,
          color: STATUS_COLORS[item.status] || "#94A3B8",
          fontSize: 9, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
          whiteSpace: "nowrap", marginLeft: 12, fontFamily: "'DM Sans', sans-serif",
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>{item.status}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1 }}><ProgressBar value={item.progress} color={color} /></div>
        <span style={{ color: "#5A5955", fontSize: 9, fontFamily: "'DM Mono', monospace", minWidth: 28, textAlign: "right" }}>
          {item.progress}%
        </span>
      </div>
    </div>
  );
}

function OverallHealth() {
  const allItems = SECTIONS.flatMap((s) => s.items);
  const overall = Math.round(allItems.reduce((s, i) => s + i.progress, 0) / allItems.length);
  const production = allItems.filter((i) => i.progress >= 85).length;
  const building = allItems.filter((i) => i.progress >= 40 && i.progress < 85).length;
  const early = allItems.filter((i) => i.progress < 40).length;
  const total = allItems.length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 24 }}>
      {[
        { label: "Infrastructure Score", value: `${overall}%`, color: "#D4A853" },
        { label: "Total Assets", value: total, sub: "tracked", color: "#F1F0EC" },
        { label: "Production Ready", value: production, sub: "≥85%", color: "#4ADE80" },
        { label: "Building", value: building, sub: "40–84%", color: "#FB923C" },
        { label: "Early / Planned", value: early, sub: "<40%", color: "#64748B" },
      ].map((stat, i) => (
        <div key={i} style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10, padding: "14px 16px", textAlign: "center",
        }}>
          <div style={{
            color: stat.color, fontSize: 26, fontWeight: 700,
            fontFamily: "'Instrument Serif', Georgia, serif", lineHeight: 1.1,
          }}>{stat.value}</div>
          <div style={{
            color: "#7A7975", fontSize: 10, fontFamily: "'DM Sans', sans-serif",
            marginTop: 3, fontWeight: 500,
          }}>{stat.label}</div>
          {stat.sub && (
            <div style={{
              color: "#4A4945", fontSize: 9, fontFamily: "'DM Mono', monospace", marginTop: 2,
            }}>{stat.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function BeforeAfter() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
      <div style={{
        background: "rgba(212,120,120,0.05)", border: "1px solid rgba(212,120,120,0.15)",
        borderRadius: 12, padding: "16px 20px",
      }}>
        <div style={{
          color: "#D47A7A", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif", marginBottom: 10,
        }}>Before — Traditional Paralegal Model</div>
        {[
          "Manual intake & document prep",
          "Tribal knowledge, no SOPs",
          "Ad hoc delivery, no scalability",
          "Trading time for money",
          "Reactive compliance management",
        ].map((t, i) => (
          <div key={i} style={{
            color: "#8B7A7A", fontSize: 11, fontFamily: "'DM Sans', sans-serif",
            padding: "4px 0", lineHeight: 1.5,
          }}>
            <span style={{ color: "#D47A7A55", marginRight: 8 }}>—</span>{t}
          </div>
        ))}
      </div>
      <div style={{
        background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)",
        borderRadius: 12, padding: "16px 20px",
      }}>
        <div style={{
          color: "#4ADE80", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif", marginBottom: 10,
        }}>Now — Systematized Consulting Operation</div>
        {[
          "Automated intake → case structuring → deadlines",
          "4 proprietary frameworks, 4 district playbooks",
          "Productized tiers from $2.5K to $25K+",
          "AI-powered delivery with compounding IP",
          "Proactive compliance with trustee intelligence",
        ].map((t, i) => (
          <div key={i} style={{
            color: "#7A9B83", fontSize: 11, fontFamily: "'DM Sans', sans-serif",
            padding: "4px 0", lineHeight: 1.5,
          }}>
            <span style={{ color: "#4ADE8055", marginRight: 8 }}>◆</span>{t}
          </div>
        ))}
      </div>
    </div>
  );
}

// Overview: compact grid of all sections
function OverviewPanel({ onSelectSection }) {
  return (
    <div>
      <div style={{
        color: "#5A5955", fontSize: 11, fontFamily: "'DM Sans', sans-serif",
        marginBottom: 16, fontWeight: 500,
      }}>
        All {SECTIONS.length} sections · {SECTIONS.flatMap((s) => s.items).length} total assets
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10,
      }}>
        {SECTIONS.map((section) => {
          const avg = Math.round(section.items.reduce((s, i) => s + i.progress, 0) / section.items.length);
          const ready = section.items.filter((i) => i.progress >= 85).length;
          const inProg = section.items.filter((i) => i.progress >= 40 && i.progress < 85).length;
          const early = section.items.filter((i) => i.progress < 40).length;
          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(section.id)}
              style={{
                background: `linear-gradient(135deg, ${section.color}10, ${section.color}04)`,
                border: `1px solid ${section.color}30`,
                borderRadius: 12, padding: "16px", cursor: "pointer",
                textAlign: "left", transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${section.color}20, ${section.color}08)`;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${section.color}10, ${section.color}04)`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ color: section.color, fontSize: 16 }}>{section.icon}</span>
                <span style={{
                  color: "#E1E0DC", fontSize: 12, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                }}>{section.label}</span>
                <span style={{
                  marginLeft: "auto", color: section.color, fontSize: 20, fontWeight: 700,
                  fontFamily: "'Instrument Serif', Georgia, serif",
                }}>{avg}%</span>
              </div>
              <ProgressBar value={avg} color={section.color} animate={false} />
              <div style={{
                display: "flex", gap: 10, marginTop: 10,
              }}>
                {[
                  { label: "ready", value: ready, color: "#4ADE80" },
                  { label: "building", value: inProg, color: "#FB923C" },
                  { label: "early", value: early, color: "#64748B" },
                ].map((s) => (
                  <span key={s.label} style={{
                    fontSize: 10, fontFamily: "'DM Mono', monospace", color: s.color,
                  }}>{s.value} {s.label}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Search results panel
function SearchResultsPanel({ query, onSelectSection }) {
  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const out = [];
    for (const section of SECTIONS) {
      const matched = section.items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q)
      );
      if (matched.length > 0) out.push({ section, matched });
    }
    return out;
  }, [query]);

  if (!query || query.length < 2) return null;

  return (
    <div>
      <div style={{
        color: "#5A5955", fontSize: 11, fontFamily: "'DM Sans', sans-serif",
        marginBottom: 14,
      }}>
        {results.reduce((s, r) => s + r.matched.length, 0)} results for "{query}"
      </div>
      {results.length === 0 ? (
        <div style={{ color: "#4A4945", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
          No matching items found.
        </div>
      ) : (
        results.map(({ section, matched }) => (
          <div key={section.id} style={{ marginBottom: 20 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
              cursor: "pointer",
            }} onClick={() => onSelectSection(section.id)}>
              <span style={{ color: section.color, fontSize: 12 }}>{section.icon}</span>
              <span style={{
                color: section.color, fontSize: 11, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.03em",
              }}>{section.label}</span>
              <span style={{ color: "#3A3935", fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
                · {matched.length} match{matched.length !== 1 ? "es" : ""}
              </span>
              <span style={{ color: "#3A3935", fontSize: 10, marginLeft: "auto" }}>→ view section</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {matched.map((item, i) => (
                <ItemRow
                  key={item.name}
                  item={item}
                  color={section.color}
                  index={i}
                  searchQuery={query}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Controls bar ─────────────────────────────────────────────────────────────

function ControlsBar({ statusFilter, setStatusFilter, sortBy, setSortBy, color, allStatuses }) {
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
      marginBottom: 12,
    }}>
      {/* Status pills */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
        <button
          onClick={() => setStatusFilter(null)}
          style={pillStyle(statusFilter === null, color)}
        >All</button>
        {allStatuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? null : s)}
            style={pillStyle(statusFilter === s, STATUS_COLORS[s] || color)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Sort buttons */}
      <div style={{ display: "flex", gap: 4 }}>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSortBy(opt.id)}
            style={{
              background: sortBy === opt.id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
              border: sortBy === opt.id ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
              color: sortBy === opt.id ? "#F1F0EC" : "#5A5955",
              fontSize: 10, padding: "4px 10px", borderRadius: 6,
              cursor: "pointer", fontFamily: "'DM Mono', monospace",
              transition: "all 0.15s ease",
            }}
          >{opt.label}</button>
        ))}
      </div>
    </div>
  );
}

function pillStyle(active, color) {
  return {
    background: active ? `${color}25` : "rgba(255,255,255,0.02)",
    border: active ? `1px solid ${color}55` : "1px solid rgba(255,255,255,0.06)",
    color: active ? color : "#6B6A67",
    fontSize: 9, padding: "3px 9px", borderRadius: 20,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap",
  };
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function BizDeedzDashboard() {
  const [activeSection, setActiveSection] = useState("topology");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortBy, setSortBy] = useState("progress-desc");

  const isSearching = searchQuery.length >= 2;
  const isOverview = activeSection === "__overview__";

  const active = SECTIONS.find((s) => s.id === activeSection);

  const allStatuses = useMemo(() => {
    if (!active) return [];
    return [...new Set(active.items.map((i) => i.status))].sort();
  }, [active]);

  const filteredItems = useMemo(() => {
    if (!active) return [];
    let items = active.items;
    if (statusFilter) items = items.filter((i) => i.status === statusFilter);
    if (sortBy === "progress-desc") items = [...items].sort((a, b) => b.progress - a.progress);
    else if (sortBy === "progress-asc") items = [...items].sort((a, b) => a.progress - b.progress);
    else if (sortBy === "alpha") items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }, [active, statusFilter, sortBy]);

  const handleSelectSection = (id) => {
    setActiveSection(id);
    setSearchQuery("");
    setStatusFilter(null);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#141413", color: "#F1F0EC",
      fontFamily: "'DM Sans', sans-serif", padding: "28px 24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        input::placeholder { color: #3A3935; }
        button { outline: none; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", background: "#D4A853",
            boxShadow: "0 0 10px #D4A85366",
          }} />
          <span style={{
            color: "#5A5955", fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", fontFamily: "'DM Sans', sans-serif",
          }}>Internal Infrastructure Map</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{
              fontSize: 34, fontWeight: 400, fontFamily: "'Instrument Serif', Georgia, serif",
              margin: "0 0 3px 0", color: "#F1F0EC", lineHeight: 1.15,
            }}>
              BizDeedz <span style={{ color: "#D4A853" }}>Operations</span> Dashboard
            </h1>
            <p style={{
              color: "#5A5955", fontSize: 12, margin: 0, fontFamily: "'DM Sans', sans-serif",
            }}>Systems, delivery infrastructure, IP assets & operational health</p>
          </div>

          {/* Global search */}
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "#4A4945", fontSize: 12, pointerEvents: "none",
            }}>⌕</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all assets…"
              style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "8px 12px 8px 28px", color: "#F1F0EC",
                fontSize: 12, fontFamily: "'DM Sans', sans-serif", width: 220,
                outline: "none", transition: "border 0.15s ease",
              }}
              onFocus={(e) => { e.target.style.border = "1px solid rgba(212,168,83,0.4)"; }}
              onBlur={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#5A5955", cursor: "pointer",
                  fontSize: 14, padding: 0, lineHeight: 1,
                }}
              >×</button>
            )}
          </div>
        </div>
      </div>

      <BeforeAfter />
      <OverallHealth />

      {/* Main Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, alignItems: "start" }}>

        {/* Left Nav */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 6,
          maxHeight: "calc(100vh - 100px)", overflowY: "auto", paddingRight: 4,
        }}>
          {/* Overview tab */}
          <button
            onClick={() => setActiveSection("__overview__")}
            style={{
              background: isOverview
                ? "linear-gradient(135deg, rgba(212,168,83,0.12), rgba(212,168,83,0.04))"
                : "rgba(255,255,255,0.02)",
              border: isOverview ? "1px solid rgba(212,168,83,0.35)" : "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: "11px 16px", cursor: "pointer",
              textAlign: "left", transition: "all 0.2s ease", width: "100%",
              position: "relative", overflow: "hidden",
            }}
          >
            {isOverview && (
              <div style={{
                position: "absolute", top: 0, left: 0, width: 3, height: "100%",
                background: "#D4A853", borderRadius: "3px 0 0 3px",
              }} />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#D4A853", fontSize: 13 }}>◉</span>
              <span style={{
                color: isOverview ? "#F1F0EC" : "#9B9A97", fontSize: 12,
                fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              }}>Overview</span>
              <span style={{
                marginLeft: "auto", color: "#4A4945", fontSize: 9,
                fontFamily: "'DM Mono', monospace",
              }}>all sections</span>
            </div>
          </button>

          {SECTIONS.map((section) => (
            <SectionTab
              key={section.id}
              section={section}
              isActive={activeSection === section.id && !isSearching}
              onClick={() => handleSelectSection(section.id)}
            />
          ))}
        </div>

        {/* Right Detail */}
        <div style={{
          background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14, padding: 20,
        }}>

          {/* Search results mode */}
          {isSearching ? (
            <SearchResultsPanel
              query={searchQuery}
              onSelectSection={handleSelectSection}
            />
          ) : isOverview ? (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
                paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ color: "#D4A853", fontSize: 18 }}>◉</span>
                <div>
                  <h2 style={{
                    margin: 0, fontSize: 20, fontWeight: 400,
                    fontFamily: "'Instrument Serif', Georgia, serif", color: "#F1F0EC",
                  }}>All Sections Overview</h2>
                  <span style={{ color: "#6B6A67", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                    Click any section to drill in
                  </span>
                </div>
              </div>
              <OverviewPanel onSelectSection={handleSelectSection} />
            </>
          ) : active ? (
            <>
              {/* Section Header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
                paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ color: active.color, fontSize: 18 }}>{active.icon}</span>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    margin: 0, fontSize: 20, fontWeight: 400,
                    fontFamily: "'Instrument Serif', Georgia, serif", color: "#F1F0EC",
                  }}>{active.label}</h2>
                  <span style={{ color: "#6B6A67", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                    {active.summary}
                  </span>
                </div>
                <span style={{ color: "#4A4945", fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
                  {active.items.length} items · avg {Math.round(active.items.reduce((s, i) => s + i.progress, 0) / active.items.length)}%
                </span>
              </div>

              {active.flow && <FlowDiagram steps={active.flow} color={active.color} />}

              {active.metrics && (
                <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  {active.metrics.map((m, i) => (
                    <MetricPill key={i} metric={m} color={active.color} />
                  ))}
                </div>
              )}

              {/* Controls */}
              <ControlsBar
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                color={active.color}
                allStatuses={allStatuses}
              />

              {/* Count when filtered */}
              {statusFilter && (
                <div style={{
                  color: "#5A5955", fontSize: 10, fontFamily: "'DM Mono', monospace",
                  marginBottom: 8,
                }}>
                  Showing {filteredItems.length} of {active.items.length} items
                </div>
              )}

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredItems.length === 0 ? (
                  <div style={{ color: "#4A4945", fontSize: 12, fontFamily: "'DM Sans', sans-serif", padding: "20px 0" }}>
                    No items match the selected filter.
                  </div>
                ) : (
                  filteredItems.map((item, i) => (
                    <ItemRow
                      key={item.name}
                      item={item}
                      color={active.color}
                      index={i}
                      searchQuery=""
                    />
                  ))
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 28, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ color: "#3A3935", fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
          BizDeedz · Legal Operations Consulting · AI-Powered Workflow Automation
        </span>
        <span style={{ color: "#3A3935", fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
          Infrastructure v2.0
        </span>
      </div>
    </div>
  );
}
