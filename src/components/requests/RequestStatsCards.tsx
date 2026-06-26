import {
 Ban,
 CheckCircle2,
 Clock3,
 Eye,
 Inbox,
 XCircle,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type { RequestStats } from "@/types/requests";

const cardConfig = [
  {
    key: "total",
    label: "Total de solicitudes",
    icon: Inbox,
    iconClassName: "bg-muted text-foreground",
  },
  {
    key: "pending",
    label: "Pendientes",
    icon: Clock3,
    iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "approved",
    label: "Aprobadas",
    icon: CheckCircle2,
    iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "rejected",
    label: "Rechazadas",
    icon: XCircle,
    iconClassName: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    key: "observed",
    label: "Observadas",
    icon: Eye,
    iconClassName: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    key: "cancelled",
    label: "Canceladas",
    icon: Ban,
    iconClassName: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
] as const;

interface RequestStatsCardsProps {
  stats: RequestStats;
  isLoading?: boolean;
}

export function RequestStatsCards({ stats, isLoading = false }: RequestStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cardConfig.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.key} className="relative overflow-hidden p-5">
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.06] to-transparent dark:from-white/[0.02] pointer-events-none" />
            <div className="relative flex items-start justify-between gap-4">
 <div className="grid gap-2">
 <span className="text-sm text-foreground-soft">{card.label}</span>
 {isLoading ? (
 <div className="h-9 w-20 animate-pulse rounded-xl bg-muted" />
 ) : (
 <strong className="section-title text-3xl font-semibold text-foreground">
 {stats[card.key]}
 </strong>
 )}
 </div>

 <div
 className={`flex size-12 items-center justify-center rounded-2xl ${card.iconClassName}`}
 >
 <Icon className="size-5" />
 </div>
 </div>
 </Card>
 );
 })}
 </div>
 );
}
