"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type ConfirmDialogProps = {
 open: boolean;
 title: string;
 description?: string;
 confirmLabel?: string;
 cancelLabel?: string;
 variant?: "default" | "danger";
 isLoading?: boolean;
 onConfirm: () => void | Promise<void>;
 onCancel: () => void;
};

export function ConfirmDialog({
 open,
 title,
 description,
 confirmLabel = "Confirmar",
 cancelLabel = "Cancelar",
 variant = "default",
 isLoading = false,
 onConfirm,
 onCancel,
}: ConfirmDialogProps) {
 if (!open) return null;

 const isDanger = variant === "danger";

 return (
 <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
 <section
 role="alertdialog"
 aria-modal="true"
 aria-labelledby="confirm-dialog-title"
 aria-describedby={description ? "confirm-dialog-description" : undefined}
 className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
 >
 <div className="p-6">
 <div className="flex items-start gap-4">
 <span
 className={cn(
 "flex size-11 shrink-0 items-center justify-center rounded-full",
 isDanger ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700",
 )}
 >
 <AlertTriangle className="size-5" />
 </span>
 <div className="min-w-0">
 <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-950">
 {title}
 </h2>
 {description ? (
 <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-muted-foreground">
 {description}
 </p>
 ) : null}
 </div>
 </div>
 </div>
 <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted px-6 py-4 sm:flex-row sm:justify-end">
 <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
 {cancelLabel}
 </Button>
 <Button
 type="button"
 variant={isDanger ? "danger" : "primary"}
 onClick={onConfirm}
 disabled={isLoading}
 className="gap-2"
 >
 {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
 {confirmLabel}
 </Button>
 </div>
 </section>
 </div>
 );
}
