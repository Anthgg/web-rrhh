"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface RequestModalShellProps {
 isOpen: boolean;
 title: string;
 subtitle?: string;
 onClose: () => void;
 children: React.ReactNode;
 size?: "md" | "lg" | "xl";
 position?: "center" | "right";
 footer?: React.ReactNode;
}

const sizeMap = {
 md: "max-w-2xl",
 lg: "max-w-4xl",
 xl: "max-w-6xl",
};

export function RequestModalShell({
 isOpen,
 title,
 subtitle,
 onClose,
 children,
 size = "lg",
 position = "center",
 footer,
}: RequestModalShellProps) {
 // Ref estable para onClose — evita re-suscribir en cada render del padre
 const onCloseRef = useRef(onClose);
 useEffect(() => {
 onCloseRef.current = onClose;
 });

 useEffect(() => {
 if (!isOpen) return;

 const previousOverflow = document.body.style.overflow;
 document.body.style.overflow = "hidden";

 const handleEscape = (event: KeyboardEvent) => {
 if (event.key === "Escape") {
 onCloseRef.current();
 }
 };

 window.addEventListener("keydown", handleEscape);

 return () => {
 document.body.style.overflow = previousOverflow;
 window.removeEventListener("keydown", handleEscape);
 };
 }, [isOpen]);

 if (!isOpen) return null;

 return (
 <div
 className={cn(
 "fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm",
 position === "right" ? "flex justify-end" : "flex items-center justify-center px-4 py-6",
 )}
 >
 <button type="button" className="absolute inset-0" aria-label="Cerrar modal" onClick={onClose} />

 <section
 role="dialog"
 aria-modal="true"
 aria-label={title}
 className={cn(
 "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] shadow-[0_36px_120px_rgba(15,23,42,0.28)]",
 position === "right"
 ? "h-full max-h-none max-w-3xl rounded-none rounded-l-[2rem]"
 : `rounded-[2rem] ${sizeMap[size]}`,
 )}
 >
 <div className="flex items-start justify-between gap-4 border-b border-border/70 px-6 py-5">
 <div className="grid gap-1">
 <h2 className="section-title text-2xl font-semibold text-foreground">{title}</h2>
 {subtitle ? <p className="text-sm text-foreground-soft">{subtitle}</p> : null}
 </div>

 <Button
 variant="ghost"
 onClick={onClose}
 className="size-10 rounded-2xl px-0 text-foreground-soft hover:bg-muted"
 aria-label="Cerrar"
 >
 <X className="size-5" />
 </Button>
 </div>

 <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

 {footer ? <div className="border-t border-border/70 px-6 py-4">{footer}</div> : null}
 </section>
 </div>
 );
}
