"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ReportCard({
 icon: Icon,
 title,
 description,
 children,
 onDownload,
 isLoading = false,
}: {
 icon: LucideIcon;
 title: string;
 description: string;
 children: React.ReactNode;
 onDownload: () => void;
 isLoading?: boolean;
}) {
 return (
 <Card className="grid gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-border dark:bg-foreground">
 <div className="flex items-start gap-4">
 <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
 <Icon className="size-5" />
 </div>
 <div className="grid gap-1">
 <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
 <p className="text-sm leading-6 text-muted-foreground ">{description}</p>
 </div>
 </div>

 <div className="grid gap-4">{children}</div>

 <Button
 onClick={onDownload}
 disabled={isLoading}
 className="h-11 rounded-xl bg-blue-900 text-white shadow transition-all hover:scale-[1.01] hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {isLoading ? (
 <>
 <Loader2 className="mr-2 size-4 animate-spin" />
 Generando PDF corporativo...
 </>
 ) : (
 "Descargar PDF"
 )}
 </Button>
 </Card>
 );
}
