import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface UserMetricCardProps {
 title: string;
 value: number;
 subtitle: string;
 icon: React.ReactNode;
 className?: string;
}

export function UserMetricCard({ title, value, subtitle, icon, className }: UserMetricCardProps) {
 return (
 <Card className="flex items-start justify-between border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
 <div className="grid gap-1.5 min-w-0">
 <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
 <div className="flex items-baseline gap-1">
 <strong className="text-3xl font-bold text-foreground tracking-tight">{value}</strong>
 </div>
 <p className="text-xs text-muted-foreground font-medium truncate">{subtitle}</p>
 </div>
 
 <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold shadow-sm", className)}>
 {icon}
 </div>
 </Card>
 );
}
