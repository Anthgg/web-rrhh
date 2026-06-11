"use client";

import { useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
 Activity,
 AlertTriangle,
 ArrowLeft,
 BriefcaseBusiness,
 Building2,
 CalendarDays,
 CheckCircle2,
 Clipboard,
 Download,
 Eye,
 FileSpreadsheet,
 FileText,
 Key,
 Lock,
 Mail,
 Save,
 ShieldCheck,
 UserCog,
 UserRound,
 UsersRound,
 X,
} from "lucide-react";
import { toast } from "sonner";
import { formatPermissionLabel, ACCESS_LEVEL_LABELS } from "@/lib/ui/permission-labels";
import { formatActivityAction, formatActivityDescription } from "@/lib/ui/activity-labels";

import { ErrorState } from "@/components/shared/states";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { rolesService } from "@/services/roles.service";
import { usersService } from "@/services/users.service";
import type { RoleDefinition, TemporaryPasswordResetResult, UserProfile, UserUpdatePayload, WorkerGeneratedDocument } from "@/types";

import { LinkWorkerModal } from "./components/LinkWorkerModal";
import {
 buildTemporaryCredentialsFileName,
 downloadTemporaryCredentialsPdf,
 temporaryCredentialsPdfBase64,
} from "./temporary-credentials-pdf";

type DetailTab = "summary" | "labor" | "permissions" | "security" | "activity" | "reports";

const tabs: Array<{ id: DetailTab; label: string }> = [
 { id: "summary", label: "Resumen" },
 { id: "labor", label: "Ficha laboral" },
 { id: "permissions", label: "Roles y permisos" },
 { id: "security", label: "Seguridad" },
 { id: "activity", label: "Actividad" },
 { id: "reports", label: "Documentos / reportes" },
];

const roleLabels: Record<string, string> = {
 admin: "Administrador",
 supervisor: "Supervisor",
 worker: "Trabajador",
 hr: "RR.HH.",
 super_admin: "Super administrador",
 unknown: "No informado",
};

const accountStatusLabels: Record<string, string> = {
 active: "Activo",
 inactive: "Inactivo",
 suspended: "Suspendido",
 blocked: "Bloqueado",
 disabled: "Deshabilitado",
 pending: "Pendiente",
 unknown: "No informado",
};

const laborStatusLabels: Record<string, string> = {
 active: "Activo",
 inactive: "Inactivo",
 "on-leave": "De licencia",
 on_leave: "De licencia",
 suspended: "Suspendido",
 terminated: "Cesado",
 unknown: "No informado",
};

const accessLabels: Record<string, string> = {
 none: "Sin acceso",
 read: "Solo lectura",
 write: "Lectura y escritura",
 admin: "Administrador",
 owner: "Responsable",
 full: "Acceso completo",
 restricted: "Restringido",
 denied: "Sin acceso",
};

const permissionModuleLabels: Record<string, string> = {
 requests: "Solicitudes",
 workers: "Trabajadores",
 attendance: "Asistencia",
 dashboard: "Panel principal",
 areas: "Areas",
 job_positions: "Cargos",
 positions: "Cargos",
 documents: "Documentos",
 reports: "Reportes",
 users: "Usuarios",
 roles: "Roles y permisos",
 work_crews: "Cuadrillas",
 work_locations: "Obras / proyectos",
};

const permissionActionLabels: Record<string, string> = {
 read: "Ver",
 approve: "Aprobar",
 reject: "Rechazar",
 observe: "Observar",
 create: "Crear",
 update: "Editar",
 edit: "Editar",
 delete: "Eliminar",
 manage: "Administrar",
 export: "Exportar",
};

const permissionScopeLabels: Record<string, string> = {
 project: "por proyecto",
 company: "de toda la empresa",
 own: "propias",
 team: "del equipo",
};

const documentTypeLabels: Record<string, string> = {
 temporary_credentials: "Credenciales temporales",
 temporary_password: "Credenciales temporales",
 worker_file: "Ficha del trabajador",
 user_profile: "Ficha de usuario",
 labor_contract: "Contrato laboral",
 contract: "Contrato laboral",
 report: "Reporte administrativo",
};

const activityActionLabels: Record<string, string> = {
 active: "Usuario activado",
 inactive: "Usuario desactivado",
 login: "Inicio de sesión",
 logout: "Cierre de sesión",
 created: "Usuario creado",
 updated: "Usuario actualizado",
 user_updated: "Usuario actualizado",
 password_reset: "Restablecimiento de contraseña",
 reset_password: "Restablecimiento de contraseña",
 temporary_password_generated: "Contraseña temporal generada",
 resetpassword: "Restablecimiento de contrasena",
 document_created: "Documento generado",
 document_uploaded: "Documento guardado",
 blocked: "Usuario bloqueado",
 unblocked: "Usuario desbloqueado",
 role_changed: "Rol actualizado",
};

const moduleLabels = ["Dashboard", "Trabajadores", "Equipos de trabajo", "Reportes", "Configuración"];

interface UserDetailPageProps {
 userId: string;
}

interface UserDetailModel {
 roleLabel: string;
 statusLabel: string;
 userType: string;
 hasWorkerRecord: boolean;
 hasOperationalAssignment: boolean;
 position: string;
 area: string;
 location: string;
 crew: string;
 lastAccess: string;
 createdAt: string;
 missingFields: string[];
}

