"use client";

import { AlertTriangle, LoaderCircle, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";

interface UnsavedChangesBannerProps {
 isSaving?: boolean;
 onRestore: () => void;
 onSave: () => void;
 visible: boolean;
}

export function UnsavedChangesBanner({
 isSaving = false,
 onRestore,
 onSave,
 visible,
}: UnsavedChangesBannerProps) {
 if (!visible) {
 return null;
 }

 return (
 <div className="flex flex-col gap-4 rounded-[1.75rem] border border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(255,247,237,0.92))] p-4 shadow-[0_18px_40px_rgba(245,158,11,0.12)] animate-[dashboard-rise_200ms_ease-out] md:flex-row md:items-center md:justify-between">
 <div className="flex items-start gap-3">
 <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
 <AlertTriangle className="size-5" />
 </div>
 <div className="grid gap-1">
 <p className="text-sm font-semibold text-foreground">Tienes cambios sin guardar</p>
 <p className="text-sm text-foreground-soft">
 Guarda o restaura el formulario antes de salir para no perder la identidad corporativa en edicion.
 </p>
 </div>
 </div>

 <div className="flex flex-wrap gap-3">
 <Button variant="secondary" onClick={onRestore}>
 <RotateCcw className="mr-2 size-4" />
 Restaurar
 </Button>
 <Button onClick={onSave} disabled={isSaving}>
 {isSaving ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
 Guardar cambios
 </Button>
 </div>
 </div>
 );
}

