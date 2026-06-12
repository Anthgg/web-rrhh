"use client";

import { useRef } from "react";
import { Camera, Edit3, Briefcase, MapPin, Building2, UserCheck, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRole } from "@/lib/utils/format";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { UserProfile } from "@/types";

interface ProfileHeaderCardProps {
 user: UserProfile;
 onEditProfile?: () => void;
 onUploadPhoto?: (file: File) => void;
 isUploading?: boolean;
}

export function ProfileHeaderCard({ user, onEditProfile, onUploadPhoto, isUploading }: ProfileHeaderCardProps) {
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleTriggerUpload = () => {
 if (isUploading) return;
 fileInputRef.current?.click();
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file && onUploadPhoto) {
 onUploadPhoto(file);
 }
 if (fileInputRef.current) {
 fileInputRef.current.value = "";
 }
 };
 const fullName = user.fullName || "Usuario";
 const email = user.email || "No registrado";
 const role = user.role || "unknown";
 const position = user.positionName || user.position || user.worker?.position || "No registrado";
 const company = user.companyName || user.worker?.company_name || "No registrado";
 const project = user.workLocationName || user.project || user.worker?.work_location_name || "No registrado";
 const department = user.departmentName || user.worker?.department_name || "No registrado";
 const crew = user.crewName || user.worker?.crew_name || null;

 // Profile completeness
 const checks = [
 !!user.documentNumber,
 !!user.phone,
 !!user.address,
 !!user.emergencyContactName,
 !user.security?.password_change_required,
 !!(user.security?.email_verified),
 ];
 const completed = checks.filter(Boolean).length;
 const total = checks.length;
 const pct = Math.round((completed / total) * 100);
 const isComplete = pct === 100;



 return (
 <div className="w-full rounded-2xl overflow-hidden shadow-md">
 {/* ── Main hero band ── */}
 <div className="relative bg-gradient-to-br from-primary/90 via-primary to-primary/80 px-6 lg:px-8 py-6">
 {/* Decorative blobs */}
 <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-primary-foreground/5 blur-2xl" />
 <div className="pointer-events-none absolute bottom-0 left-1/3 size-32 rounded-full bg-primary-foreground/10 blur-xl" />

 <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
 {/* ── Column 1: Avatar + identity ── */}
 <div className="flex flex-row items-center gap-5 lg:min-w-[260px]">
 {/* Avatar */}
 <div className="relative group shrink-0">
 <UserAvatar
  src={user.profilePhotoUrl || user.avatarUrl}
  fullName={user.fullName || user.email}
  email={user.email}
  size="hero"
  rounded="2xl"
  showStatusDot
  status={user.status}
  className="border-2 border-primary-foreground/25 shadow-xl ring-4 ring-primary-foreground/10"
  />
 {isUploading && (
 <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center z-10">
 <div className="size-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
 </div>
 )}
 {!isUploading && onUploadPhoto && (
 <button
 type="button"
 aria-label="Subir foto de perfil"
 onClick={handleTriggerUpload}
 className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
 >
 <Camera className="size-5 text-white" />
 </button>
 )}
 </div>

 {/* Name + role */}
 <div className="flex flex-col gap-1.5 min-w-0">
 <h1 className="text-xl lg:text-2xl font-bold text-primary-foreground leading-tight truncate">
 {fullName}
 </h1>
 <p className="text-primary-foreground/80 text-sm truncate">{email}</p>
 <div className="flex flex-wrap gap-1.5 mt-0.5">
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/20">
 <UserCheck className="size-3" />
 {formatRole(role)}
 </span>
 <StatusBadge status={user.status || "active"} />
 </div>
 </div>
 </div>

 {/* ── Column 2: Labor data ── */}
 <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 py-1 border-t border-primary-foreground/10 lg:border-t-0 lg:border-l lg:border-primary-foreground/10 lg:pl-8 pt-4 lg:pt-0">
 <MetaItem icon={<Briefcase className="size-3.5" />} label="Cargo" value={position} />
 <MetaItem icon={<Building2 className="size-3.5" />} label="Empresa" value={company} />
 <MetaItem icon={<MapPin className="size-3.5" />} label="Obra" value={project} />
 <MetaItem icon={<Briefcase className="size-3.5" />} label="Área" value={department} />
 {crew && <MetaItem icon={<UserCheck className="size-3.5" />} label="Cuadrilla" value={crew} />}
 </div>

 {/* ── Column 3: Completeness + actions ── */}
 <div className="flex flex-col gap-3 lg:min-w-[180px] lg:items-end border-t border-primary-foreground/10 lg:border-t-0 lg:border-l lg:border-primary-foreground/10 lg:pl-8 pt-4 lg:pt-0">
 {/* Completeness ring */}
 <div className="flex items-center gap-3">
 <div className="relative size-14 shrink-0">
 <svg className="size-full -rotate-90" viewBox="0 0 36 36">
 <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
 <circle
 cx="18" cy="18" r="14"
 fill="none"
 stroke={isComplete ? "#34d399" : "#cbd5e1"}
 strokeWidth="3"
 strokeDasharray={`${pct * 0.88} 88`}
 strokeLinecap="round"
 />
 </svg>
 <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary-foreground">
 {pct}%
 </span>
 </div>
 <div>
 <p className="text-primary-foreground font-semibold text-sm leading-tight">
 {isComplete ? "Perfil completo" : "Perfil incompleto"}
 </p>
 <p className="text-primary-foreground/80 text-xs mt-0.5">
 {completed}/{total} campos
 </p>
 </div>
 </div>

 {/* Actions */}
 <div className="flex flex-row lg:flex-col gap-2 mt-1 w-full lg:w-auto">
 {onUploadPhoto && (
 <input
 ref={fileInputRef}
 type="file"
 accept="image/*"
 aria-label="Seleccionar foto de perfil"
 onChange={handleFileChange}
 className="hidden"
 />
 )}
 <Button
 type="button"
 variant="secondary"
 disabled={isUploading}
 onClick={handleTriggerUpload}
 className="flex-1 lg:flex-initial h-8 px-3 gap-1.5 rounded-xl text-xs bg-primary-foreground/10 hover:bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/20 font-medium"
 >
 {isUploading ? (
 <div className="size-3.5 border border-primary-foreground border-t-transparent rounded-full animate-spin" />
 ) : (
 <Camera className="size-3.5" />
 )}
 Foto
 </Button>
 {onEditProfile && (
 <Button
 type="button"
 onClick={onEditProfile}
 className="flex-1 lg:flex-initial h-8 px-3 gap-1.5 rounded-xl text-xs bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold shadow-sm"
 >
 <Edit3 className="size-3.5" />
 Editar
 </Button>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* ── Status strip ── */}
 <div className="flex flex-wrap items-center gap-3 px-6 lg:px-8 py-2.5 bg-primary border-t border-primary-foreground/10 backdrop-blur-sm">
 {isComplete ? (
 <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
 <CheckCircle2 className="size-3.5" />
 Perfil 100% completo — sin pendientes
 </div>
 ) : (
 <>
 <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
 <AlertTriangle className="size-3.5" />
 {total - completed} {total - completed === 1 ? "campo pendiente" : "campos pendientes"}
 </div>
 {onEditProfile && (
 <button
 type="button"
 onClick={onEditProfile}
 className="ml-auto flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-medium transition-colors"
 >
 Completar perfil
 <ArrowRight className="size-3" />
 </button>
 )}
 </>
 )}
 </div>
 </div>
 );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
 const isFallback = !value || value === "No registrado";
 return (
 <div className="flex flex-col gap-0.5 min-w-0">
 <span className="flex items-center gap-1 text-[10px] font-semibold text-primary-foreground/70 uppercase tracking-wider">
 {icon}{label}
 </span>
 <span className={`text-sm font-semibold truncate ${isFallback ? "text-primary-foreground/50 italic" : "text-primary-foreground"}`}>
 {isFallback ? "—" : value}
 </span>
 </div>
 );
}
