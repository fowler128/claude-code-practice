"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
    <aside className="w-64 border-r border-slate-800 bg-slate-950/80 p-4">
      <div className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">BizDeedz Mission Control</div>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm",
              pathname === item.href ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
