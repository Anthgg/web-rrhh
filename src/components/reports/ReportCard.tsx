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
 <Card className="grid gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
 <div className="flex items-start gap-4">
  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
  <Icon className="size-5" />
  </div>
  <div className="grid gap-1">
  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
  <p className="text-sm leading-6 text-muted-foreground ">{description}</p>
  </div>
 </div>

 <div className="grid gap-4">{children}</div>

 <Button
 onClick={onDownload}
 disabled={isLoading}
  className="h-11 rounded-xl bg-primary text-primary-foreground shadow transition-all hover:scale-[1.01] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