const formatDate = (value?: string) => {
 if (!value) return "No disponible";
 const date = new Date(value);
 return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const formatDateTime = (value?: string) => {
 if (!value) return "No disponible";
 const date = new Date(value);
 return Number.isNaN(date.getTime()) ? "No disponible" : date.toLocaleString();
};

const humanizeBackendValue = (value?: string | null) => {
 if (!value) return "No disponible";
 return value
 .replace(/([a-z])([A-Z])/g, "$1 $2")
 .replace(/[._-]+/g, " ")
 .trim()
 .toLowerCase()
 .replace(/^\w|\s\w/g, (letter) => letter.toUpperCase());
};

const labelKey = (value: string) =>
 value
 .trim()
 .replace(/([a-z])([A-Z])/g, "$1_$2")
 .replace(/[.\s-]+/g, "_")
 .toLowerCase();

const translateBackendValue = (value: string | undefined | null, labels: Record<string, string>, fallback = "No disponible") => {
 if (!value) return fallback;
 return labels[value] ?? labels[value.toLowerCase()] ?? labels[labelKey(value)] ?? humanizeBackendValue(value);
};

const translateBoolean = (value?: boolean | null) => {
 if (value === true) return "Sí";
 if (value === false) return "No";
 return "No disponible";
};

const normalizeForMatch = (value?: string | null) =>
 (value || "")
 .trim()
 .toLowerCase()
 .normalize("NFD")
 .replace(/[\u0300-\u036f]/g, "");

const roleOptionValue = (role: RoleDefinition) => role.role_key || role.code || role.identifier || String(role.role || "") || role.id;

const roleOptionLabel = (role: RoleDefinition) => role.label || role.name || translateBackendValue(roleOptionValue(role), roleLabels);

const translatePermissionModule = (value?: string | null) => {
 if (!value) return "No disponible";
 const parts = value
 .replace(/([a-z])([A-Z])/g, "$1 $2")
 .split(/[.\s_-]+/)
 .filter(Boolean);
 const moduleKey = labelKey(parts[0] || "");
 const actionKey = labelKey(parts[1] || "");
 const scopeKey = labelKey(parts.slice(2).join(" "));
 const moduleLabel = permissionModuleLabels[moduleKey] ?? humanizeBackendValue(parts[0]);
 const actionLabel = permissionActionLabels[actionKey];
 const scopeLabel = permissionScopeLabels[scopeKey];

 if (actionLabel && scopeLabel) return `${moduleLabel}, ${actionLabel.toLowerCase()} ${scopeLabel}`;
 if (actionLabel) return `${moduleLabel}, ${actionLabel.toLowerCase()}`;
 return moduleLabel;
};

const translateActivityTitle = (action?: string | null, description?: string | null) => {
 const source = description || action || "";
 const actionMatch = source.match(/acci[oÃ³]n:\s*([a-z0-9_.-]+)/i);
 const rawAction = actionMatch?.[1] || action || source;
 return translateBackendValue(rawAction, activityActionLabels);
};

const readString = (source: unknown, paths: string[], fallback = "No disponible") => {
 const record = source as Record<string, unknown>;
 for (const path of paths) {
 const value = path.split(".").reduce<unknown>((current, key) => {
 if (!current || typeof current !== "object") return undefined;
 return (current as Record<string, unknown>)[key];
 }, record);

 if (typeof value === "string" && value.trim()) return value;
 if (typeof value === "number") return String(value);
 if (typeof value === "boolean") return translateBoolean(value);
 }
 return fallback;
};

const asList = <T,>(value: unknown): T[] => {
 if (Array.isArray(value)) return value as T[];
 if (!value || typeof value !== "object") return [];
 const record = value as Record<string, unknown>;
 for (const key of ["items", "data", "results", "workLocations", "locations", "crews", "workers"]) {
 const nested = record[key];
 if (Array.isArray(nested)) return nested as T[];
 if (nested && typeof nested === "object") {
 const nestedList = asList<T>(nested);
 if (nestedList.length) return nestedList;
 }
 }
 return [];
};

const buildModel = (user: UserProfile): UserDetailModel => {
 const roleLabel = translateBackendValue(user.role, roleLabels);
 const hasWorkerRecord = Boolean(user.hasWorkerRecord);
 const hasOperationalAssignment = hasWorkerRecord || Boolean(user.supervisedCrew);
 const position = user.worker?.position || roleLabel || "Sin cargo definido";
 const area = user.worker?.area_name || user.supervisedCrew?.name || "No disponible";
 const location = user.worker?.work_location_name || user.supervisedCrew?.work_location_name || "Sin proyecto";
 const crew = user.worker?.crew_name || user.supervisedCrew?.name || "No disponible";
 const missingFields = [
 !user.phone ? "Telefono no informado" : null,
 user.documentNumber ? null : "Documento no informado",
 area === "No disponible" ? "Area no informada" : null,
 location === "Sin proyecto" ? "Proyecto u obra no asignado" : null,
 !user.lastLoginAt ? "Ultimo acceso no disponible" : null,
 user.role === "unknown" ? "Rol no informado" : null,
 !hasOperationalAssignment ? "Ficha laboral o cuadrilla no vinculada" : null,
 ].filter(Boolean) as string[];

 return {
 roleLabel,
 statusLabel: translateBackendValue(user.status, accountStatusLabels),
 userType: roleLabel,
 hasWorkerRecord,
 hasOperationalAssignment,
 position,
 area,
 location,
 crew,
 lastAccess: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Nunca ha ingresado",
 createdAt: formatDate(user.createdAt ?? undefined),
 missingFields,
 };
};

const buildCompleteInfoUrl = (currentUser: UserProfile) => {
 const params = new URLSearchParams({
 mode: "complete",
 source: "user-detail",
 userId: currentUser.id,
 });
 const currentWorkerId = currentUser.workerId || currentUser.worker?.id;
 if (currentWorkerId) params.set("workerId", currentWorkerId);
 return `/trabajadores/alta?${params.toString()}`;
};

export function UserDetailPage({ userId }: UserDetailPageProps) {
 const router = useRouter();
 const [activeTab, setActiveTab] = useState<DetailTab>("summary");
 const [temporaryPasswordResult, setTemporaryPasswordResult] = useState<TemporaryPasswordResetResult | null>(null);
 const [showPasswordModal, setShowPasswordModal] = useState(false);
 const [passwordPdfSaved, setPasswordPdfSaved] = useState(false);
 const [passwordPdfDownloaded, setPasswordPdfDownloaded] = useState(false);
 const [isLoadingReset, setIsLoadingReset] = useState(false);
 const [isLoadingBlock, setIsLoadingBlock] = useState(false);
 const [isExportingPdf, setIsExportingPdf] = useState(false);
 const [isSavingCredentialPdf, setIsSavingCredentialPdf] = useState(false);
 const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);

 const { data: user, isLoading: isUserLoading, isError: isUserError, refetch: refetchUser } = useQuery({
 queryKey: ["user-detail-page", userId],
 queryFn: () => usersService.detail(userId),
 });

 const model = useMemo(() => (user ? buildModel(user) : null), [user]);
 const workerId = user?.workerId || user?.worker?.id;

 const { data: rolesData } = useQuery({
 queryKey: ["user-detail-roles"],
 queryFn: () => rolesService.list(true),
 enabled: isEditModalOpen,
 });

 const { data: documentsData, isLoading: isLoadingDocuments, refetch: refetchDocuments } = useQuery({
 queryKey: ["worker-generated-documents", workerId],
 queryFn: () => usersService.listWorkerDocuments(workerId!),
 enabled: Boolean(workerId),
 });

 const handleCompleteInfo = () => {
 if (!user) return;
 router.push(buildCompleteInfoUrl(user));
 };

 const handleResetPassword = async () => {
 if (!user) return;
 try {
 setIsLoadingReset(true);
 const res = await usersService.resetPassword(user.id);
 const pass = res.temporaryPassword || "";
 if (!pass) {
 toast.error("El backend no devolvio la contrasena temporal.");
 return;
 }
 setTemporaryPasswordResult(res);
 setPasswordPdfSaved(false);
 setPasswordPdfDownloaded(false);
 setShowPasswordModal(true);
 await refetchUser();
 toast.success("Contrasena temporal generada.");
 } catch {
 toast.error("Error al restablecer la contrasena.");
 } finally {
 setIsLoadingReset(false);
 }
 };

 const handleClosePasswordModal = () => {
 if (!passwordPdfDownloaded && !passwordPdfSaved) {
 const shouldClose = window.confirm("Esta contrasena no podra volver a visualizarse. Deseas cerrar de todos modos?");
 if (!shouldClose) return;
 }
 setShowPasswordModal(false);
 setTemporaryPasswordResult(null);
 setPasswordPdfDownloaded(false);
 setPasswordPdfSaved(false);
 };

 const handleDownloadCredentialPdf = () => {
 if (!user || !temporaryPasswordResult) return;
 downloadTemporaryCredentialsPdf({
 user,
 temporaryPassword: temporaryPasswordResult.temporaryPassword,
 generatedAt: temporaryPasswordResult.generatedAt,
 generatedBy: "Administrador del sistema",
 });
 setPasswordPdfDownloaded(true);
 toast.success("PDF de credenciales descargado.");
 };

 const handleSaveCredentialPdf = async () => {
 if (!user || !temporaryPasswordResult || !workerId) {
 toast.error("No hay ficha laboral vinculada para guardar el documento.");
 return;
 }

 try {
 setIsSavingCredentialPdf(true);
 const base64 = temporaryCredentialsPdfBase64({
 user,
 temporaryPassword: temporaryPasswordResult.temporaryPassword,
 generatedAt: temporaryPasswordResult.generatedAt,
 generatedBy: "Administrador del sistema",
 });
 await usersService.saveWorkerDocument(workerId, {
 name: "Credenciales temporales",
 type: "Credenciales temporales",
 fileName: buildTemporaryCredentialsFileName(user.fullName, temporaryPasswordResult.generatedAt),
 mimeType: "application/pdf",
 base64,
 });
 setPasswordPdfSaved(true);
 await refetchDocuments();
 toast.success("PDF guardado en documentos del trabajador.");
 } catch {
 toast.error("No se pudo guardar el PDF en documentos.");
 } finally {
 setIsSavingCredentialPdf(false);
 }
 };

 const handleUpdateUser = async (payload: UserUpdatePayload) => {
 if (!user) return;
 await usersService.update(user.id, payload);
 await refetchUser();
 setIsEditModalOpen(false);
 toast.success("Usuario actualizado.");
 };

 const handleToggleBlock = async () => {
 if (!user) return;
 const isActive = user.status === "active";
 const confirmation = isActive
 ? "Seguro que deseas bloquear este usuario? No podra acceder al sistema hasta que sea desbloqueado."
 : "Seguro que deseas reactivar este usuario?";

 if (!window.confirm(confirmation)) return;

 try {
 setIsLoadingBlock(true);
 if (isActive) {
 await usersService.blockUser(user.id);
 toast.success("Usuario bloqueado.");
 } else {
 await usersService.enableUser(user.id);
 toast.success("Usuario reactivado.");
 }
 await refetchUser();
 } catch {
 toast.error("No se pudo cambiar el estado del usuario.");
 } finally {
 setIsLoadingBlock(false);
 }
 };

 const handleLinkWorker = async (workerId: string) => {
 if (!user) return;
 try {
 await usersService.linkWorker(user.id, workerId);
 await refetchUser();
 toast.success("Ficha laboral vinculada.");
 } catch {
 toast.error("No se pudo vincular la ficha laboral.");
 }
 };

 const handleExportProfilePdf = async () => {
 if (!user) return;
 try {
 setIsExportingPdf(true);
 await usersService.exportProfilePdf(user.id, user.fullName);
 toast.success("PDF del perfil descargado.");
 } catch {
 toast.error("No se pudo exportar el PDF del perfil.");
 } finally {
 setIsExportingPdf(false);
 }
 };

 if (isUserLoading) {
 return <UserDetailSkeleton />;
 }

 if (isUserError || !user || !model) {
 return (
 <ErrorState
 title="No se pudo cargar el detalle del usuario"
 description="Revisa la conexion o intenta nuevamente."
 onRetry={() => void refetchUser()}
 />
 );
 }

 return (
 <>
 <div className="grid gap-6">
 <UserHero
 user={user}
 model={model}
 isLoadingReset={isLoadingReset}
 isLoadingBlock={isLoadingBlock}
 isExportingPdf={isExportingPdf}
 onBack={() => router.push("/usuarios")}
 onEditUser={() => setIsEditModalOpen(true)}
 onResetPassword={handleResetPassword}
 onToggleBlock={handleToggleBlock}
 onExportProfilePdf={handleExportProfilePdf}
 />

 <SummaryCards model={model} />

 {model.missingFields.length ? <IncompleteDataAlert fields={model.missingFields} onComplete={handleCompleteInfo} /> : null}

 <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
 <div className="overflow-x-auto border-b border-border bg-muted px-3 py-2">
 <div className="flex min-w-max gap-2">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 type="button"
 onClick={() => setActiveTab(tab.id)}
 className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
 activeTab === tab.id ? "bg-primary text-white shadow-sm" : "text-foreground-soft hover:bg-card hover:text-foreground"
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>
 </div>
 <div className="p-5">
 {activeTab === "summary" ? <SummaryTab user={user} model={model} /> : null}
 {activeTab === "labor" ? <LaborTab user={user} model={model} onLinkWorker={() => setIsLinkModalOpen(true)} /> : null}
 {activeTab === "permissions" ? <PermissionsTab user={user} model={model} /> : null}
 {activeTab === "security" ? (
 <SecurityTab
 user={user}
 model={model}
 isLoadingReset={isLoadingReset}
 isLoadingBlock={isLoadingBlock}
 onResetPassword={handleResetPassword}
 onToggleBlock={handleToggleBlock}
 />
 ) : null}
 {activeTab === "activity" ? <ActivityTab user={user} /> : null}
 {activeTab === "reports" ? (
 <ReportsTab
 documents={documentsData ?? []}
 isLoadingDocuments={isLoadingDocuments}
 isExportingPdf={isExportingPdf}
 onExportProfilePdf={handleExportProfilePdf}
 />
 ) : null}
 </div>
 </div>
 </div>

 <LinkWorkerModal
 userId={user.id}
 isOpen={isLinkModalOpen}
 onClose={() => setIsLinkModalOpen(false)}
 onLink={handleLinkWorker}
 />
 {temporaryPasswordResult && showPasswordModal ? (
 <TemporaryPasswordModal
 user={user}
 result={temporaryPasswordResult}
 isSaving={isSavingCredentialPdf}
 pdfDownloaded={passwordPdfDownloaded}
 pdfSaved={passwordPdfSaved}
 canSave={Boolean(workerId)}
 onClose={handleClosePasswordModal}
 onDownload={handleDownloadCredentialPdf}
 onSave={handleSaveCredentialPdf}
 />
 ) : null}
 {isEditModalOpen ? (
 <EditUserModal user={user} roles={asList<RoleDefinition>(rolesData)} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdateUser} />
 ) : null}
 </>
 );
}

