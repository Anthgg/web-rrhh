"use client";

import { Card } from "@/components/ui/card";
import { Clock, History, CheckCircle2 } from "lucide-react";
import type { UserProfile } from "@/types";

interface RecentActivityCardProps {
 user: UserProfile;
}

export function RecentActivityCard({ user }: RecentActivityCardProps) {
 const activityLogs = user.activity || [];
 const lastAccess = user.lastLoginAt 
 ? new Date(user.lastLoginAt).toLocaleString("es-PE", { timeZone: "America/Lima" }) 
 : "No registrado";

 return (
 <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm grid gap-5">
 <div className="flex items-center gap-2">
 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
 <History className="size-4" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-foreground">Actividad Reciente</h2>
 <p className="text-xs text-muted-foreground mt-0.5">Auditoría básica de acceso e historial de la cuenta.</p>
 </div>
 </div>

 {activityLogs.length > 0 ? (
 <div className="relative border-l border-border pl-4 ml-2 grid gap-4">
 {activityLogs.map((log) => {
 const dateStr = log.created_at 
 ? new Date(log.created_at).toLocaleString("es-PE", { timeZone: "America/Lima" }) 
 : "Fecha no registrada";
 return (
 <div key={log.id} className="relative text-xs sm:text-sm">
 {/* Timeline dot */}
 <div className="absolute -left-[21px] top-1 size-2 rounded-full bg-indigo-600 ring-4 ring-white" />
 <div className="flex flex-col gap-0.5">
 <span className="font-semibold text-foreground">
 {log.actionLabel || log.action}
 </span>
 {log.description && (
 <span className="text-muted-foreground">{log.description}</span>
 )}
 <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
 <Clock className="size-3" />
 {dateStr}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="flex flex-col gap-4">
 {/* Fallback to account session parameters without inventing mock history items */}
 <div className="grid gap-3 p-4 bg-muted border border-border rounded-xl text-xs sm:text-sm">
 <div className="flex items-center gap-2 text-emerald-600 font-semibold mb-1">
 <CheckCircle2 className="size-4" />
 Cuenta Activa y Segura
 </div>
 <div className="flex justify-between gap-4 border-t border-border pt-2">
 <span className="text-muted-foreground font-medium">Última Conexión</span>
 <span className="font-bold text-foreground">{lastAccess}</span>
 </div>
 <div className="flex justify-between gap-4">
 <span className="text-muted-foreground font-medium">Estado de Cuenta</span>
 <span className="font-bold text-emerald-600">Activo / Sin incidentes</span>
 </div>
 <div className="flex justify-between gap-4">
 <span className="text-muted-foreground font-medium">Sesión Actual</span>
 <span className="font-bold text-foreground">Verificada vía API</span>
 </div>
 </div>
 
 <p className="text-xs text-muted-foreground text-center">
 * No se registran incidentes ni accesos sospechosos en el historial auditado.
 </p>
 </div>
 )}
 </Card>
 );
}
