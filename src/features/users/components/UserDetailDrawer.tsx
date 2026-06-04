import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Key,
  Link as LinkIcon,
  Loader2,
  Lock,
  Mail,
  MoreHorizontal,
  Phone,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  UserCog,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { formatPermissionLabel } from "@/lib/ui/permission-labels";
import { formatActivityAction, formatActivityDescription } from "@/lib/ui/activity-labels";

import { TemporaryPasswordReveal } from "@/components/security/TemporaryPasswordReveal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/types";
import { usersService } from "@/services/users.service";

import { LinkWorkerModal } from "./LinkWorkerModal";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  worker: "Trabajador",
  hr: "RR.HH.",
  super_admin: "Super administrador",
  unknown: "No informado",
};

const moduleLabels = ["Dashboard", "Trabajadores", "Equipos de trabajo", "Reportes", "Configuracion"];

interface UserDetailDrawerProps {
  user: UserProfile | null;
  onClose: () => void;
  onUserUpdated?: () => Promise<void> | void;
}

interface UserViewModel {
  hasRecord: boolean;
  hasOperationalAssignment: boolean;
  positionLabel: string;
  locationLabel: string;
  areaLabel: string;
  roleLabel: string;
  statusLabel: string;
  createdAt: string;
  lastLoginAt: string;
}

const formatDateTime = (value?: string) => {
  if (!value) return "No informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No informado" : date.toLocaleString();
};

const formatDate = (value?: string) => {
  if (!value) return "No informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const getRecordValue = (user: UserProfile, paths: string[]) => {
  const source = user as unknown as Record<string, unknown>;

  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object") return undefined;
      return (current as Record<string, unknown>)[key];
    }, source);

    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }

  return "No informado";
};

const buildUserViewModel = (user: UserProfile): UserViewModel => {
  const hasRecord = Boolean(user.hasWorkerRecord);
  const hasOperationalAssignment = hasRecord || Boolean(user.supervisedCrew);
  const roleLabel = roleLabels[user.role] ?? user.role ?? "No informado";

  return {
    hasRecord,
    hasOperationalAssignment,
    positionLabel: user.worker?.position || roleLabel || "Sin cargo definido",
    locationLabel: user.worker?.work_location_name || user.supervisedCrew?.work_location_name || "Sin proyecto",
    areaLabel: user.worker?.area_name || user.supervisedCrew?.name || "No informada",
    roleLabel,
    statusLabel: user.status === "active" ? "Activo" : user.status === "inactive" ? "Inactivo" : "No informado",
    createdAt: formatDate(user.createdAt),
    lastLoginAt: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Nunca ha ingresado",
  };
};

