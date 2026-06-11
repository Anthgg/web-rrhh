"use client";

import { Card } from "@/components/ui/card";
import { Heart, ShieldAlert } from "lucide-react";
import type { UserProfile } from "@/types";

interface EmergencyContactCardProps {
 user: UserProfile;
}

export function EmergencyContactCard({ user }: EmergencyContactCardProps) {
 const name = user.emergencyContactName || "No registrado";
 const relationship = user.emergencyContactRelationship || "No registrado";
 const phone = user.emergencyContactPhone || "No registrado";

 const fields = [
 { label: "Contacto de Emergencia", value: name },
 { label: "Relación / Parentesco", value: relationship },
 { label: "Teléfono de Contacto", value: phone },
 ];

 return (
 <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm grid gap-5">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-2">
 <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
 <Heart className="size-4" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-foreground">Contacto de Emergencia</h2>
 <p className="text-xs text-muted-foreground mt-0.5">En caso de accidente o urgencia laboral.</p>
 </div>
 </div>

 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground border border-border">
 <ShieldAlert className="size-3" />
 Gestionado por RR.HH.
 </span>
 </div>

 <div className="grid gap-4 sm:grid-cols-3">
 {fields.map((f) => (
 <div key={f.label} className="p-3 bg-muted/50 border border-border rounded-xl flex flex-col justify-between">
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
