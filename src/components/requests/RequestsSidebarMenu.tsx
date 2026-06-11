"use client";

import Link from "next/link";
import {
 ClipboardList,
 FilePlus2,
 FileSpreadsheet,
 Layers3,
 Library,
 LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { RequestSectionKey, RequestsNavigationItem } from "@/types/requests";

const iconMap: Record<RequestSectionKey, LucideIcon> = {
 "my-requests": ClipboardList,
 "new-request": FilePlus2,
 "pending-requests": Layers3,
 reports: FileSpreadsheet,
 templates: Library,
};

interface RequestsSidebarMenuProps {
 items: RequestsNavigationItem[];
 activeSection: RequestSectionKey;
}

export function RequestsSidebarMenu({
 items,
 activeSection,
}: RequestsSidebarMenuProps) {
 return (
 <aside className="lg:sticky lg:top-24 lg:self-start">
 <div className="grid gap-3 rounded-[2rem] border border-border/70 bg-card/78 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
 <div className="px-3 pt-2">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
 Navegacion interna
 </p>
 <h2 className="mt-1 text-base font-semibold text-foreground">Centro de solicitudes</h2>
 <p className="mt-1 text-xs leading-5 text-foreground-soft">
 Accede rapido a cada vista del modulo sin perder contexto al desplazarte.
 </p>
 </div>
 </div>

 <div className="grid gap-2">
 {items.map((item) => {
 const Icon = iconMap[item.key];
 const active = item.key === activeSection;

 return (
 <Link
 key={item.key}
 href={item.href}
 className={cn(
 "group rounded-[1.75rem] border p-4 transition",
 active
 ? "border-primary/20 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.16),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(240,253,250,0.9))] shadow-[0_22px_44px_rgba(15,118,110,0.16)]"
 : "border-transparent bg-card/70 hover:border-border hover:bg-card",
 )}
 >
 <div className="flex items-start gap-3">
 <div
 className={cn(
 "flex size-11 shrink-0 items-center justify-center rounded-2xl transition",
 active
 ? "bg-primary text-white"
 : "bg-muted text-muted-foreground group-hover:bg-primary-soft group-hover:text-primary",
 )}
 >
 <Icon className="size-5" />
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
 {item.badge ? (
 <span className="inline-flex items-center rounded-full bg-card/80 px-2 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-primary/10">
 {item.badge}
 </span>
 ) : null}
 </div>
 <p className="mt-1 text-xs leading-5 text-foreground-soft">{item.description}</p>
 </div>
 </div>
 </Link>
 );
 })}
 </div>
 </div>
 </aside>
 );
}