export function UserDetailDrawer({ user: initialUser, onClose, onUserUpdated }: UserDetailDrawerProps) {
  const [isLoadingBlock, setIsLoadingBlock] = useState(false);
  const [isLoadingReset, setIsLoadingReset] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const userDetailQuery = useQuery({
    queryKey: ["user-detail", initialUser?.id],
    queryFn: () => usersService.detail(initialUser!.id),
    enabled: Boolean(initialUser?.id),
    initialData: initialUser ?? undefined,
  });

  const user = userDetailQuery.data ?? initialUser;
  if (!user) return null;

  const model = buildUserViewModel(user);

  const handleResetPassword = async () => {
    try {
      setIsLoadingReset(true);
      const res = await usersService.resetPassword(user.id);
      const pass = res.temporaryPassword || "";
      setGeneratedPassword(pass);
      await userDetailQuery.refetch();
      toast.success("Contrasena temporal generada. Verifica tu identidad para revelarla.");
    } catch {
      toast.error("Error al resetear contrasena.");
    } finally {
      setIsLoadingReset(false);
    }
  };

  const handleToggleBlock = async () => {
    const isActive = user.status === "active";
    const message = isActive
      ? "Seguro que deseas bloquear este usuario? No podra acceder al sistema hasta que sea desbloqueado."
      : "Seguro que deseas reactivar este usuario?";

    if (!window.confirm(message)) return;

    try {
      setIsLoadingBlock(true);
      if (isActive) {
        await usersService.blockUser(user.id);
        toast.success("Usuario bloqueado con exito.");
      } else {
        await usersService.enableUser(user.id);
        toast.success("Usuario reactivado con exito.");
      }
      await userDetailQuery.refetch();
      await onUserUpdated?.();
    } catch {
      toast.error("Error al cambiar el estado del usuario.");
    } finally {
      setIsLoadingBlock(false);
    }
  };

  const handleLinkWorker = async (workerId: string) => {
    try {
      await usersService.linkWorker(user.id, workerId);
      await userDetailQuery.refetch();
      await onUserUpdated?.();
      toast.success("Trabajador vinculado con exito.");
    } catch {
      toast.error("Error al vincular trabajador.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />

      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[520px] flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        <UserDrawerHeader user={user} model={model} onClose={onClose} isFetching={userDetailQuery.isFetching} />

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {userDetailQuery.isFetching && !userDetailQuery.data ? <DrawerSkeleton /> : null}

          <div className="grid gap-4">
            <UserQuickSummary user={user} model={model} />
            <UserAlerts user={user} model={model} />
            <UserInfoSection user={user} model={model} />
            <UserLaborLinkSection
              model={model}
              user={user}
              onLinkWorker={() => setIsLinkModalOpen(true)}
            />
            <UserPermissionsSection user={user} model={model} />
            <UserSecuritySection
              user={user}
              model={model}
              generatedPassword={generatedPassword}
              isLoadingReset={isLoadingReset}
              onResetPassword={handleResetPassword}
            />
            <UserActivityTimeline user={user} />
          </div>
        </div>

        <UserDrawerFooter
          user={user}
          model={model}
          isLoadingReset={isLoadingReset}
          isLoadingBlock={isLoadingBlock}
          onResetPassword={handleResetPassword}
          onToggleBlock={handleToggleBlock}
          onLinkWorker={() => setIsLinkModalOpen(true)}
        />
      </aside>

      <LinkWorkerModal
        userId={user.id}
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onLink={handleLinkWorker}
      />
    </>
  );
}

function UserDrawerHeader({
  user,
  model,
  onClose,
  isFetching,
}: {
  user: UserProfile;
  model: UserViewModel;
  onClose: () => void;
  isFetching: boolean;
}) {
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Gestion de accesos</p>
          <h2 className="text-lg font-bold text-ink">Detalle de usuario</h2>
        </div>
        <div className="flex items-center gap-2">
          {isFetching ? <Loader2 className="size-4 animate-spin text-brand" /> : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/30"
            aria-label="Cerrar detalle de usuario"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar alt={user.fullName} size="lg" className="h-16 w-16 border border-slate-200 text-xl shadow-sm" />
          <span
            className={`absolute bottom-0 right-0 size-4 rounded-full border-2 border-white ${
              user.status === "active" ? "bg-emerald-500" : "bg-slate-400"
            }`}
            aria-label={model.statusLabel}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-bold text-ink">{user.fullName}</h3>
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-ink-soft">
            <Mail className="size-3.5 shrink-0" />
            {user.email || "No informado"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={user.status === "active" ? "success" : "secondary"}>{model.statusLabel}</Badge>
            <Badge variant="info">{model.roleLabel}</Badge>
            <Badge variant={model.hasOperationalAssignment ? "success" : "warning"}>
              {model.hasRecord ? "Ficha vinculada" : model.hasOperationalAssignment ? "Supervisa cuadrilla" : "Sin ficha"}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}

function UserQuickSummary({ user, model }: { user: UserProfile; model: UserViewModel }) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <SummaryChip icon={<UserCog className="size-4" />} label="Rol" value={model.roleLabel} />
      <SummaryChip icon={<ShieldCheck className="size-4" />} label="Estado" value={model.statusLabel} />
      <SummaryChip
        icon={<BriefcaseBusiness className="size-4" />}
        label="Ficha laboral"
        value={model.hasRecord ? "Vinculada" : model.hasOperationalAssignment ? "Operativa" : "No vinculada"}
      />
      <SummaryChip icon={<Clock3 className="size-4" />} label="Ultimo acceso" value={user.lastLoginAt ? formatDate(user.lastLoginAt) : "Sin acceso"} />
    </section>
  );
}

function SummaryChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        <span className="flex size-7 items-center justify-center rounded-xl bg-brand/10 text-brand">{icon}</span>
        {label}
      </div>
      <p className="truncate text-sm font-bold text-ink">{value || "No informado"}</p>
    </div>
  );
}

function UserAlerts({ user, model }: { user: UserProfile; model: UserViewModel }) {
  const alerts = [
    user.role === "unknown" ? "Este usuario no tiene rol informado." : null,
    !model.hasOperationalAssignment && user.status === "active"
      ? "Este usuario esta activo, pero no tiene ficha laboral ni cuadrilla asignada."
      : null,
    user.status === "active" && !user.lastLoginAt ? "Este usuario esta activo, pero aun no registra accesos." : null,
  ].filter(Boolean) as string[];

  if (!alerts.length) return null;

  return (
    <section className="grid gap-2">
      {alerts.map((alert) => (
        <div key={alert} className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span>{alert}</span>
        </div>
      ))}
    </section>
  );
}