function UserHero({
 user,
 model,
 isLoadingReset,
 isLoadingBlock,
 isExportingPdf,
 onBack,
 onEditUser,
 onResetPassword,
 onToggleBlock,
 onExportProfilePdf,
}: {
 user: UserProfile;
 model: UserDetailModel;
 isLoadingReset: boolean;
 isLoadingBlock: boolean;
 isExportingPdf: boolean;
 onBack: () => void;
 onEditUser: () => void;
 onResetPassword: () => void;
 onToggleBlock: () => void;
 onExportProfilePdf: () => void;
}) {
 return (
 <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
 <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
 <Button variant="secondary" onClick={onBack} className="h-10 gap-2 rounded-xl px-3 text-sm">
 <ArrowLeft className="size-4" />
 Volver a usuarios
 </Button>
 <div className="flex flex-wrap gap-2">
 <Button variant="secondary" className="h-10 gap-2 rounded-xl px-3 text-sm" onClick={onEditUser}>
 <UserCog className="size-4" />
 Editar usuario
 </Button>
 <Button variant="secondary" className="h-10 gap-2 rounded-xl px-3 text-sm" disabled>
 <ShieldCheck className="size-4" />
 Cambiar rol
 </Button>
 <Button variant="secondary" onClick={onResetPassword} disabled={isLoadingReset} className="h-10 gap-2 rounded-xl px-3 text-sm">
 {isLoadingReset ? <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Key className="size-4" />}
 Restablecer contraseña
 </Button>
 <Button
 variant="secondary"
 onClick={onToggleBlock}
 disabled={isLoadingBlock}
 className={`h-10 gap-2 rounded-xl px-3 text-sm ${user.status === "active" ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700" : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"}`}
 >
 {user.status === "active" ? <Lock className="size-4" /> : <CheckCircle2 className="size-4" />}
 {user.status === "active" ? "Bloquear" : "Desbloquear"}
 </Button>
 <Button variant="secondary" onClick={onExportProfilePdf} disabled={isExportingPdf} className="h-10 gap-2 rounded-xl px-3 text-sm">
 {isExportingPdf ? <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Download className="size-4" />}
 {isExportingPdf ? "Exportando..." : "Exportar ficha PDF"}
 </Button>
 </div>
 </div>

 <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
 <UserAvatar
 src={user.avatarUrl}
 fullName={user.fullName}
 email={user.email}
 size="hero"
 rounded="full"
 className="border border-border shadow-sm"
 />
 <div className="min-w-0 flex-1">
 <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Ficha administrativa</p>
 <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{user.fullName}</h1>
 <p className="mt-2 flex items-center gap-2 text-sm text-foreground-soft">
 <Mail className="size-4" />
 {user.email || "No informado"}
 </p>
 <div className="mt-4 flex flex-wrap gap-2">
 <Badge variant={user.status === "active" ? "success" : "secondary"}>{model.statusLabel}</Badge>
 <Badge variant="info">{model.roleLabel}</Badge>
 <Badge variant={model.hasOperationalAssignment ? "success" : "warning"}>
 {model.hasWorkerRecord ? "Ficha vinculada" : model.hasOperationalAssignment ? "Supervisa cuadrilla" : "Sin ficha laboral"}
 </Badge>
 <Badge variant="outline">{model.userType}</Badge>
 </div>
 </div>
 </div>
 </section>
 );
}

