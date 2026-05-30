import {
  AlertTriangle,
  BadgeCheck,
  Clock3,
  FolderClock,
  ShieldAlert,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { ReportSummaryResponse } from "@/types/report.types";

const cardConfig = [
  {
    key: "totalRequests",
    label: "Total de solicitudes",
    accent: "from-sky-500/20 to-cyan-500/10 text-sky-100",
    icon: FolderClock,
  },
  {
    key: "approved",
    label: "Aprobadas",
    accent: "from-emerald-500/20 to-green-500/10 text-emerald-100",
    icon: BadgeCheck,
  },
  {
    key: "pending",
    label: "Pendientes",
    accent: "from-amber-500/20 to-orange-500/10 text-amber-100",
    icon: Clock3,
  },
  {
    key: "rejected",
    label: "Rechazadas",
    accent: "from-rose-500/20 to-red-500/10 text-rose-100",
    icon: AlertTriangle,
  },
  {
    key: "observed",
    label: "Observadas",
    accent: "from-violet-500/20 to-fuchsia-500/10 text-violet-100",
    icon: ShieldAlert,
  },
  {
    key: "mostRequestedType",
    label: "Tipo mas solicitado",
    accent: "from-indigo-500/20 to-sky-500/10 text-indigo-100",
    icon: Sparkles,
  },
  {
    key: "workerWithMostRequests",
    label: "Colaborador con mas solicitudes",
    accent: "from-pink-500/20 to-fuchsia-500/10 text-pink-100",
    icon: UserRound,
  },
] as const;

export function ReportSummaryCards({
  summary,
  isLoading = false,
}: {
  summary?: ReportSummaryResponse["data"];
  isLoading?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cardConfig.map((item) => {
        const Icon = item.icon;
        const value = summary?.[item.key] ?? (typeof summary?.[item.key] === "number" ? 0 : "-");

        return (
          <Card
            key={item.key}
            className={cn(
              "overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.8))] p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]",
              isLoading && "animate-pulse",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {item.label}
                </span>
                <strong className="text-2xl font-semibold tracking-tight">
                  {isLoading ? "..." : String(value || "-")}
                </strong>
              </div>

              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br",
                  item.accent,
                )}
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
