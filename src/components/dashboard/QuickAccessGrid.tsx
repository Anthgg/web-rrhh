import Link from "next/link";
import {
 CalendarClock,
 FileText,
 FolderOpen,
 Settings,
 UserCircle,
 UsersRound,
 ClipboardCheck,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import type { QuickAccessItem } from "@/types";

const iconMap: Record<string, typeof UsersRound> = {
 workers: UsersRound,
 "attendance-report": ClipboardCheck,
 requests: FileText,
 shifts: CalendarClock,
 documents: FolderOpen,
 profile: UserCircle,
 settings: Settings,
};

export function QuickAccessGrid({ items }: { items: QuickAccessItem[] }) {
 return (
 <DashboardCard className="grid gap-5">
 <div className="grid gap-1">
 <h2 className="section-title text-2xl font-semibold text-foreground">Accesos rapidos</h2>
 <p className="text-sm text-muted-foreground">Navegacion directa a las tareas mas frecuentes.</p>
 </div>

 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 {items.map((item) => {
 const Icon = iconMap[item.id] ?? FileText;
 const isPending = item.state === "pending";

 return (
 <Link
 key={item.id}
 href={item.href}
 className="group grid min-h-[150px] gap-3 rounded-3xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_18px_38px_rgba(15,118,110,0.12)]"
 >
 <div className="flex items-start justify-between gap-3">
 <div className="rounded-2xl bg-muted p-3 text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
 <Icon className="size-5" />
 </div>
 {isPending ? (
 <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
 Pendiente
 </span>
 ) : null}
 </div>
 <div className="grid gap-1">
 <strong className="text-sm font-semibold text-foreground">{item.label}</strong>
 <span className="text-sm leading-5 text-muted-foreground">{item.description}</span>
 </div>
 </Link>
 );
 })}
 </div>
 </DashboardCard>
 );
}