function SummaryCards({ model }: { model: UserDetailModel }) {
 return (
 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <SummaryCard icon={<UserRound className="size-5" />} label="Rol actual" value={model.roleLabel} />
 <SummaryCard icon={<ShieldCheck className="size-5" />} label="Estado de cuenta" value={model.statusLabel} />
 <SummaryCard icon={<BriefcaseBusiness className="size-5" />} label="Ficha laboral" value={model.hasWorkerRecord ? "Vinculada" : model.hasOperationalAssignment ? "Operativa" : "No vinculada"} />
 <SummaryCard icon={<CalendarDays className="size-5" />} label="Ultimo acceso" value={model.lastAccess} />
 <SummaryCard icon={<Building2 className="size-5" />} label="Proyecto / obra" value={model.location} />
 <SummaryCard icon={<UsersRound className="size-5" />} label="Cuadrilla" value={model.crew} />
 <SummaryCard icon={<Activity className="size-5" />} label="Estado laboral" value={model.hasOperationalAssignment ? "Activo" : "No disponible"} />
 </section>
 );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
 return (
 <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
 <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground-soft">
 <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
 {label}
 </div>
 <p className="text-base font-bold text-foreground">{value || "No disponible"}</p>
 </div>
 );
}

function IncompleteDataAlert({ fields, onComplete }: { fields: string[]; onComplete: () => void }) {
 return (
 <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="flex gap-3">
 <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
 <div>
 <h2 className="font-semibold text-amber-950">Este usuario tiene información incompleta.</h2>
 <ul className="mt-2 grid gap-1 text-sm text-amber-900 sm:grid-cols-2">
 {fields.map((field) => <li key={field}>{field}</li>)}
 </ul>
 </div>
 </div>
 <Button variant="secondary" className="h-10 rounded-xl px-3 text-sm" onClick={onComplete}>
 Completar información
 </Button>
 </div>
 </section>
 );
}

