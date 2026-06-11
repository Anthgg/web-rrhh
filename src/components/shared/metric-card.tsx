import type { DashboardMetric } from "@/types";

import { Card } from "@/components/ui/card";

const accentMap = {
 teal: "from-brand/20 to-brand-soft",
 slate: "from-slate-200 to-white",
 amber: "from-amber-100 to-white",
};

export function MetricCard({ metric }: { metric: DashboardMetric }) {
 return (
 <Card className="relative overflow-hidden">
 <div
 className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-br ${accentMap[metric.accent]} opacity-80`}
 />
 <div className="relative grid gap-3">
 <div className="grid gap-1">
 <span className="text-sm text-foreground-soft">{metric.label}</span>
 <strong className="section-title text-3xl font-semibold text-foreground">{metric.value}</strong>
 </div>
 <span className="text-xs font-medium uppercase tracking-[0.14em] text-foreground-soft">
 {metric.trend}
 </span>
 </div>
 </Card>
 );
}
