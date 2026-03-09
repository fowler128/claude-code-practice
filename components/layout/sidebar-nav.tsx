"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/deals", label: "Deals" },
  { href: "/clients", label: "Clients" },
  { href: "/engagements", label: "Engagements" },
  { href: "/tasks", label: "Tasks" },
  { href: "/finance", label: "Finance" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/settings", label: "Settings" }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-line bg-panel/70 p-4">
      <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-muted">Mission Control</div>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              className={`block rounded-md border px-3 py-2 text-sm ${active ? "border-line bg-background text-text" : "border-transparent text-muted hover:border-line hover:text-text"}`}
              key={item.href}
              href={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
