"use client";

import { Card } from "@/components/ui/card";
import { User, ShieldAlert } from "lucide-react";
import type { UserProfile } from "@/types";

interface PersonalDataCardProps {
 user: UserProfile;
}

export function PersonalDataCard({ user }: PersonalDataCardProps) {
 const dni = user.documentNumber || "No registrado";
 const birthDate = user.birthDate || "No registrado";
 const gender = user.gender || "No registrado";
 const civilStatus = user.civilStatus || "No registrado";
 const nationality = user.nationality || "No registrado";
 const address = user.address || "No registrado";

 const fields = [
 { label: "Documento de Identidad (DNI)", value: dni },
 { label: "Fecha de Nacimiento", value: birthDate },
 { label: "Género", value: gender },
 { label: "Estado Civil", value: civilStatus },
 { label: "Nacionalidad", value: nationality },
 { label: "Dirección de Domicilio", value: address },
 ];

 return (
 <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm grid gap-5">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-2">
 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
 <User className="size-4" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-foreground">Datos Personales</h2>
 <p className="text-xs text-muted-foreground mt-0.5">Información básica oficial registrada en la empresa.</p>
 </div>
 </div>
 
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground border border-border">
 <ShieldAlert className="size-3" />
 Gestionado por RR.HH.
 </span>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 {fields.map((f) => (
 <div key={f.label} className="p-3 bg-muted/50 border border-border rounded-xl flex flex-col">
 <span className="text-xs text-muted-foreground uppercase tracking-[0.08em] font-bold">
 {f.label}
 </span>
 <span className="text-sm font-semibold text-foreground mt-1">
 {f.value}
 </span>
 </div>
 ))}
 </div>
 </Card>
 );
}
