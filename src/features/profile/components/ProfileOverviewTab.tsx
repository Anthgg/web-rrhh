"use client";

import {
 Briefcase, Phone, AlertTriangle, CheckCircle2, Shield, Mail,
 MapPin, UserCheck, Clock, Building2, Users, ChevronRight, Info,
} from "lucide-react";
import type { UserProfile } from "@/types";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { ProfileField } from "./ProfileField";
import { formatRole } from "@/lib/utils/format";

interface ProfileOverviewTabProps {
 user: UserProfile;
}

/** Resolve crew display following the approved crew logic rules */
function resolveCrewDisplay(
 workLocationName: string | null | undefined,
 crewName: string | null | undefined,
): string | null {
 const hasLocation = !!workLocationName;
 const hasCrew = crewName !== null && crewName !== undefined && crewName !== "";

 if (hasCrew) return crewName; // Backend sent crewName → always show it
 if (hasLocation && !hasCrew) return "Sin cuadrilla"; // Has obra but no crew
 return null; // No obra, no crew → "No registrado" via ProfileField fallback
}

export function ProfileOverviewTab({ user }: ProfileOverviewTabProps) {
 // ── Account / security data ────────────────────────────────────────────────
 const roleLabel = formatRole(user.role);
 const isActive = user.status === "active";
 const statusLabel = isActive ? "Activo" : user.status === "inactive" ? "Inactivo" : "No registrado";

 const lastAccess = user.lastLoginAt
 ? new Date(user.lastLoginAt).toLocaleString("es-PE", {
 timeZone: "America/Lima",
 day: "2-digit", month: "short", year: "numeric",
 hour: "2-digit", minute: "2-digit",
 })
 : null; // null → ProfileField renders "—" / "No registrado"

 // Real values from backend — never hardcode a fallback
 const activeSessions = user.security?.active_sessions ?? null;
 const isEmailVerified = user.security?.email_verified ?? null; // three-state: true | false | null

 // ── Labor data ────────────────────────────────────────────────────────────
 const company = user.companyName || user.worker?.company_name || null;
 const department = user.departmentName || user.department || user.worker?.department_name || null;
 const position = user.positionName || user.position || user.worker?.position || null;
 const project = user.workLocationName || user.project || user.worker?.work_location_name || null;
 const supervisor = user.worker?.supervisor_name || null;

 // Crew: apply approved business logic
 const crew = resolveCrewDisplay(
 user.workLocationName || user.worker?.work_location_name,
 user.crewName ?? user.worker?.crew_name,
 );

 // ── Contact data ──────────────────────────────────────────────────────────
 const phone = user.phone || null;
 const personalEmail = user.personalEmail || null;
 const address = user.address || null;

 // ── Pending alerts ────────────────────────────────────────────────────────
 const alerts: { msg: string; priority: "high" | "medium" }[] = [];
 if (user.security?.password_change_required)
 alerts.push({ msg: "Contraseña con cambio obligatorio pendiente.", priority: "high" });
 if (!user.documentNumber)
 alerts.push({ msg: "DNI / Documento de identidad no registrado.", priority: "high" });
 if (!user.emergencyContactName || !user.emergencyContactPhone)
 alerts.push({ msg: "Contacto de emergencia incompleto.", priority: "medium" });
 if (isEmailVerified === false)
 alerts.push({ msg: "Correo corporativo pendiente de verificación.", priority: "medium" });
 if (!phone || !address || !personalEmail)
 alerts.push({ msg: "Datos de contacto incompletos.", priority: "medium" });

 const highCount = alerts.filter((a) => a.priority === "high").length;
 const mediumCount = alerts.filter((a) => a.priority === "medium").length;

 // ── Helpers ────────────────────────────────────────────────────────────────
 const emailVerifiedLabel =
 isEmailVerified === true
 ? "Verificado"
 : isEmailVerified === false
 ? "Pendiente de verificación"
 : null; // null → "No registrado"

 const emailVerifiedHighlight =
 isEmailVerified === true ? "success" : isEmailVerified === false ? "warning" : undefined;

 const activeSessionsLabel =
 activeSessions !== null
 ? `${activeSessions} ${activeSessions === 1 ? "sesión activa" : "sesiones activas"}`
 : null;

 return (
 /* Asymmetric 12-col grid: left 7 cols for account+contact, right 5 for labor+tasks */
 <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

 {/* ── Left column ── */}
 <div className="xl:col-span-7 flex flex-col gap-5">

 {/* Account / Security card */}
 <ProfileSectionCard
 title="Ficha de Cuenta"
 description="Credenciales, estado y sesión activa."
 icon={<Shield className="size-4" />}
 iconColor="indigo"
 >
 {/* Status banner */}
 <div className={[
 "flex items-center gap-3 px-4 py-2.5 rounded-xl border mb-1",
 isActive
 ? "bg-emerald-500/10 border-emerald-500/20"
 : "bg-destructive/10 border-destructive/20",
 ].join(" ")}>
 <div className={`size-2.5 rounded-full shrink-0 ${isActive ? "bg-emerald-500" : "bg-destructive"}`} />
 <span className={`text-sm font-semibold ${isActive ? "text-emerald-600 dark:text-emerald-500" : "text-destructive"}`}>
 Cuenta {statusLabel}
 </span>
 {activeSessions !== null && (
 <span className={`ml-auto text-xs font-medium ${isActive ? "text-emerald-600/80 dark:text-emerald-500/80" : "text-destructive/80"}`}>
 {activeSessionsLabel}
 </span>
 )}
 </div>

 <ProfileField
 label="Rol del sistema"
 value={roleLabel}
 icon={<UserCheck className="size-3.5" />}
 highlight="success"
 />
 <ProfileField
 label="Correo corporativo"
 value={user.email}
 icon={<Mail className="size-3.5" />}
 />
 <ProfileField
 label="Verificación de correo"
 value={emailVerifiedLabel}
 icon={<CheckCircle2 className="size-3.5" />}
 highlight={emailVerifiedHighlight}
 />
 <ProfileField
 label="Sesiones activas"
 value={activeSessionsLabel}
 icon={<Clock className="size-3.5" />}
 />
 <ProfileField
 label="Último acceso"
 value={lastAccess}
 icon={<Clock className="size-3.5" />}
 />
 </ProfileSectionCard>

 {/* Contact card */}
 <ProfileSectionCard
 title="Contacto y Domicilio"
 description="Información de comunicación declarada."
 icon={<Phone className="size-4" />}
 iconColor="slate"
 >
 <ProfileField label="Teléfono celular" value={phone} icon={<Phone className="size-3.5" />} />
 <ProfileField label="Correo personal" value={personalEmail} icon={<Mail className="size-3.5" />} />
 <ProfileField label="Dirección de domicilio" value={address} icon={<MapPin className="size-3.5" />} fullWidth />
 {(() => {
 const locationParts = [
 user.departmentGeo,
 user.province,
 user.district,
 ].filter(Boolean);
 const locationLabel = locationParts.length ? locationParts.join(" / ") : null;
 return locationLabel ? (
 <ProfileField label="Ubicación" value={locationLabel} icon={<MapPin className="size-3.5" />} fullWidth />
 ) : null;
 })()}
 </ProfileSectionCard>
 </div>

 {/* ── Right column ── */}
 <div className="xl:col-span-5 flex flex-col gap-5">

 {/* Labor summary card */}
 <ProfileSectionCard
 title="Ficha Laboral"
 description="Asignación operativa actual."
 icon={<Briefcase className="size-4" />}
 iconColor="violet"
 badge={
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground border border-border whitespace-nowrap">
 <Info className="size-3" />
 Gestionado por RR.HH.
 </span>
 }
 >
 <ProfileField label="Cargo principal" value={position} icon={<Briefcase className="size-3.5" />} />
 <ProfileField label="Empresa" value={company} icon={<Building2 className="size-3.5" />} />
 <ProfileField label="Área / Departamento" value={department} icon={<Briefcase className="size-3.5" />} />
 <ProfileField label="Obra o proyecto" value={project} icon={<MapPin className="size-3.5" />} />
 <ProfileField label="Cuadrilla asignada" value={crew} icon={<Users className="size-3.5" />} />
 <ProfileField label="Supervisor a cargo" value={supervisor} icon={<UserCheck className="size-3.5" />} />
 </ProfileSectionCard>

 {/* Alerts / tasks card */}
 <ProfileSectionCard
 title="Pendientes del Perfil"
 description={
 alerts.length > 0
 ? `${alerts.length} ${alerts.length === 1 ? "tarea pendiente" : "tareas pendientes"}`
 : "Sin tareas pendientes"
 }
 icon={<AlertTriangle className="size-4" />}
 iconColor={highCount > 0 ? "amber" : alerts.length > 0 ? "amber" : "emerald"}
 noPadding
 >
 {alerts.length === 0 ? (
 <div className="flex flex-col items-center justify-center gap-3 py-8 px-5">
 <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
 <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-500" />
 </div>
 <div className="text-center">
 <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500">Todo al día</p>
 <p className="text-xs text-muted-foreground mt-0.5">Tu información está completa y actualizada.</p>
 </div>
 </div>
 ) : (
 <div className="divide-y divide-border/50">
 {/* Summary strip */}
 <div className="flex items-center gap-4 px-5 py-3 bg-amber-500/10">
 {highCount > 0 && (
 <div className="flex items-center gap-1.5">
 <div className="size-2 rounded-full bg-destructive" />
 <span className="text-xs font-semibold text-destructive">{highCount} crítico{highCount !== 1 ? "s" : ""}</span>
 </div>
 )}
 {mediumCount > 0 && (
 <div className="flex items-center gap-1.5">
 <div className="size-2 rounded-full bg-amber-500" />
 <span className="text-xs font-semibold text-amber-600 dark:text-amber-500">{mediumCount} medio{mediumCount !== 1 ? "s" : ""}</span>
 </div>
 )}
 </div>

 {/* Alert rows */}
 {alerts.map((alert, idx) => (
 <div
 key={idx}
 className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors"
 >
 <div className={`size-1.5 rounded-full shrink-0 mt-2 ${alert.priority === "high" ? "bg-destructive" : "bg-amber-500"}`} />
 <span className="text-xs text-foreground/80 leading-relaxed flex-1">{alert.msg}</span>
 <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
 </div>
 ))}
 </div>
 )}
 </ProfileSectionCard>
 </div>
 </div>
 );
}