function SummaryTab({ user, model }: { user: UserProfile; model: UserDetailModel }) {
 return (
 <div className="grid gap-5 lg:grid-cols-2">
 <InfoCard title="Datos principales" icon={<FileText className="size-5" />}>
 <InfoRows items={[
 ["Nombre completo", user.fullName],
 ["Correo", user.email],
 ["Usuario", readString(user, ["username", "userName", "login"])],
 ["Teléfono", user.phone || "No disponible"],
 ["Documento", user.documentNumber || "No disponible"],
 ["Fecha de creación", model.createdAt],
 ]} />
 </InfoCard>
 <InfoCard title="Estado general" icon={<ShieldCheck className="size-5" />}>
 <InfoRows items={[
 ["Rol", model.roleLabel],
 ["Estado", model.statusLabel],
 ["Tipo de usuario", model.userType],
 ["Ficha laboral", model.hasWorkerRecord ? "Vinculada" : "No vinculada"],
 ["Obra / proyecto", model.location],
 ["Ultimo acceso", model.lastAccess],
 ]} />
 </InfoCard>
 </div>
 );
}

function LaborTab({ user, model, onLinkWorker }: { user: UserProfile; model: UserDetailModel; onLinkWorker: () => void }) {
 if (!model.hasOperationalAssignment) {
 return (
 <div className="rounded-3xl border border-dashed border-slate-300 bg-muted p-10 text-center">
 <BriefcaseBusiness className="mx-auto mb-3 size-10 text-muted-foreground" />
 <h2 className="text-lg font-semibold text-foreground">Este usuario no tiene ficha laboral vinculada.</h2>
 <p className="mt-1 text-sm text-foreground-soft">Puedes asociarlo a una ficha laboral existente si corresponde.</p>
 <Button className="mt-5 rounded-xl" onClick={onLinkWorker}>
 Vincular ficha laboral
 </Button>
 </div>
 );
 }

 return (
 <InfoCard title="Ficha laboral y asignación operativa" icon={<BriefcaseBusiness className="size-5" />}>
 <InfoRows items={[
 ["Cargo", model.position],
 ["Área", model.area],
 ["Departamento", user.worker?.department_name || "No disponible"],
 ["Empresa", user.worker?.company_name || "No disponible"],
 ["Sede", user.worker?.branch_name || "No disponible"],
 ["Obra / proyecto", model.location],
 ["Cuadrilla", model.crew],
 ["Supervisor responsable", user.worker?.supervisor_name || "No disponible"],
 ["Estado laboral", translateBackendValue(user.worker?.status, laborStatusLabels)],
 ["Fecha de ingreso", user.worker?.hire_date ? formatDate(user.worker.hire_date) : "No disponible"],
 ]} />
 </InfoCard>
 );
}

