"use client";

import { History, Clock, User } from "lucide-react";
import type { UserProfile } from "@/types";
import { ProfileSectionCard } from "./ProfileSectionCard";

interface ProfileActivityTabProps {
 user: UserProfile;
}

export function ProfileActivityTab({ user }: ProfileActivityTabProps) {
 // activity comes from normalizeCurrentUserProfile which maps to the shape
 // with either createdAt (new normalizer) or created_at (legacy normalizer)
 const activityLogs = user.activity ?? [];

 return (
 <div className="grid grid-cols-1 gap-6 w-full">
 <ProfileSectionCard
 title="Historial de Actividad"
 description="Últimas operaciones y accesos registrados en tu cuenta."
 icon={<History className="size-5" />}
 >
 {activityLogs.length > 0 ? (
 <div className="relative border-l border-border pl-5 ml-2 grid gap-6 py-2">
 {activityLogs.map((log, idx) => {
 // Support both camelCase (new normalizer) and snake_case (legacy)
 const rawDate = (log as any).createdAt ?? log.created_at ?? null;
 const dateStr = rawDate
 ? new Date(rawDate).toLocaleString("es-PE", { timeZone: "America/Lima" })
 : "Fecha no registrada";

 const actorName = (log as any).actorName ?? log.actor_name ?? null;

 return (
 <div key={log.id ?? idx} className="relative text-xs sm:text-sm">
 {/* Timeline dot */}
 <div className="absolute -left-[25px] top-1 size-2 rounded-full bg-primary ring-4 ring-card" />
 <div className="flex flex-col gap-1">
 <span className="font-bold text-foreground">
 {log.actionLabel ?? log.action ?? "Evento"}
 </span>
 {log.description && (
 <span className="text-muted-foreground text-xs">{log.description}</span>
 )}
 <span className="text-[10px] text-muted-foreground/80 mt-1 flex items-center gap-2 flex-wrap">
 <span className="flex items-center gap-1">
 <Clock className="size-3" />
 {dateStr}
 </span>
 {actorName && (
 <span className="flex items-center gap-1">
 <User className="size-3" />
 {actorName}
 </span>
 )}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center p-10 bg-muted border border-border rounded-xl text-center gap-3">
 <Clock className="size-8 text-muted-foreground/50" />
 <p className="text-sm font-semibold text-muted-foreground">No hay actividad registrada.</p>
 <p className="text-xs text-muted-foreground/80">
 Las acciones en tu cuenta aparecerán aquí cuando el servicio las registre.
 </p>
 </div>
 )}
 </ProfileSectionCard>
 </div>
 );
}
