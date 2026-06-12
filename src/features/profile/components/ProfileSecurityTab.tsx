"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
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
  Smartphone,
  Tablet,
  Laptop,
  ShieldCheck,
  Trash2,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FieldFrame, Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import type { ChangePasswordFormValues, UserProfile, ProfileSession } from "@/types";
import { useSession } from "@/features/auth/auth-provider";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActiveSessions,
  revokeSession,
  revokeOtherSessions,
  trustSession,
} from "@/services/profile.service";
import { getApiErrorCode, getApiErrorDetails } from "@/lib/api/error-handlers";
import { parseDeviceInfo } from "@/lib/security/device-parser";
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

interface ProfileSecurityTabProps {
  user: UserProfile;
  /** Called with only currentPassword + newPassword — confirmPassword is stripped by workspace */
  onChangePassword: (values: ChangePasswordFormValues) => Promise<void>;
  isPending: boolean;
}

function getDeviceIcon(deviceType?: string | null) {
  const type = String(deviceType ?? "").toLowerCase();
  if (type.includes("mobile") || type.includes("phone") || type.includes("móvil") || type.includes("movil") || type.includes("smartphone")) {
    return Smartphone;
  }
  if (type.includes("tablet") || type.includes("ipad")) {
    return Tablet;
  }
  if (type.includes("laptop") || type.includes("notebook")) {
    return Laptop;
  }
  return Monitor;
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

const cleanField = (val?: string | null) => {
  if (!val) return null;
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower === "desconocido" ||
    lower === "unknown" ||
    lower === "sistema" ||
    lower === "navegador" ||
    lower === "null" ||
    lower === "undefined" ||
    /^[0-9a-fA-F-]{36}$/.test(trimmed)
  ) {
    return null;
  }
  return trimmed;
};

const buildDeviceName = (os?: string | null, browser?: string | null): string | null => {
  const cleanOS = cleanField(os);
  const cleanBrowser = cleanField(browser);
  if (cleanOS && cleanBrowser) {
    return `${cleanOS} · ${cleanBrowser}`;
  }
  return cleanOS || cleanBrowser || null;
};

const formatDeviceType = (deviceType?: string | null) => {
  const type = cleanField(deviceType)?.toLowerCase();
  if (!type) return "Dispositivo";
  if (type.includes("mobile") || type.includes("phone") || type.includes("movil") || type.includes("móvil")) return "Móvil";
  if (type.includes("tablet")) return "Tablet";
  if (type.includes("laptop") || type.includes("notebook")) return "Laptop";
  if (type.includes("desktop")) return "Desktop";
  return cleanField(deviceType) ?? "Dispositivo";
};

const getLocationLabel = (session: ProfileSession) => {
  return (
    cleanField(session.location) ||
    [cleanField(session.city), cleanField(session.country)].filter(Boolean).join(", ") ||
    "Ubicación no disponible"
  );
};

