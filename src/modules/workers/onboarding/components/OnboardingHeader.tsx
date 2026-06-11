"use client";

import { ArrowLeft, FileSignature, UserCheck, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface OnboardingHeaderProps {
 contractMode: boolean;
 completionMode: boolean;
 hasWorkerId: boolean;
 isProfileComplete: boolean;
}

export function OnboardingHeader({
 contractMode,
 completionMode,
 hasWorkerId,
 isProfileComplete,
}: OnboardingHeaderProps) {
 const router = useRouter();
 const icon = contractMode ? <FileSignature className="size-5" /> : completionMode ? <UserCheck className="size-5" /> : <UserPlus className="size-5" />;
 const title = contractMode ? "Generar contrato inicial" : completionMode ? "Completar perfil laboral" : "Alta de colaborador";
 const subtitle = contractMode
 ? "Revisa los datos cargados y completa las condiciones contractuales."
 : completionMode
 ? isProfileComplete
 ? "El perfil laboral ya cuenta con los datos requeridos."
 : "Completa los campos pendientes del trabajador existente."
 : "Registra la informacion personal, laboral, contractual y de acceso.";

 return (
 <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-start gap-3">
 <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
 {icon}
 </span>
 <div>
 <h1 className="text-xl font-bold text-slate-950">{title}</h1>
 <p className="mt-1 text-sm leading-6 text-muted-foreground">{subtitle}</p>
 {hasWorkerId ? <p className="mt-1 text-xs font-semibold text-indigo-600">Ficha laboral vinculada</p> : null}
 </div>
 </div>
 <Button type="button" variant="secondary" className="gap-2" onClick={() => router.back()}>
 <ArrowLeft className="size-4" />
 Volver
 </Button>
 </header>
 );
}