function UserInfoSection({ user, model }: { user: UserProfile; model: UserViewModel }) {
  const username = getRecordValue(user, ["username", "userName", "login"]);
  const document = getRecordValue(user, ["document", "document_number", "dni", "personal_id", "worker.personal_id"]);

  return (
    <DrawerSection icon={<FileText className="size-4" />} title="Datos del usuario">
      <InfoGrid
        items={[
          ["Nombre completo", user.fullName || "No informado"],
          ["Correo", user.email || "No informado"],
          ["Usuario", username],
          ["Telefono", user.phone || "No informado"],
          ["Documento", document],
          ["Fecha de creacion", model.createdAt],
          ["Ultima actualizacion", getRecordValue(user, ["updatedAt", "updated_at"])],
        ]}
      />
    </DrawerSection>
  );
}

function UserLaborLinkSection({
  user,
  model,
  onLinkWorker,
}: {
  user: UserProfile;
  model: UserViewModel;
  onLinkWorker: () => void;
}) {
  return (
    <DrawerSection icon={<LinkIcon className="size-4" />} title="Vinculacion laboral">
      {model.hasOperationalAssignment ? (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <CheckCircle2 className="size-4" />
              {model.hasRecord ? "Ficha laboral vinculada" : "Responsabilidad operativa"}
            </div>
            <Badge variant="success">{model.hasRecord ? "Worker" : "Cuadrilla"}</Badge>
          </div>
          <InfoGrid
            items={[
              ["Cargo", model.positionLabel],
              ["Area", model.areaLabel],
              ["Empresa", getRecordValue(user, ["worker.company_name", "company_name", "company"])],
              ["Sede", getRecordValue(user, ["worker.branch_name", "branch_name", "sede_name", "sede"])],
              ["Obra / Proyecto", model.locationLabel],
              ["Cuadrilla", user.supervisedCrew?.name || getRecordValue(user, ["worker.crew_name", "crew_name"])],
              ["Supervisor responsable", getRecordValue(user, ["worker.supervisor_name", "supervisor_name"])],
              ["Estado laboral", getRecordValue(user, ["worker.status", "employment_status", "labor_status"])],
            ]}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
          <Building2 className="mx-auto mb-2 size-8 text-amber-600" />
          <p className="text-sm font-semibold text-amber-950">Este usuario no tiene ficha laboral vinculada.</p>
          <p className="mt-1 text-xs text-amber-800">Puedes asociarlo a una ficha existente si corresponde.</p>
          <Button variant="secondary" className="mt-4 h-9 rounded-xl px-3 text-xs" onClick={onLinkWorker}>
            Vincular ficha laboral
          </Button>
        </div>
      )}
    </DrawerSection>
  );
}

function UserPermissionsSection({ user, model }: { user: UserProfile; model: UserViewModel }) {
  const permissions = user.permissions ?? [];

  return (
    <DrawerSection icon={<ShieldCheck className="size-4" />} title="Roles y permisos">
      <div className="grid gap-3">
        <InfoGrid
          items={[
            ["Rol actual", model.roleLabel],
            ["Nivel de acceso", model.roleLabel],
          ]}
        />
        {permissions.length ? (
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <Badge key={permission} variant="info">{formatPermissionLabel(permission)}</Badge>
            ))}
          </div>
        ) : (
          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            {moduleLabels.map((label) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-ink">{label}</span>
                <span className="text-xs font-medium text-ink-soft">Permisos detallados no disponibles</span>
              </div>
            ))}
          </div>
        )}
        <Button variant="secondary" className="h-9 w-fit rounded-xl px-3 text-xs">
          Gestionar permisos
        </Button>
      </div>
    </DrawerSection>
  );
}

