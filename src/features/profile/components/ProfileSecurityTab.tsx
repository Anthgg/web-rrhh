"use client";

import { useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Shield,
  Key,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Monitor,
  ShieldAlert,
  ShieldCheck,
  Clock,
  MapPin,
  Wifi,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FieldFrame, Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ChangePasswordFormValues, UserProfile, ProfileSession } from "@/types";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLottie } from "@/components/ui/feedback/AppLottie";
import { feedbackAnimations } from "@/components/ui/feedback/animation-registry";
import {
  getActiveSessions,
  revokeSession,
  revokeOtherSessions,
  trustSession,
} from "@/services/profile.service";
import { getApiErrorCode, getApiErrorDetails } from "@/lib/api/error-handlers";
import { ApiClientError } from "@/lib/api/client";
import {
  formatDateTime,
  formatTrustAvailableAt,
  getDeviceIcon,
  getSafeDeviceName,
  getSafeBrowser,
  getSafeOs,
  getSafeIp,
  getSafeLocation,
  getDeviceTypeLabelEs,
  getRelativeTimeLabel,
} from "@/lib/api/normalizers/session-normalizer";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

// Strong client-side validation schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa la contraseña actual."),
    newPassword: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
      .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula.")
      .regex(/[a-z]/, "Debe contener al menos una letra minúscula.")
      .regex(/[0-9]/, "Debe contener al menos un número.")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un símbolo especial."),
    confirmPassword: z.string().min(1, "Confirma la nueva contraseña."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "La nueva contraseña debe ser diferente de la contraseña actual.",
    path: ["newPassword"],
  });

interface GroupedDevice {
  deviceId: string | null;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
  isCurrent: boolean;
  isTrusted: boolean;
  canTrust: boolean;
  trustAvailableAt: string | null;
  isLegacy: boolean;
  sessions: ProfileSession[];
}

interface ProfileSecurityTabProps {
  user: UserProfile;
  /** Called with only currentPassword + newPassword — confirmPassword is stripped by workspace */
  onChangePassword: (values: ChangePasswordFormValues) => Promise<void>;
  isPending: boolean;
}

function formatSessionDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function ProfileSecurityTab({ user, onChangePassword, isPending }: ProfileSecurityTabProps) {
  const queryClient = useQueryClient();
  // Real values from backend — no hardcoded fallbacks
  const lastLogin = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleString("es-PE", { timeZone: "America/Lima" })
    : null;

  const isEmailVerified = user.security?.email_verified ?? null; // three-state
  const passwordChangeRequired = user.security?.password_change_required ?? null;
  const failedLoginAttempts = user.security?.failed_login_attempts ?? null;

  // ── Active Sessions Queries & Mutations ────────────────────────────────────
  const {
    data: sessions = [],
    isLoading: isSessionsLoading,
    isError: isSessionsError,
    refetch: refetchSessions,
  } = useQuery<ProfileSession[]>({
    queryKey: ["profile-sessions"],
    queryFn: getActiveSessions,
    staleTime: 30_000,
  });

  const [activeTab, setActiveTab] = useState<"all" | "trusted" | "untrusted" | "current">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: "danger" | "primary";
  } | null>(null);

  const triggerConfirm = (options: {
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: "danger" | "primary";
  }) => {
    setConfirmModal({
      isOpen: true,
      ...options,
    });
  };

  // Group sessions by deviceId
  const devices = useMemo(() => {
    const groups: Record<string, ProfileSession[]> = {};
    const legacyDevices: ProfileSession[] = [];

    sessions.forEach((session) => {
      const devId = session.deviceId;
      if (!devId) {
        legacyDevices.push(session);
      } else {
        if (!groups[devId]) {
          groups[devId] = [];
        }
        groups[devId].push(session);
      }
    });

    const list: GroupedDevice[] = [];

    // Process grouped devices
    Object.entries(groups).forEach(([devId, groupSessions]) => {
      const currentSession = groupSessions.find((s) => s.isCurrent);
      const representative = currentSession || groupSessions[0];

      const isCurrent = groupSessions.some((s) => s.isCurrent);
      const isTrusted = groupSessions.some((s) => s.isTrusted);
      const canTrust = groupSessions.some((s) => s.canTrust);
      
      const trustAvailableSession = groupSessions.find((s) => s.trustAvailableAt);
      const trustAvailableAt = trustAvailableSession ? trustAvailableSession.trustAvailableAt : null;

      list.push({
        deviceId: devId,
        deviceName: getSafeDeviceName(representative),
        deviceType: representative.deviceType || "unknown",
        browser: getSafeBrowser(representative),
        os: getSafeOs(representative),
        isCurrent,
        isTrusted,
        canTrust,
        trustAvailableAt,
        isLegacy: groupSessions.every((s) => s.isLegacy),
        sessions: groupSessions,
      });
    });

    // Process legacy devices
    legacyDevices.forEach((session) => {
      list.push({
        deviceId: null,
        deviceName: getSafeDeviceName(session),
        deviceType: session.deviceType || "unknown",
        browser: getSafeBrowser(session),
        os: getSafeOs(session),
        isCurrent: session.isCurrent,
        isTrusted: session.isTrusted,
        canTrust: session.canTrust,
        trustAvailableAt: session.trustAvailableAt,
        isLegacy: true,
        sessions: [session],
      });
    });

    // Sort: Current device first, then trusted devices, then by most recent activity
    return list.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      
      if (a.isTrusted && !b.isTrusted) return -1;
      if (!a.isTrusted && b.isTrusted) return 1;

      const aMaxActivity = Math.max(...a.sessions.map((s) => s.lastActivityAt ? new Date(s.lastActivityAt).getTime() : 0));
      const bMaxActivity = Math.max(...b.sessions.map((s) => s.lastActivityAt ? new Date(s.lastActivityAt).getTime() : 0));
      return bMaxActivity - aMaxActivity;
    });
  }, [sessions]);

  // Calculate statistics from devices list
  const stats = useMemo(() => {
    const total = devices.length;
    const current = devices.filter((d) => d.isCurrent).length;
    const trusted = devices.filter((d) => d.isTrusted).length;
    const untrusted = total - trusted;
    return { total, current, trusted, untrusted };
  }, [devices]);

  // Filter devices
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (activeTab === "trusted") return d.isTrusted;
      if (activeTab === "untrusted") return !d.isTrusted;
      if (activeTab === "current") return d.isCurrent;
      return true;
    });
  }, [devices, activeTab]);

  // Paginate devices
  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / ITEMS_PER_PAGE));
  const currentPageGuarded = Math.min(currentPage, totalPages);

  const paginatedDevices = useMemo(() => {
    const startIndex = (currentPageGuarded - 1) * ITEMS_PER_PAGE;
    return filteredDevices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDevices, currentPageGuarded]);

  // Centralized session error handler
  const handleSessionError = (error: unknown, fallbackMessage: string, sessionTrustAvailableAt?: string | null) => {
    if (error instanceof ApiClientError && error.status === 422) {
      toast.error("Este dispositivo todavía no puede marcarse como confiable");
      return;
    }

    const code = getApiErrorCode(error);
    const details = getApiErrorDetails(error);
    const trustAvailableAt = details?.trustAvailableAt ?? details?.trust_available_at ?? sessionTrustAvailableAt;

    if (code === "SESSION_NOT_FOUND") {
      toast.error("La sesión ya no existe.");
    } else if (code === "SESSION_ALREADY_REVOKED") {
      toast.error("La sesión ya fue cerrada.");
    } else if (code === "TRUST_WAITING_PERIOD_NOT_MET") {
      if (trustAvailableAt) {
        toast.error(`Debes esperar hasta ${formatSessionDate(String(trustAvailableAt))} para confiar este dispositivo.`);
      } else {
        toast.error("Aún no puedes confiar este dispositivo.");
      }
    } else if (code === "INVALID_SESSION_ID") {
      toast.error("Sesión inválida.");
    } else {
      toast.error(fallbackMessage);
    }
  };

  const revokeMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess(_data, variables: string) {
      const session = sessions.find((s) => s.id === variables);
      if (session?.isCurrent) {
        toast.info("La sesión actual no se cierra desde este panel.");
        void refetchSessions();
      } else {
        toast.success("Sesión cerrada correctamente.");
        queryClient.setQueryData<ProfileSession[]>(["profile-sessions"], (old) =>
          old ? old.filter((sessionItem) => sessionItem.id !== variables) : old,
        );
        void refetchSessions();
        void queryClient.invalidateQueries({ queryKey: ["profile-sessions"] });
        void queryClient.invalidateQueries({ queryKey: ["profile", "current"] });
      }
    },
    onError(error: unknown, variables: string) {
      const session = sessions.find((s) => s.id === variables);
      handleSessionError(error, "No se pudo cerrar la sesión. Inténtalo nuevamente.", session?.trustAvailableAt);
    },
  });

  const revokeOtherMutation = useMutation({
    mutationFn: revokeOtherSessions,
    onSuccess(result) {
      if (typeof result.revokedCount === "number") {
        toast.success(`Se cerraron ${result.revokedCount} sesiones.`);
      } else {
        toast.success("Se cerraron las otras sesiones activas.");
      }
      queryClient.setQueryData<ProfileSession[]>(["profile-sessions"], (old) =>
        old ? old.filter((sessionItem) => sessionItem.isCurrent) : old,
      );
      void refetchSessions();
      void queryClient.invalidateQueries({ queryKey: ["profile-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["profile", "current"] });
    },
    onError(error: unknown) {
      handleSessionError(error, "No se pudieron cerrar las otras sesiones. Inténtalo nuevamente.");
    },
  });

  const trustMutation = useMutation({
    mutationFn: trustSession,
    onSuccess() {
      toast.success("Sesión marcada como confiable.");
      void refetchSessions();
      void queryClient.invalidateQueries({ queryKey: ["profile-sessions"] });
    },
    onError(error: unknown, variables: string) {
      const session = sessions.find((s) => s.id === variables);
      handleSessionError(error, "No se pudo completar la acción. Inténtalo nuevamente.", session?.trustAvailableAt);
    },
  });

  const isActionPending =
    isPending ||
    isSessionsLoading ||
    revokeMutation.isPending ||
    revokeOtherMutation.isPending ||
    trustMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = useWatch({ control, name: "newPassword" }) ?? "";

  const requirements = [
    { label: "Mínimo 8 caracteres", met: newPasswordValue.length >= 8 },
    { label: "Una letra mayúscula", met: /[A-Z]/.test(newPasswordValue) },
    { label: "Una letra minúscula", met: /[a-z]/.test(newPasswordValue) },
    { label: "Al menos un número", met: /[0-9]/.test(newPasswordValue) },
    { label: "Un símbolo especial (ej. @, #, $)", met: /[^A-Za-z0-9]/.test(newPasswordValue) },
  ];

  const onSubmitForm = async (data: ChangePasswordFormValues) => {
    // confirmPassword lives only in the form — workspace handler strips it before the API call
    await onChangePassword(data);
    reset();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">
      {/* Left column: password form + active sessions */}
      <div className="lg:col-span-2 flex flex-col gap-6 w-full">
        {/* Password-change required alert */}
        {passwordChangeRequired === true && (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-500">Cambio de contraseña obligatorio</p>
              <p className="text-xs text-foreground/80 mt-0.5">
                El administrador requiere que actualices tu contraseña antes de continuar.
              </p>
            </div>
          </div>
        )}

        <ProfileSectionCard
          title="Cambiar Contraseña"
          description="Actualiza tus credenciales de acceso para mantener la cuenta segura."
          icon={<Key className="size-5" />}
        >
          <form onSubmit={handleSubmit(onSubmitForm)} className="grid gap-5">
            <FieldFrame label="Contraseña Actual" error={errors.currentPassword?.message}>
              <Input type="password" {...register("currentPassword")} disabled={isPending} />
            </FieldFrame>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldFrame label="Nueva Contraseña" error={errors.newPassword?.message}>
                <Input type="password" {...register("newPassword")} disabled={isPending} />
              </FieldFrame>

              <FieldFrame label="Confirmar Nueva Contraseña" error={errors.confirmPassword?.message}>
                <Input type="password" {...register("confirmPassword")} disabled={isPending} />
              </FieldFrame>
            </div>

            {/* Checklist visual of requirements */}
            <div className="p-4 bg-muted border border-border rounded-xl">
              <span className="text-xs font-bold text-muted-foreground block mb-2">Requisitos de la nueva contraseña:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {requirements.map((req, idx) => (
                  <div key={req.label || idx} className="flex items-center gap-2 text-xs">
                    {req.met ? (
                      <Check className="size-4 text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 rounded-full p-0.5 shrink-0" />
                    ) : (
                      <X className="size-4 text-muted-foreground bg-border rounded-full p-0.5 shrink-0" />
                    )}
                    <span className={req.met ? "text-emerald-600 dark:text-emerald-500 font-semibold" : "text-muted-foreground"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl h-10 px-5 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Actualizar Contraseña
              </Button>
            </div>
          </form>
        </ProfileSectionCard>

        {/* ══════════════════════════════════════════════════════════════════════
            Sessions card — REDESIGNED
           ══════════════════════════════════════════════════════════════════════ */}
        <ProfileSectionCard
          title="Dispositivos y sesiones activas"
          description="Administra los dispositivos donde tu cuenta tiene sesión iniciada."
          icon={<Monitor className="size-5" />}
          badge={
            !isSessionsLoading && !isSessionsError && sessions.length > 0 ? (
              <span className="text-xs font-bold text-muted-foreground bg-muted border border-border/60 px-2.5 py-1 rounded-full">
                {devices.length} {devices.length === 1 ? "dispositivo" : "dispositivos"} ({sessions.length} {sessions.length === 1 ? "sesión" : "sesiones"})
              </span>
            ) : undefined
          }
          action={
            sessions.filter((s) => !s.isCurrent).length > 0 ? (
              <Button
                variant="danger"
                disabled={isActionPending}
                onClick={() => {
                  triggerConfirm({
                    title: "Cerrar otras sesiones",
                    description: "Se cerrarán todas las sesiones activas excepto esta. ¿Deseas continuar?",
                    confirmText: "Cerrar otras",
                    variant: "danger",
                    onConfirm: () => revokeOtherMutation.mutate(),
                  });
                }}
                className="h-8 rounded-xl px-3 text-xs gap-1.5 font-bold"
              >
                {revokeOtherMutation.isPending && <Loader2 className="size-3 animate-spin" />}
                Cerrar otras sesiones
              </Button>
            ) : undefined
          }
        >
          {/* ── Statistics Summary Grid ── */}
          {!isSessionsLoading && !isSessionsError && sessions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
              <div className="flex items-center gap-2.5 p-3 bg-muted/40 rounded-xl border border-border/40">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Monitor className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">Total</span>
                  <span className="text-base font-bold text-foreground block mt-0.5">{stats.total}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">Confiables</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">{stats.trusted}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <ShieldAlert className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">No confiables</span>
                  <span className="text-base font-bold text-amber-600 dark:text-amber-400 block mt-0.5">{stats.untrusted}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-teal-500/5 rounded-xl border border-teal-500/10">
                <div className="flex size-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                  <Check className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">Actual</span>
                  <span className="text-sm font-bold text-teal-600 dark:text-teal-400 block mt-0.5 truncate">
                    {stats.current > 0 ? "Activo" : "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Filters Tabs ── */}
          {!isSessionsLoading && !isSessionsError && sessions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border/40 pb-3 mb-4">
              {(["all", "trusted", "untrusted", "current"] as const).map((tab) => {
                const tabLabels: Record<string, string> = {
                  all: "Todas",
                  trusted: "Confiables",
                  untrusted: "No confiables",
                  current: "Sesión Actual",
                };
                const count =
                  tab === "all"
                    ? devices.length
                    : tab === "trusted"
                    ? stats.trusted
                    : tab === "untrusted"
                    ? stats.untrusted
                    : stats.current;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tabLabels[tab]}
                    <span
                      className={cn(
                        "inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] rounded-full font-bold min-w-[18px]",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-border text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {isSessionsLoading ? (
            <div className="flex flex-col gap-3 py-6">
              <div className="h-32 w-full animate-pulse rounded-2xl bg-muted" />
              <div className="h-32 w-full animate-pulse rounded-2xl bg-muted" />
            </div>
          ) : isSessionsError ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl border border-border bg-card shadow-sm animate-[dashboard-rise_300ms_ease-out]">
              <AppLottie
                src={feedbackAnimations.error500}
                className="h-28 w-28 mb-3"
                ariaLabel="Error al cargar sesiones"
              />
              <h3 className="text-sm font-bold text-foreground">
                Error al cargar las sesiones
              </h3>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Hubo un problema al contactar con el servidor. Por favor, vuelve a intentarlo.
              </p>
              <Button
                variant="secondary"
                onClick={() => refetchSessions()}
                className="mt-4 h-8 px-4 text-xs rounded-xl border border-border hover:border-primary"
              >
                Reintentar
              </Button>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl border border-border bg-card shadow-sm animate-[dashboard-rise_300ms_ease-out]">
              <AppLottie
                src={feedbackAnimations.empty}
                className="h-28 w-28 mb-3"
                ariaLabel="No hay dispositivos"
              />
              <h3 className="text-sm font-bold text-foreground">
                No se encontraron dispositivos
              </h3>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {activeTab === "all"
                  ? "No hay dispositivos o sesiones activas registradas en tu cuenta."
                  : "No hay dispositivos que coincidan con el filtro seleccionado."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Device Cards */}
              <div className="flex flex-col gap-4 max-h-[620px] overflow-y-auto pr-1">
                {paginatedDevices.map((device, devIdx) => {
                  const deviceLabel = device.deviceName;
                  const DeviceIcon = getDeviceIcon(device.deviceType);
                  const isCurrent = device.isCurrent;
                  const isTrusted = device.isTrusted;
                  const isLegacy = device.isLegacy;
                  
                  // Find session for trust button action
                  const trustSessionItem = device.sessions.find((s) => s.canTrust === true && !s.isTrusted);
                  const canTrustDevice = device.canTrust && trustSessionItem;
                  const trustAvailableAt = device.trustAvailableAt;

                  const deviceSummary = `${device.browser} · ${device.os} · ${getDeviceTypeLabelEs(device.deviceType)}`;

                  return (
                    <div
                      key={device.deviceId || `dev-idx-${devIdx}`}
                      className={cn(
                        "group flex flex-col gap-4 p-5 rounded-2xl border transition-all duration-200",
                        isCurrent
                          ? "bg-teal-500/[0.03] border-teal-500/20 shadow-sm ring-1 ring-teal-500/10"
                          : "bg-card border-border/50 hover:border-border hover:shadow-sm"
                      )}
                    >
                      {/* Top: Icon + Title + Badges + Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Device Icon — large */}
                          <div
                            className={cn(
                              "flex size-12 shrink-0 items-center justify-center rounded-2xl border-2",
                              isCurrent
                                ? "bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400"
                                : isTrusted
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted border-border text-muted-foreground"
                            )}
                          >
                            <DeviceIcon className="size-6" />
                          </div>

                          {/* Device Info */}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-card-foreground leading-snug truncate">
                              {deviceLabel}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {deviceSummary}
                            </p>

                            {/* Badges row */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {isCurrent && (
                                <Badge className="border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400 hover:bg-teal-500/15 gap-1">
                                  <Check className="size-3" />
                                  Sesión actual
                                </Badge>
                              )}
                              {isTrusted ? (
                                <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15 gap-1">
                                  <ShieldCheck className="size-3" />
                                  Dispositivo confiable
                                </Badge>
                              ) : (
                                <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 gap-1">
                                  <ShieldAlert className="size-3" />
                                  No confiable
                                </Badge>
                              )}
                              {isLegacy && (
                                <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 gap-1">
                                  Sesión antigua
                                </Badge>
                              )}
                              {!canTrustDevice && !isTrusted && trustAvailableAt && (
                                <Badge className="border-border bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
                                  <Clock className="size-3" />
                                  Confianza no disponible
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions on Device Level */}
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                          {/* Trust Button */}
                          {canTrustDevice && trustSessionItem && (
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={isActionPending}
                              onClick={() => {
                                trustMutation.mutate(trustSessionItem.id);
                              }}
                              className={cn(
                                "h-8 rounded-xl px-3 text-xs gap-1.5 font-bold border-border/60",
                                "hover:border-emerald-500 hover:bg-emerald-500/5 hover:text-emerald-700 dark:hover:text-emerald-400"
                              )}
                            >
                              {trustMutation.isPending && trustMutation.variables === trustSessionItem.id && (
                                <Loader2 className="size-3 animate-spin" />
                              )}
                              <ShieldCheck className="size-3.5" />
                              Confiar en este dispositivo
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Display trustAvailableAt warning message if applicable */}
                      {!isTrusted && !canTrustDevice && trustAvailableAt && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/5 px-3 py-2 rounded-lg border border-amber-500/10 sm:ml-[60px]">
                          <Clock className="size-3 shrink-0" />
                          <span>
                            Confianza disponible a partir de: {formatTrustAvailableAt(trustAvailableAt)}
                          </span>
                        </div>
                      )}

                      {/* Sessions List within Device */}
                      <div className="flex flex-col gap-2 pl-0 sm:pl-[60px]">
                        <span className="text-xs font-bold text-muted-foreground mb-1 block">
                          Sesiones activas ({device.sessions.length}):
                        </span>
                        
                        <div className="flex flex-col gap-2 border border-border/30 rounded-xl overflow-hidden bg-muted/20">
                          {device.sessions.map((session) => {
                            const ip = getSafeIp(session);
                            const safeLocation = getSafeLocation(session);
                            const location = safeLocation.toLowerCase().includes("desconoc")
                              ? "Ubicación no disponible"
                              : safeLocation;
                            const lastActivity = getRelativeTimeLabel(session.lastActivityAt, "Sin actividad registrada");
                            const expiration = formatDateTime(session.expiresAt, "Sin fecha de expiración");
                            const isSessCurrent = session.isCurrent;

                            return (
                              <div
                                key={session.id}
                                className={cn(
                                  "flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2.5 border-b border-border/20 last:border-b-0",
                                  isSessCurrent ? "bg-teal-500/[0.02]" : ""
                                )}
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 flex-1 min-w-0 text-[11px]">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Wifi className="size-3 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground shrink-0">IP:</span>
                                    <span className="font-medium text-foreground truncate">{ip}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 truncate">
                                    <MapPin className="size-3 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground shrink-0">Ubicación:</span>
                                    <span className="font-medium text-foreground truncate">{location}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Clock className="size-3 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground shrink-0">Última act.:</span>
                                    <span className="font-medium text-foreground truncate">{lastActivity}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 truncate col-span-1 sm:col-span-2 lg:col-span-3">
                                    <Clock className="size-3 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground shrink-0">Expira:</span>
                                    <span className="font-medium text-foreground truncate">{expiration}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 justify-end self-end sm:self-center">
                                  {isSessCurrent ? (
                                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                                      Actual
                                    </span>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      disabled={isActionPending}
                                      onClick={() => {
                                        triggerConfirm({
                                          title: "Cerrar sesión activa",
                                          description: `¿Estás seguro de que deseas cerrar la sesión activa de ${deviceLabel} con IP ${ip}?`,
                                          confirmText: "Cerrar sesión",
                                          variant: "danger",
                                          onConfirm: () => revokeMutation.mutate(session.id),
                                        });
                                      }}
                                      className="size-7 rounded-lg p-0 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors border border-border/20"
                                      aria-label="Cerrar sesión"
                                    >
                                      {revokeMutation.isPending && revokeMutation.variables === session.id ? (
                                        <Loader2 className="size-3 animate-spin" />
                                      ) : (
                                        <LogOut className="size-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Trusted details at Device level */}
                      {isTrusted && (
                        <div className="flex flex-col gap-1 pl-0 sm:pl-[60px] text-[10px] text-muted-foreground mt-1">
                          {device.sessions.some((s) => s.trustedAt) && (
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="size-3 text-emerald-500" />
                              <span className="font-medium">
                                Confiado desde: {formatDateTime(device.sessions.find((s) => s.trustedAt)?.trustedAt ?? null, "")}
                              </span>
                            </div>
                          )}
                          {device.sessions.some((s) => s.trustExpiresAt) && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="size-3 text-amber-500" />
                              <span className="font-medium">
                                Expiración de confianza: {formatDateTime(device.sessions.find((s) => s.trustExpiresAt)?.trustExpiresAt ?? null, "Sin fecha de expiración")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Pagination controls ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-2">
                  <span className="text-xs text-muted-foreground">
                    Mostrando del <strong>{((currentPageGuarded - 1) * ITEMS_PER_PAGE) + 1}</strong> al{" "}
                    <strong>{Math.min(currentPageGuarded * ITEMS_PER_PAGE, filteredDevices.length)}</strong> de{" "}
                    <strong>{filteredDevices.length}</strong> dispositivos
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      disabled={currentPageGuarded === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-8 w-8 rounded-xl p-0 flex items-center justify-center border-border/60"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    
                    <span className="text-xs font-bold px-2 text-foreground">
                      {currentPageGuarded} / {totalPages}
                    </span>
                    
                    <Button
                      variant="secondary"
                      disabled={currentPageGuarded === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-8 w-8 rounded-xl p-0 flex items-center justify-center border-border/60"
                      aria-label="Página siguiente"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </ProfileSectionCard>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Right column: Seguridad de Acceso — REDESIGNED
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-6 w-full">
        <ProfileSectionCard
          title="Seguridad de Acceso"
          description="Información de acceso y estado de la sesión."
          icon={<Shield className="size-5" />}
        >
          <div className="flex flex-col gap-3.5 text-sm">
            {/* Email verified */}
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground font-semibold">Correo Verificado</span>
              {isEmailVerified === null ? (
                <span className="text-xs text-muted-foreground/60 italic">No registrado</span>
              ) : (
                <span
                  className={`font-bold text-xs px-2.5 py-0.5 rounded-full ${
                    isEmailVerified
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {isEmailVerified ? "Verificado" : "Pendiente"}
                </span>
              )}
            </div>

            {/* Password change required */}
            <div className="flex items-center justify-between py-1 border-t border-border/30">
              <span className="text-muted-foreground font-semibold">Cambio de Contraseña</span>
              {passwordChangeRequired === null ? (
                <span className="text-xs text-muted-foreground/60 italic">No registrado</span>
              ) : (
                <span
                  className={`font-bold text-xs px-2.5 py-0.5 rounded-full ${
                    passwordChangeRequired
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {passwordChangeRequired ? "Requerido" : "No requerido"}
                </span>
              )}
            </div>

            {/* Active sessions — from real sessions array */}
            <div className="flex flex-col gap-2.5 py-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">Dispositivos activos</span>
                {isSessionsLoading ? (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <span className="font-bold text-foreground">
                    {devices.length} {devices.length === 1 ? "dispositivo" : "dispositivos"}
                  </span>
                )}
              </div>

              {/* Mini device list */}
              {!isSessionsLoading && devices.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-0.5">
                  {devices.slice(0, 2).map((d, index) => {
                    const miniDeviceName = d.deviceName;
                    const miniBrowser = d.browser;
                    const miniOs = d.os;
                    const MiniIcon = getDeviceIcon(d.deviceType);
                    return (
                      <div key={d.deviceId || index} className="flex items-center gap-2.5 p-2 bg-muted/40 rounded-lg border border-border/30">
                        <div
                          className={cn(
                            "flex size-7 items-center justify-center rounded-lg shrink-0",
                            d.isCurrent
                              ? "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <MiniIcon className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-card-foreground block truncate leading-tight">
                            {miniDeviceName}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate leading-tight">
                            {miniBrowser} · {miniOs}{d.isCurrent ? " · Actual" : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {devices.length > 2 && (
                    <span className="text-[10px] text-muted-foreground font-medium pl-1">
                      + {devices.length - 2} {devices.length - 2 === 1 ? "dispositivo más" : "dispositivos más"}
                    </span>
                  )}
                </div>
              )}
              {!isSessionsLoading && devices.length === 0 && (
                <span className="text-[11px] text-muted-foreground/60 italic">
                  No hay dispositivos activos registrados
                </span>
              )}
            </div>

            {/* Failed login attempts */}
            <div className="flex items-center justify-between py-1 border-t border-border/30">
              <span className="text-muted-foreground font-semibold">Intentos Fallidos</span>
              {failedLoginAttempts === null ? (
                <span className="text-xs text-muted-foreground/60 italic">No registrado</span>
              ) : (
                <span
                  className={`font-bold text-xs px-2.5 py-0.5 rounded-full ${
                    failedLoginAttempts > 0
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {failedLoginAttempts}
                </span>
              )}
            </div>

            {/* Last access */}
            <div className="flex flex-col gap-1 py-1 border-t border-border/30">
              <span className="text-muted-foreground font-semibold text-xs">Último Acceso</span>
              <span className="font-bold text-foreground text-xs">
                {lastLogin ?? <span className="text-muted-foreground/60 italic font-normal">No registrado</span>}
              </span>
            </div>

            {/* 2FA — coming soon */}
            <div className="flex items-center justify-between py-1 border-t border-border/30">
              <span className="text-muted-foreground font-semibold">Doble Factor (2FA)</span>
              <span className="text-xs font-bold text-muted-foreground/60 bg-muted/60 border border-border/40 px-2 py-0.5 rounded-lg">
                Próximamente
              </span>
            </div>

            {/* Current device card — uses real session data */}
            {(() => {
              const currentSession = sessions.find((s) => s.isCurrent);
              if (!currentSession) return null;
              const currentDeviceName = getSafeDeviceName(currentSession);
              const currentBrowser = getSafeBrowser(currentSession);
              const currentOs = getSafeOs(currentSession);
              return (
                <div className="p-3.5 bg-teal-500/5 border border-teal-500/10 rounded-xl flex items-start gap-2.5 mt-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                    <Monitor className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-bold text-card-foreground truncate">{currentDeviceName}</span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {currentBrowser} · {currentOs} · Sesión actual
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </ProfileSectionCard>

        {/* Security tips */}
        <div className="p-4 bg-muted/40 border border-border/40 rounded-xl flex items-start gap-2.5">
          <ShieldAlert className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Cambia tu contraseña regularmente. Al cambiarla se cerrarán todas las demás sesiones activas por seguridad.
          </p>
        </div>
      </div>

      {/* Custom Confirmation Modal/Card */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full overflow-hidden p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl shrink-0">
                <AlertTriangle className="size-6" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="text-base font-bold text-foreground leading-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/30">
              <Button
                variant="secondary"
                onClick={() => setConfirmModal(null)}
                className="h-9 px-4 rounded-xl text-xs font-bold border-border/60 hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button
                variant={confirmModal.variant === "danger" ? "danger" : "primary"}
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="h-9 px-4 rounded-xl text-xs font-bold"
              >
                {confirmModal.confirmText || "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
