"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Card } from "@/components/ui/card";
import { REPORT_TABS } from "@/features/reports/report-config";
import { cn } from "@/lib/utils/cn";

export function ReportsTabs() {
  const pathname = usePathname();

  return (
    <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.72))] p-2 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
      <div className="grid gap-2 md:grid-cols-3">
        {REPORT_TABS.map((tab) => {
          const active = pathname === tab.href;

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "rounded-[1.5rem] border px-4 py-3 transition",
                active
                  ? "border-white/20 bg-white/10 text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)]"
                  : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white",
              )}
            >
              <div className="grid gap-1">
                <span className="text-sm font-semibold">{tab.label}</span>
                <span className="text-xs leading-5 text-slate-300/80">{tab.description}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