function UserSecuritySection({
  user,
  model,
  generatedPassword,
  isLoadingReset,
  onResetPassword,
}: {
  user: UserProfile;
  model: UserViewModel;
  generatedPassword: string;
  isLoadingReset: boolean;
  onResetPassword: () => void;
}) {
  const security = user.security;

  return (
    <DrawerSection icon={<ShieldAlert className="size-4" />} title="Seguridad y acceso">
      <div className="grid gap-4">
        <InfoGrid
          items={[
            ["Ultimo acceso", model.lastLoginAt],
            ["Fecha de creacion", model.createdAt],
            ["Estado de cuenta", model.statusLabel],
            ["Correo verificado", security?.email_verified === true ? "Si" : security?.email_verified === false ? "No" : "No disponible"],
            ["Sesiones activas", security?.active_sessions === null || security?.active_sessions === undefined ? "No disponible" : String(security.active_sessions)],
            ["Cambio pendiente", security?.password_change_required === true ? "Si" : security?.password_change_required === false ? "No" : "No disponible"],
            ["Intentos fallidos", security?.failed_login_attempts === null || security?.failed_login_attempts === undefined ? "No disponible" : String(security.failed_login_attempts)],
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="h-9 gap-2 rounded-xl px-3 text-xs" onClick={onResetPassword} disabled={isLoadingReset}>
            {isLoadingReset ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
            Restablecer contrasena
          </Button>
          <Button variant="secondary" className="h-9 gap-2 rounded-xl px-3 text-xs" disabled>
            <Lock className="size-4" />
            Cerrar sesiones
          </Button>
        </div>
        {generatedPassword ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="mb-3 text-xs text-amber-800">
              Esta contrasena temporal solo vive en esta sesion del navegador. Si recargas la pagina, deberas generar una nueva.
            </p>
            <TemporaryPasswordReveal password={generatedPassword} />
          </div>
        ) : null}
      </div>
    </DrawerSection>
  );
}

function UserActivityTimeline({ user }: { user: UserProfile }) {
  const activities = user.activity?.length
    ? user.activity.map((activity) => ({
        title: formatActivityAction(activity.actionLabel || activity.action || "Actividad"),
        date: activity.created_at ? formatDateTime(activity.created_at) : "Sin fecha",
        description:
          formatActivityDescription(activity) ||
          "Movimiento registrado en la cuenta.",
      }))
    : ([
        user.lastLoginAt
          ? {
              title: "Inicio de sesion",
              date: formatDateTime(user.lastLoginAt),
              description: "Ultimo acceso registrado por la plataforma.",
            }
          : null,
        user.createdAt
          ? {
              title: "Usuario creado",
              date: formatDateTime(user.createdAt),
              description: "Cuenta registrada en el sistema.",
            }
          : null,
      ].filter(Boolean) as Array<{ title: string; date: string; description: string }>);

  return (
    <DrawerSection icon={<Activity className="size-4" />} title="Actividad reciente">
      {activities.length ? (
        <ol className="grid gap-3">
          {activities.map((activity) => (
            <li key={`${activity.title}-${activity.date}`} className="flex gap-3">
              <span className="mt-1 size-2 rounded-full bg-brand" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{activity.title}</p>
                <p className="text-xs text-ink-soft">{activity.date}</p>
                <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-ink-soft">No hay actividad reciente registrada.</p>
      )}
    </DrawerSection>
  );
}

function UserDrawerFooter({
  user,
  model,
  isLoadingReset,
  isLoadingBlock,
  onResetPassword,
  onToggleBlock,
  onLinkWorker,
}: {
  user: UserProfile;
  model: UserViewModel;
  isLoadingReset: boolean;
  isLoadingBlock: boolean;
  onResetPassword: () => void;
  onToggleBlock: () => void;
  onLinkWorker: () => void;
}) {
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Button variant="secondary" className="h-10 gap-2 rounded-xl px-3 text-xs" disabled>
          <UserCog className="size-4" />
          Editar usuario
        </Button>
        <Button variant="secondary" className="h-10 gap-2 rounded-xl px-3 text-xs" onClick={onResetPassword} disabled={isLoadingReset}>
          {isLoadingReset ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
          Restablecer
        </Button>
        <Button
          variant="secondary"
          className={`h-10 gap-2 rounded-xl px-3 text-xs ${
            user.status === "active" ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700" : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
          }`}
          onClick={onToggleBlock}
          disabled={isLoadingBlock}
        >
          {isLoadingBlock ? <Loader2 className="size-4 animate-spin" /> : user.status === "active" ? <UserIcon className="size-4" /> : <CheckCircle2 className="size-4" />}
          {user.status === "active" ? "Bloquear" : "Reactivar"}
        </Button>
      </div>
      {!model.hasOperationalAssignment ? (
        <button type="button" className="mt-3 text-xs font-semibold text-brand hover:text-brand-strong" onClick={onLinkWorker}>
          Vincular ficha laboral
        </button>
      ) : null}
    </footer>
  );
}

function DrawerSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink">
        <span className="flex size-8 items-center justify-center rounded-xl bg-brand/10 text-brand">{icon}</span>
        {title}
      </h4>
      {children}
    </section>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[140px_1fr] gap-3 text-sm">
          <dt className="text-ink-soft">{label}</dt>
          <dd className="min-w-0 break-words font-semibold text-ink">{value || "No informado"}</dd>
        </div>
      ))}
    </dl>
  );
}

function DrawerSkeleton() {
  return (
    <div className="mb-4 grid gap-3">
      <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}