export function ProfileSecurityTab({ user, onChangePassword, isPending }: ProfileSecurityTabProps) {
  const queryClient = useQueryClient();
  const { logout } = useSession();

  // Real values from backend — no hardcoded fallbacks
  const lastLogin = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleString("es-PE", { timeZone: "America/Lima" })
    : null;

  const activeSessions = user.security?.active_sessions ?? null;
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

  // Calculate statistics
  const stats = useMemo(() => {
    const total = sessions.length;
    const current = sessions.filter((s) => s.isCurrent).length;
    const trusted = sessions.filter((s) => s.isTrusted).length;
    const untrusted = total - trusted;
    return { total, current, trusted, untrusted };
  }, [sessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (activeTab === "trusted") return s.isTrusted;
      if (activeTab === "untrusted") return !s.isTrusted;
      if (activeTab === "current") return s.isCurrent;
      return true;
    });
  }, [sessions, activeTab]);

  // Paginate sessions
  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / ITEMS_PER_PAGE));
  const currentPageGuarded = Math.min(currentPage, totalPages);

  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPageGuarded - 1) * ITEMS_PER_PAGE;
    return filteredSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSessions, currentPageGuarded]);

  // Centralized session error handler
  const handleSessionError = (error: unknown, fallbackMessage: string, sessionTrustAvailableAt?: string | null) => {
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
        toast.success("Sesión actual cerrada. Redirigiendo...");
        void logout();
      } else {
        toast.success("Sesión cerrada correctamente.");
        queryClient.setQueryData<ProfileSession[]>(["profile-sessions"], (old) =>
          old ? old.filter((sessionItem) => sessionItem.id !== variables) : old,
        );
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
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = watch("newPassword", "");

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

        {/* Sessions card */}
        <ProfileSectionCard
          title="Dispositivos y Sesiones Activas"
          description="Gestione los navegadores y dispositivos que tienen acceso a su cuenta."
          icon={<Monitor className="size-5" />}
          badge={
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 bg-muted/30 rounded-xl border border-border/40 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Total Sesiones
                </span>
                <span className="text-lg font-bold text-foreground mt-1 block">
                  {stats.total}
                </span>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/40 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Confiables
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1 block">
                  {stats.trusted}
                </span>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/40 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  No Confiables
                </span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                  {stats.untrusted}
                </span>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/40 text-center flex flex-col justify-center items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Dispositivo Actual
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block truncate max-w-full">
                  Activo
                </span>
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
                    ? sessions.length
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
                        "inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] rounded-full font-bold",
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
              <div className="h-14 w-full animate-pulse rounded-2xl bg-muted" />
              <div className="h-14 w-full animate-pulse rounded-2xl bg-muted" />
            </div>
          ) : isSessionsError ? (
            <div className="text-center py-6 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-2xl">
              No se pudieron cargar las sesiones activas.
              <Button variant="ghost" onClick={() => refetchSessions()} className="ml-2 h-8 px-3 text-xs font-semibold rounded-xl">
                Reintentar
              </Button>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 border border-border/40 rounded-2xl">
              {activeTab === "all"
                ? "No hay sesiones activas registradas."
                : "No hay sesiones que coincidan con este filtro."}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Scrollable Container with Max Height */}
              <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                {paginatedSessions.map((session) => {
                  const backendBrowser = cleanField(session.browser);
                  const backendOS = cleanField(session.os);
                  const backendDeviceType = cleanField(session.deviceType);
                  const shouldParseUserAgent = !backendBrowser || !backendOS || !backendDeviceType;
                  const parsedFromUserAgent = shouldParseUserAgent ? parseDeviceInfo(session.userAgent) : null;

                  const resolvedBrowser = backendBrowser ?? parsedFromUserAgent?.browser ?? null;
                  const resolvedOS = backendOS ?? parsedFromUserAgent?.os ?? null;
                  const resolvedDeviceType = backendDeviceType ?? parsedFromUserAgent?.deviceType ?? "unknown";
                  const resolvedDeviceName =
                    cleanField(session.deviceName) ??
                    buildDeviceName(resolvedOS, resolvedBrowser) ??
                    "Dispositivo no identificado";

                  const DeviceIcon = getDeviceIcon(resolvedDeviceType);
                  const isCurrent = session.isCurrent;
                  const isTrusted = session.isTrusted;
                  const canTrust = session.canTrust;
                  const trustAvailableAt = session.trustAvailableAt;

                  const deviceSummary = [formatDeviceType(resolvedDeviceType), resolvedOS, resolvedBrowser].filter(Boolean).join(" · ");
                  const ip = cleanField(session.ipAddress) ?? "IP no disponible";
                  const location = getLocationLabel(session);
                  const lastActivity = session.lastActivityAt;
                  const expiration = session.expiresAt;
                  
                  // Truncate UUID for display
                  const shortId = session.id ? `${session.id.slice(0, 8)}...${session.id.slice(-4)}` : "";

                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200",
                        isCurrent
                          ? "bg-primary/5 border-primary/20 shadow-sm"
                          : "bg-card/40 border-border/50 hover:border-border hover:bg-card/75"
                      )}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Device Icon */}
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                            isCurrent
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-muted border-border text-muted-foreground"
                          )}
                        >
                          <DeviceIcon className="size-5" />
                        </div>

                        {/* Session details */}
                        <div className="min-w-0 grid gap-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <h4 className="text-sm font-semibold text-foreground leading-tight">
                              {resolvedDeviceName}
                            </h4>
                            {isCurrent && (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 border border-emerald-500/20">
                                Sesión actual
                              </span>
                            )}
                            {isTrusted ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-500 border border-blue-500/20">
                                <ShieldCheck className="size-3" /> Confiable
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-border">
                                No confiable
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {deviceSummary}
                          </p>

                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {session.id && (
                              <span 
                                title={session.id} 
                                className="cursor-help font-mono text-[11px] bg-muted/60 px-1.5 py-0.2 rounded border border-border/30"
                              >
                                ID: {shortId}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              IP: <strong className="text-foreground font-medium">{ip}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3 text-muted-foreground/60" />
                              Ubicación: <strong className="text-foreground font-medium">{location}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3 text-muted-foreground/60" />
                              Última actividad: <strong className="text-foreground font-medium">{formatSessionDate(lastActivity)}</strong>
                            </span>
                            <span className="text-[11px] text-muted-foreground/80">
                              Expira: {formatSessionDate(expiration)}
                            </span>
                          </div>

                          {/* Confiado desde (Secondary info) */}
                          {isTrusted && session.trustedAt && (
                            <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-0.5 font-medium">
                              <ShieldCheck className="size-3 text-blue-500" />
                              Confiado desde: {formatSessionDate(session.trustedAt)}
                            </p>
                          )}

                          {/* Help text for trust not met */}
                          {!isTrusted && !canTrust && trustAvailableAt && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-500 flex items-center gap-1 mt-0.5 font-medium">
                              <AlertTriangle className="size-3 shrink-0" />
                              Disponible para confiar desde {formatSessionDate(trustAvailableAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 self-end sm:self-center shrink-0">
                        {/* Trust Button */}
                        {!isTrusted && (
                          <Button
                            variant="secondary"
                            disabled={!canTrust || isActionPending}
                            onClick={() => trustMutation.mutate(session.id)}
                            className="h-8 rounded-xl px-3 text-xs gap-1.5 animate-fade-in font-bold border-border/60 hover:border-primary"
                          >
                            {trustMutation.isPending && <Loader2 className="size-3 animate-spin" />}
                            <ShieldCheck className="size-3.5" />
                            Confiar
                          </Button>
                        )}

                        {/* Revoke Button */}
                        <Button
                          variant="ghost"
                          disabled={isActionPending}
                          onClick={() => {
                            triggerConfirm({
                              title: isCurrent ? "Cerrar tu sesión actual" : "Cerrar sesión activa",
                              description: isCurrent
                                ? "Estás a punto de cerrar tu sesión actual. Tendrás que volver a iniciar sesión para continuar. ¿Deseas continuar?"
                                : `¿Estás seguro de que deseas cerrar la sesión activa de ${resolvedDeviceName}?`,
                              confirmText: isCurrent ? "Cerrar y salir" : "Cerrar sesión",
                              variant: "danger",
                              onConfirm: () => revokeMutation.mutate(session.id),
                            });
                          }}
                          className="size-8 rounded-xl p-0 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
                          aria-label="Cerrar sesión"
                        >
                          {revokeMutation.isPending && <Loader2 className="size-3 animate-spin" />}
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Pagination controls ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-2">
                  <span className="text-xs text-muted-foreground">
                    Mostrando del <strong>{((currentPageGuarded - 1) * ITEMS_PER_PAGE) + 1}</strong> al{" "}
                    <strong>{Math.min(currentPageGuarded * ITEMS_PER_PAGE, filteredSessions.length)}</strong> de{" "}
                    <strong>{filteredSessions.length}</strong> sesiones
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

      {/* Right column: security metadata */}
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
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20"
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

            {/* Active sessions */}
            <div className="flex items-center justify-between py-1 border-t border-border/30">
              <span className="text-muted-foreground font-semibold">Sesiones Activas</span>
              {activeSessions === null ? (
                <span className="text-xs text-muted-foreground/60 italic">No registrado</span>
              ) : (
                <span className="font-bold text-foreground">
                  {activeSessions} {activeSessions === 1 ? "dispositivo" : "dispositivos"}
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
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20"
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

            {/* Current device card (clean design) */}
            <div className="p-3.5 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-2.5 mt-2">
              <Monitor className="size-4.5 text-primary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-foreground">Dispositivo Actual</span>
                <span className="text-[11px] text-muted-foreground">Sesión web de administración activa</span>
              </div>
            </div>
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