function PermissionsTab({ user, model }: { user: UserProfile; model: UserDetailModel }) {
 return (
 <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
 <InfoCard title="Rol y nivel de acceso" icon={<UserCog className="size-5" />}>
 <InfoRows items={[
 ["Rol actual", model.roleLabel],
 ["Nivel de acceso", model.roleLabel],
 ["Permisos registrados", user.permissions.length ? `${user.permissions.length}` : "No disponible"],
 ]} />
 <Button variant="secondary" className="mt-4 rounded-xl" disabled>
 Gestionar permisos
 </Button>
 </InfoCard>
 <div className="overflow-hidden rounded-2xl border border-border bg-card">
 <table className="min-w-full text-sm">
 <thead className="bg-card-muted text-left text-xs uppercase tracking-wide text-foreground-soft">
 <tr>
 <th className="px-4 py-3">Modulo</th>
 <th className="px-4 py-3">Acceso</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {(user.permissionsByModule?.length ? user.permissionsByModule : moduleLabels.map((module) => ({ module, access: "Permisos detallados no disponibles", moduleLabel: module, accessLabel: "Permisos detallados no disponibles" }))).map((permission) => {
 const rawModule = permission.moduleLabel || permission.module || "";
 const rawAccess = permission.access || permission.accessLabel || "";
 const accessTranslation = ACCESS_LEVEL_LABELS[rawAccess.toLowerCase()] || translateBackendValue(rawAccess, accessLabels);
 
 return (
 <tr key={`${permission.module}-${permission.access}`}>
 <td className="px-4 py-3 font-medium text-foreground">{formatPermissionLabel(rawModule)}</td>
 <td className="px-4 py-3 text-foreground-soft">{accessTranslation}</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 );
}

function SecurityTab({
 user,
 model,
 isLoadingReset,
 isLoadingBlock,
 onResetPassword,
 onToggleBlock,
}: {
 user: UserProfile;
 model: UserDetailModel;
 isLoadingReset: boolean;
 isLoadingBlock: boolean;
 onResetPassword: () => void;
 onToggleBlock: () => void;
}) {
 return (
 <div className="grid gap-5">
 <InfoCard title="Seguridad y acceso" icon={<ShieldCheck className="size-5" />}>
 <InfoRows items={[
 ["Ultimo acceso", model.lastAccess],
 ["Fecha de creacion", model.createdAt],
 ["Estado de cuenta", model.statusLabel],
 ["Correo verificado", translateBoolean(user.security?.email_verified)],
 ["Cambio de contrasena requerido", translateBoolean(user.security?.password_change_required)],
 ["Intentos fallidos", user.security?.failed_login_attempts === null || user.security?.failed_login_attempts === undefined ? "No disponible" : String(user.security.failed_login_attempts)],
 ["Sesiones activas", user.security?.active_sessions === null || user.security?.active_sessions === undefined ? "No disponible" : String(user.security.active_sessions)],
 ]} />
 </InfoCard>
 <div className="grid gap-4 lg:grid-cols-3">
 <SecurityActionCard
 icon={<Key className="size-5" />}
 title="Contrasena"
 status={user.security?.password_change_required ? "Cambio requerido" : "Cambio no requerido"}
 actions={(
 <>
 <Button onClick={onResetPassword} disabled={isLoadingReset} className="w-full gap-2 rounded-xl">
 {isLoadingReset ? <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Key className="size-4" />}
 Restablecer contrasena
 </Button>
 <Button variant="secondary" disabled className="w-full rounded-xl">Forzar cambio</Button>
 </>
 )}
 />
 <SecurityActionCard
 icon={<ShieldCheck className="size-5" />}
 title="Sesiones"
 status={`${user.security?.active_sessions ?? 0} sesiones activas`}
 actions={(
 <>
 <Button variant="secondary" disabled className="w-full rounded-xl">Ver sesiones activas</Button>
 <Button variant="secondary" disabled className="w-full rounded-xl">Cerrar sesiones activas</Button>
 </>
 )}
 />
 <SecurityActionCard
 icon={<Lock className="size-5" />}
 title="Cuenta"
 status={model.statusLabel}
 actions={(
 <Button
 variant="secondary"
 onClick={onToggleBlock}
 disabled={isLoadingBlock}
 className={`w-full rounded-xl ${user.status === "active" ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700" : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"}`}
 >
 {user.status === "active" ? "Bloquear usuario" : "Activar usuario"}
 </Button>
 )}
 />
 </div>
 <InfoCard title="Historial de seguridad" icon={<Activity className="size-5" />}>
 <InfoRows items={[
 ["Ultimo evento", user.lastLoginAt ? "Inicio de sesion" : "Sin eventos recientes"],
 ["Fecha", user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "No disponible"],
 ["PDF generado", "Se registra al guardar credenciales en documentos"],
 ["Documento guardado", "Ver pestaña Documentos / reportes"],
 ]} />
 </InfoCard>
 </div>
 );
}

function SecurityActionCard({ icon, title, status, actions }: { icon: React.ReactNode; title: string; status: string; actions: React.ReactNode }) {
 return (
 <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
 <div className="mb-4 flex items-start gap-3">
 <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
 <div>
 <h3 className="font-semibold text-foreground">{title}</h3>
 <p className="text-sm text-foreground-soft">{status}</p>
 </div>
 </div>
 <div className="grid gap-2">{actions}</div>
 </section>
 );
}

function ActivityTab({ user }: { user: UserProfile }) {
 const activities = user.activity?.length
 ? user.activity.map((item) => [
 formatActivityAction(item.actionLabel || item.action || ""),
 formatDateTime(item.created_at),
 formatActivityDescription(item) || `${item.scope === "actor" ? "Acción realizada por el usuario" : item.scope === "target" ? "Acción realizada sobre este usuario" : "Actividad registrada"}${item.actor_name ? ` por ${item.actor_name}` : ""}.`,
 ])
 : [
 user.lastLoginAt ? ["Inicio de sesion", formatDateTime(user.lastLoginAt), "Ultimo acceso registrado por la plataforma."] : null,
 user.createdAt ? ["Usuario creado", formatDateTime(user.createdAt), "Cuenta registrada en el sistema."] : null,
 ].filter(Boolean) as string[][];

 if (!activities.length) {
 return <EmptyPanel icon={<Activity className="size-10" />} title="No hay actividad registrada para este usuario." />;
 }

 return (
 <ol className="grid gap-4">
 {activities.map(([title, date, description]) => (
 <li key={`${title}-${date}`} className="rounded-2xl border border-border bg-card p-4">
 <div className="flex gap-3">
 <span className="mt-1 size-3 rounded-full bg-primary" />
 <div>
 <p className="font-semibold text-foreground">{title}</p>
 <p className="text-xs text-foreground-soft">{date}</p>
 <p className="mt-1 text-sm text-muted-foreground">{description}</p>
 </div>
 </div>
 </li>
 ))}
 </ol>
 );
}

function ReportsTab({
 documents,
 isLoadingDocuments,
 isExportingPdf,
 onExportProfilePdf,
}: {
 documents: WorkerGeneratedDocument[];
 isLoadingDocuments: boolean;
 isExportingPdf: boolean;
 onExportProfilePdf: () => void;
}) {
 return (
 <div className="grid gap-5">
 <div className="grid gap-3 md:grid-cols-2">
 <ReportAction
 icon={<FileText className="size-5" />}
 title="Exportar ficha de usuario"
 description="Genera el PDF oficial del perfil desde el backend."
 actionLabel={isExportingPdf ? "Exportando..." : "Descargar PDF"}
 disabled={isExportingPdf}
 onClick={onExportProfilePdf}
 />
 <ReportAction icon={<FileText className="size-5" />} title="Contrato laboral" description="Documento laboral generado por el sistema." />
 <ReportAction icon={<FileSpreadsheet className="size-5" />} title="Ficha del trabajador" description="Ficha administrativa consolidada." />
 <ReportAction icon={<Activity className="size-5" />} title="Reportes administrativos" description="Historial, permisos y auditoria." />
 </div>
 <InfoCard title="Documentos generados automaticamente" icon={<FileSpreadsheet className="size-5" />}>
 {isLoadingDocuments ? (
 <div className="h-24 animate-pulse rounded-2xl bg-muted" />
 ) : documents.length ? (
 <div className="overflow-x-auto">
 <table className="min-w-full text-sm">
 <thead className="bg-card-muted text-left text-xs uppercase tracking-wide text-foreground-soft">
 <tr>
 <th className="px-4 py-3">Documento</th>
 <th className="px-4 py-3">Tipo</th>
 <th className="px-4 py-3">Generado</th>
 <th className="px-4 py-3">Administrador</th>
 <th className="px-4 py-3">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {documents.map((document) => (
 <tr key={document.id}>
 <td className="px-4 py-3 font-medium text-foreground">{document.name}</td>
 <td className="px-4 py-3 text-foreground-soft">{translateBackendValue(document.type, documentTypeLabels)}</td>
 <td className="px-4 py-3 text-foreground-soft">{formatDateTime(document.generatedAt)}</td>
 <td className="px-4 py-3 text-foreground-soft">{humanizeBackendValue(document.generatedBy)}</td>
 <td className="px-4 py-3">
 <div className="flex flex-wrap gap-2">
 <Button variant="secondary" className="h-9 gap-2 rounded-xl px-3" disabled={!document.url} onClick={() => document.url && window.open(document.url, "_blank", "noopener,noreferrer")}>
 <Eye className="size-4" />
 Ver PDF
 </Button>
 <Button variant="secondary" className="h-9 gap-2 rounded-xl px-3" disabled={!document.url} onClick={() => document.url && window.open(document.url, "_blank", "noopener,noreferrer")}>
 <Download className="size-4" />
 Descargar
 </Button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <EmptyPanel icon={<FileText className="size-10" />} title="Aun no hay documentos generados automaticamente." />
 )}
 </InfoCard>
 </div>
 );
}

function ReportAction({
 icon,
 title,
 description,
 actionLabel = "Descargar",
 disabled = true,
 onClick,
}: {
 icon: React.ReactNode;
 title: string;
 description: string;
 actionLabel?: string;
 disabled?: boolean;
 onClick?: () => void;
}) {
 return (
 <div className="rounded-2xl border border-border bg-card p-4">
 <div className="flex gap-3">
 <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
 <div className="min-w-0 flex-1">
 <h3 className="font-semibold text-foreground">{title}</h3>
 <p className="mt-1 text-sm text-foreground-soft">{description}</p>
 <Button variant="secondary" className="mt-4 gap-2 rounded-xl" disabled={disabled} onClick={onClick}>
 {disabled && actionLabel === "Exportando..." ? <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : null}
 {actionLabel}
 </Button>
 </div>
 </div>
 </div>
 );
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
 return (
 <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
 <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
 <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
 <h2 className="text-lg font-bold text-foreground">{title}</h2>
 <Button variant="ghost" className="h-9 w-9 rounded-xl p-0" onClick={onClose} aria-label="Cerrar">
 <X className="size-5" />
 </Button>
 </header>
 <div className="p-5">{children}</div>
 </section>
 </div>
 );
}

function TemporaryPasswordModal({
 user,
 result,
 isSaving,
 pdfDownloaded,
 pdfSaved,
 canSave,
 onClose,
 onDownload,
 onSave,
}: {
 user: UserProfile;
 result: TemporaryPasswordResetResult;
 isSaving: boolean;
 pdfDownloaded: boolean;
 pdfSaved: boolean;
 canSave: boolean;
 onClose: () => void;
 onDownload: () => void;
 onSave: () => void;
}) {
 const copyPassword = async () => {
 await navigator.clipboard.writeText(result.temporaryPassword);
 toast.success("Contrasena copiada.");
 };

 return (
 <ModalShell title="Contrasena temporal generada" onClose={onClose}>
 <div className="grid gap-5">
 <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
 Se ha generado una nueva contrasena temporal para el trabajador. Esta contrasena solo sera visible una vez.
 Descargala o guardala en los documentos del trabajador antes de cerrar esta ventana.
 </div>
 <div className="grid gap-3 rounded-2xl border border-border bg-muted p-4">
 <InfoRows items={[
 ["Trabajador", user.fullName],
 ["Correo o usuario", user.email || user.documentNumber || user.id],
 ["Generada", formatDateTime(result.generatedAt)],
 ]} />
 <div className="rounded-2xl border border-border bg-card p-4">
 <p className="text-xs font-bold uppercase tracking-wide text-foreground-soft">Contrasena temporal</p>
 <p className="mt-2 break-all font-mono text-2xl font-bold text-foreground">{result.temporaryPassword}</p>
 </div>
 </div>
 <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
 <Button className="gap-2 rounded-xl" onClick={copyPassword}>
 <Clipboard className="size-4" />
 Copiar
 </Button>
 <Button variant="secondary" className="gap-2 rounded-xl" onClick={onDownload}>
 <Download className="size-4" />
 {pdfDownloaded ? "PDF descargado" : "Descargar PDF"}
 </Button>
 <Button variant="secondary" className="gap-2 rounded-xl" onClick={onSave} disabled={!canSave || isSaving}>
 {isSaving ? <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Save className="size-4" />}
 {pdfSaved ? "Guardado" : "Guardar documento"}
 </Button>
 <Button variant={pdfDownloaded || pdfSaved ? "secondary" : "danger"} className="rounded-xl" onClick={onClose}>
 Cerrar
 </Button>
 </div>
 {!canSave ? <p className="text-sm text-rose-600">No se puede guardar en documentos porque el usuario no tiene ficha laboral vinculada.</p> : null}
 </div>
 </ModalShell>
 );
}

function EditUserModal({ user, roles, onClose, onSave }: { user: UserProfile; roles: RoleDefinition[]; onClose: () => void; onSave: (payload: UserUpdatePayload) => Promise<void> }) {
 const roleOptions: RoleDefinition[] = roles.length
 ? roles.filter((role) => role.is_active !== false)
 : Object.entries(roleLabels).filter(([key]) => key !== "unknown").map(([key, label]) => ({
 id: key,
 label,
 identifier: key,
 role_key: key,
 code: key,
 is_active: true,
 modules: [],
 } satisfies RoleDefinition));
 const matchedRole = roleOptions.find((role) => {
 const candidates = [roleOptionValue(role), role.role, role.label, role.name].map((value) => normalizeForMatch(String(value || "")));
 return candidates.includes(normalizeForMatch(user.role)) || candidates.includes(normalizeForMatch(roleLabels[user.role]));
 });
 const currentRoleValue = matchedRole ? roleOptionValue(matchedRole) : (user.role !== "unknown" ? user.role : roleOptionValue(roleOptions[0]));
 const [form, setForm] = useState<UserUpdatePayload>({
 fullName: user.fullName,
 email: user.email,
 phone: user.phone ?? "",
 role: currentRoleValue,
 status: user.status,
 isActive: user.status === "active",
 requiresPasswordChange: Boolean(user.security?.password_change_required),
 emailVerified: Boolean(user.security?.email_verified),
 });
 const roleOptionsKey = roleOptions.map((role) => roleOptionValue(role)).join("|");
 const prevRoleOptionsKeyRef = useRef(roleOptionsKey);
 const [isSaving, setIsSaving] = useState(false);

 if (prevRoleOptionsKeyRef.current !== roleOptionsKey) {
 prevRoleOptionsKeyRef.current = roleOptionsKey;
 setForm((current) => (
 roleOptions.some((role) => roleOptionValue(role) === current.role)
 ? current
 : { ...current, role: currentRoleValue }
 ));
 }

 const update = (key: keyof UserUpdatePayload, value: string | boolean) => {
 setForm((current) => ({
 ...current,
 [key]: value,
 ...(key === "status" ? { isActive: value === "active" } : {}),
 }));
 };

 const submit = async () => {
 if (!form.fullName.trim() || !form.email.trim() || !form.role) {
 toast.error("Nombre, correo y rol son obligatorios.");
 return;
 }
 try {
 setIsSaving(true);
 await onSave(form);
 } catch {
 toast.error("No se pudo actualizar el usuario.");
 } finally {
 setIsSaving(false);
 }
 };

 return (
 <ModalShell title="Editar usuario" onClose={onClose}>
 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame label="Nombre">
 <Input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} />
 </FieldFrame>
 <FieldFrame label="Correo">
 <Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
 </FieldFrame>
 <FieldFrame label="Telefono">
 <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} />
 </FieldFrame>
 <FieldFrame label="Rol actual">
 <Select value={form.role} onChange={(event) => update("role", event.target.value)}>
 {roleOptions.map((role) => (
 <option key={role.id} value={roleOptionValue(role)}>{roleOptionLabel(role)}</option>
 ))}
 </Select>
 </FieldFrame>
 <FieldFrame label="Estado de cuenta">
 <Select value={form.status} onChange={(event) => update("status", event.target.value)}>
 <option value="active">Activo</option>
 <option value="inactive">Inactivo</option>
 <option value="on-leave">Suspendido</option>
 </Select>
 </FieldFrame>
 <div className="grid gap-3 rounded-2xl border border-border bg-muted p-4">
 <label className="flex items-center gap-2 text-sm font-medium text-foreground">
 <input type="checkbox" checked={form.requiresPasswordChange} onChange={(event) => update("requiresPasswordChange", event.target.checked)} />
 Requerir cambio de contrasena
 </label>
 <label className="flex items-center gap-2 text-sm font-medium text-foreground">
 <input type="checkbox" checked={form.emailVerified} onChange={(event) => update("emailVerified", event.target.checked)} />
 Correo verificado
 </label>
 </div>
 </div>
 <div className="mt-5 flex justify-end gap-2">
 <Button variant="secondary" className="rounded-xl" onClick={onClose}>Cancelar</Button>
 <Button className="gap-2 rounded-xl" onClick={submit} disabled={isSaving}>
 {isSaving ? <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="size-4" />}
 Guardar cambios
 </Button>
 </div>
 </ModalShell>
 );
}

function InfoCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
 return (
 <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
 <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
 <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
 {title}
 </h2>
 {children}
 </section>
 );
}

function InfoRows({ items }: { items: Array<[string, string]> }) {
 return (
 <dl className="grid gap-3">
 {items.map(([label, value]) => (
 <div key={label} className="grid gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[190px_1fr]">
 <dt className="text-sm text-foreground-soft">{label}</dt>
 <dd className="break-words text-sm font-semibold text-foreground">{value || "No disponible"}</dd>
 </div>
 ))}
 </dl>
 );
}

function EmptyPanel({ icon, title }: { icon: React.ReactNode; title: string }) {
 return (
 <div className="grid place-items-center rounded-3xl border border-dashed border-slate-300 bg-muted p-10 text-center text-foreground-soft">
 {icon}
 <p className="mt-3 font-semibold">{title}</p>
 </div>
 );
}

function UserDetailSkeleton() {
 return (
 <div className="grid gap-6">
 <div className="h-52 animate-pulse rounded-3xl bg-slate-200" />
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 {Array.from({ length: 6 }).map((_, index) => (
 <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
 ))}
 </div>
 <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />
 </div>
 );
}
