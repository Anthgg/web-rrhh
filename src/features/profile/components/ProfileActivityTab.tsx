"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  History,
  Clock,
  User,
  Shield,
  FileText,
  Activity,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LogIn,
} from "lucide-react";
import type { UserProfile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/api/normalizers/session-normalizer";
import { getProfileActivities } from "@/services/profile.service";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { AppLottie } from "@/components/ui/feedback/AppLottie";
import { getApiErrorMessage } from "@/lib/api/error-handlers";
import { feedbackAnimations } from "@/components/ui/feedback/animation-registry";
import { extractArray } from "@/lib/utils/extract-array";

interface ProfileActivityTabProps {
  user: UserProfile;
}

type ScopeType = "ALL" | "SECURITY" | "PROFILE" | "REPORTS" | "SESSION";

const scopeFilters: { value: ScopeType; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "SECURITY", label: "Seguridad" },
  { value: "PROFILE", label: "Perfil" },
  { value: "REPORTS", label: "Reportes" },
  { value: "SESSION", label: "Sesiones" },
];

function getFriendlyErrorMessage(error: unknown): string {
  const defaultMsg = "No se pudo obtener el historial de actividad. Por favor, vuelve a intentarlo.";
  const rawMessage = getApiErrorMessage(error);
  if (!rawMessage) return defaultMsg;
  
  const rawLower = rawMessage.toLowerCase();
  if (
    rawLower.includes("actor_id") ||
    rawLower.includes("audit_logs") ||
    rawLower.includes("sql") ||
    rawLower.includes("database") ||
    rawLower.includes("relation") ||
    rawLower.includes("select") ||
    rawLower.includes("table") ||
    rawLower.includes("stack") ||
    rawLower.includes("uid") ||
    rawLower.includes("uuid") ||
    rawLower.includes("column")
  ) {
    return defaultMsg;
  }
  return rawMessage;
}

function getActivityIcon(scope: string) {
  const normScope = String(scope).toUpperCase().trim();
  switch (normScope) {
    case "SECURITY":
      return Shield;
    case "PROFILE":
      return User;
    case "REPORTS":
      return FileText;
    case "SESSION":
      return LogIn;
    case "GENERAL":
      return Activity;
    default:
      return Activity;
  }
}

function getScopeBadgeStyles(scope: string): string {
  const normScope = String(scope).toUpperCase().trim();
  switch (normScope) {
    case "SECURITY":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "REPORTS":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "PROFILE":
      return "bg-primary/10 text-primary border-primary/20";
    case "SESSION":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getScopeIconStyles(scope: string): string {
  const normScope = String(scope).toUpperCase().trim();
  switch (normScope) {
    case "SECURITY":
      return "bg-red-500/10 text-red-500";
    case "PROFILE":
      return "bg-blue-500/10 text-blue-500";
    case "REPORTS":
      return "bg-emerald-500/10 text-emerald-500";
    case "SESSION":
      return "bg-slate-500/10 text-slate-500";
    case "GENERAL":
      return "bg-purple-500/10 text-purple-500";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getScopeLabel(scope: string): string {
  const normScope = String(scope).toUpperCase().trim();
  switch (normScope) {
    case "SECURITY":
      return "Seguridad";
    case "PROFILE":
      return "Perfil";
    case "REPORTS":
      return "Reportes";
    case "SESSION":
      return "Sesión";
    case "GENERAL":
      return "General";
    default:
      return scope;
  }
}

function getRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "Sin fecha";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Sin fecha";
    const relative = formatDistanceToNow(d, { locale: es, addSuffix: true });
    return relative.charAt(0).toUpperCase() + relative.slice(1);
  } catch {
    return "Sin fecha";
  }
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export interface ProfileActivity {
  id: string;
  action: string;
  actionLabel: string;
  description: string;
  scope: string;
  module?: string;
  actorName?: string;
  createdAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface GroupedActivities {
  title: string;
  items: ProfileActivity[];
}

function groupActivities(items: GroupedActivities["items"]): GroupedActivities[] {
  const groups: Record<string, typeof items> = {
    Hoy: [],
    Ayer: [],
    "Esta semana": [],
    Anteriores: [],
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgoStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  items.forEach((item) => {
    if (!item.createdAt) {
      groups["Anteriores"].push(item);
      return;
    }
    try {
      const d = new Date(item.createdAt);
      if (isNaN(d.getTime())) {
        groups["Anteriores"].push(item);
        return;
      }

      if (d >= todayStart) {
        groups["Hoy"].push(item);
      } else if (d >= yesterdayStart) {
        groups["Ayer"].push(item);
      } else if (d >= sevenDaysAgoStart) {
        groups["Esta semana"].push(item);
      } else {
        groups["Anteriores"].push(item);
      }
    } catch {
      groups["Anteriores"].push(item);
    }
  });

  return [
    { title: "Hoy", items: groups["Hoy"] },
    { title: "Ayer", items: groups["Ayer"] },
    { title: "Esta semana", items: groups["Esta semana"] },
    { title: "Anteriores", items: groups["Anteriores"] },
  ].filter((g) => g.items.length > 0);
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4 px-6 py-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4 rounded-xl border border-border bg-background/40 p-4 animate-pulse">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
            <div className="h-3.5 w-3/4 rounded bg-muted" />
            <div className="flex gap-4 pt-1">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileActivityTab({ user }: ProfileActivityTabProps) {
  const [activeScope, setActiveScope] = useState<ScopeType>("ALL");
  const [daysFilter, setDaysFilter] = useState<number | undefined>(undefined);
  const [isCustomDays, setIsCustomDays] = useState<boolean>(false);
  const [customDaysVal, setCustomDaysVal] = useState<number | "">("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limit = 20;

  const {
    data: queryData,
    isLoading,
    isFetching,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: ["profile-activities", user.id, activeScope, daysFilter, currentPage, limit],
    queryFn: () => getProfileActivities({ scope: activeScope, days: daysFilter, page: currentPage, limit }),
    staleTime: 30_000,
  });

  const activities = useMemo(() => {
    return extractArray<ProfileActivity>(queryData);
  }, [queryData]);

  const pagination = useMemo(() => {
    if (!queryData) return null;
    const dataObj = queryData as unknown as Record<string, unknown>;
    let pag: Record<string, unknown> | null = null;
    if (dataObj.data && typeof dataObj.data === "object") {
      const data = dataObj.data as Record<string, unknown>;
      if (data.pagination && typeof data.pagination === "object") {
        pag = data.pagination as Record<string, unknown>;
      }
    } else if (dataObj.pagination && typeof dataObj.pagination === "object") {
      pag = dataObj.pagination as Record<string, unknown>;
    }

    if (pag) {
      const page = (pag.page as number) ?? 1;
      const limit = (pag.limit as number) ?? 20;
      const total = (pag.total as number) ?? 0;
      const totalPages = (pag.totalPages as number) ?? Math.ceil(total / limit);
      return {
        page,
        limit,
        total,
        totalPages,
        hasPrevPage: (pag.hasPrevPage as boolean) ?? page > 1,
        hasNextPage: (pag.hasNextPage as boolean) ?? page < totalPages,
      };
    }
    return null;
  }, [queryData]);

  const handleScopeChange = (scope: ScopeType) => {
    setActiveScope(scope);
    setCurrentPage(1);
  };

  const groupedActivities = useMemo(() => {
    return groupActivities(activities);
  }, [activities]);

  const showSkeleton = isLoading || isFetching;

  const getEmptyStateMessage = () => {
    const scopeLabel = activeScope === "ALL" ? "" : ` de tipo ${getScopeLabel(activeScope)}`;
    const daysLabel = daysFilter ? ` en los últimos ${daysFilter} días` : "";
    return `No se encontraron registros de actividades${scopeLabel}${daysLabel}.`;
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-border bg-card shadow-sm text-card-foreground">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Historial de actividad
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Últimas operaciones y accesos registrados en tu cuenta.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="self-start sm:self-center gap-2 rounded-xl h-8 px-3.5 text-xs"
          >
            {isLoading || isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Actualizar
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-6 py-4 border-b border-border bg-muted/20">
          {/* Scope Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {scopeFilters.map((filter) => {
              const isActive = activeScope === filter.value;
              return (
                <Button
                  key={filter.value}
                  variant={isActive ? "secondary" : "ghost"}
                  onClick={() => handleScopeChange(filter.value)}
                  className={`rounded-lg text-xs font-semibold h-8 px-3.5 transition-colors ${
                    isActive
                      ? "bg-secondary text-secondary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {filter.label}
                </Button>
              );
            })}
          </div>

          {/* Days selector and counter */}
          <div className="flex flex-wrap items-center gap-3.5 lg:ml-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium shrink-0">Filtrar por:</span>
              {isCustomDays ? (
                <div className="flex items-center gap-1.5 animate-[dashboard-rise_200ms_ease-out]">
                  <input
                    type="number"
                    aria-label="Cantidad de dias para filtrar actividad"
                    min="1"
                    max="365"
                    value={customDaysVal}
                    onChange={(e) => {
                      const valStr = e.target.value;
                      if (valStr === "") {
                        setCustomDaysVal("");
                        setDaysFilter(undefined);
                      } else {
                        const val = parseInt(valStr, 10);
                        if (val >= 1 && val <= 365) {
                          setCustomDaysVal(val);
                          setDaysFilter(val);
                        } else {
                          setCustomDaysVal(val || "");
                        }
                      }
                      setCurrentPage(1);
                    }}
                    placeholder="1-365 días"
                    className="h-8 w-24 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsCustomDays(false);
                      setDaysFilter(undefined);
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <select
                  value={daysFilter === 1 || daysFilter === 7 || daysFilter === 30 || daysFilter === 90 || daysFilter === 365 || !daysFilter ? (daysFilter ?? "") : "custom"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "custom") {
                      setIsCustomDays(true);
                      setCustomDaysVal("");
                      setDaysFilter(undefined);
                    } else {
                      setDaysFilter(val ? parseInt(val, 10) : undefined);
                    }
                    setCurrentPage(1);
                  }}
                  className="h-8 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Cualquier fecha</option>
                  <option value="1">Hoy</option>
                  <option value="7">Últimos 7 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 90 días</option>
                  <option value="365">Últimos 365 días</option>
                  <option value="custom">Personalizado...</option>
                </select>
              )}
            </div>

            {/* Filter Counter */}
            {!showSkeleton && !isError && pagination && pagination.total > 0 && (
              <span className="text-xs font-medium text-muted-foreground bg-muted border border-border/40 px-2.5 py-0.5 rounded-full">
                {pagination.total} {pagination.total === 1 ? "evento" : "eventos"}
              </span>
            )}
          </div>
        </div>

        {/* List Content */}
        {showSkeleton ? (
          <ActivitySkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center animate-[dashboard-rise_300ms_ease-out]">
            <AppLottie
              src={feedbackAnimations.error500}
              className="h-28 w-28 mb-3"
              ariaLabel="Error al cargar actividad"
            />
            <h3 className="text-sm font-bold text-foreground">
              Error al cargar el historial
            </h3>
            <p className="mt-1.5 max-w-xs text-xs sm:text-sm text-muted-foreground">
              {getFriendlyErrorMessage(error)}
            </p>
            <Button
              variant="secondary"
              onClick={() => refetch()}
              className="mt-4 h-8 px-4 text-xs rounded-xl border border-border hover:border-primary"
            >
              Reintentar
            </Button>
          </div>
        ) : activities.length > 0 ? (
          <div className="max-h-[620px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {groupedActivities.map((group) => (
              <div key={group.title} className="px-6 py-4 border-b border-border/30 last:border-0">
                <h4 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 pl-1">
                  {group.title}
                </h4>

                <div className="space-y-3">
                  {group.items.map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.scope);
                    const createdAt = activity.createdAt ?? null;
                    const dateStr = formatDateTime(createdAt);
                    const timeStr = formatTime(createdAt);
                    const relativeTime = getRelativeTime(createdAt);
                    const badgeColor = getScopeBadgeStyles(activity.scope);
                    const iconColor = getScopeIconStyles(activity.scope);

                    return (
                      <div
                        key={activity.id}
                        className="group flex gap-4 rounded-xl border border-border/50 bg-background/40 p-4 transition-all duration-200 hover:bg-accent/30 hover:border-border"
                      >
                        {/* Icon */}
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${iconColor}`}>
                          <ActivityIcon className="h-4.5 w-4.5" />
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-foreground leading-none">
                                {activity.actionLabel || activity.action}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold px-2 py-0 h-4.5 rounded-full border ${badgeColor}`}
                              >
                                {getScopeLabel(activity.scope)}
                              </Badge>
                            </div>

                            <span className="text-[11px] text-muted-foreground font-medium sm:text-right" title={dateStr}>
                              {timeStr ? `${timeStr} · ` : ""}{dateStr.split(",")[0]}
                            </span>
                          </div>

                          {activity.description && (
                            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground/90 font-medium leading-relaxed">
                              {activity.description}
                            </p>
                          )}

                          {/* Metadata grid */}
                          <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground/85 border-t border-border/20 pt-2.5">
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground/60" />
                              <span className="font-semibold">{activity.actorName?.trim() || "Sistema"}</span>
                            </span>

                            {activity.action && (
                              <span className="flex items-center gap-1.5 max-w-[200px] sm:max-w-xs truncate">
                                <Shield className="h-3.5 w-3.5 text-muted-foreground/60" />
                                <code className="text-[10px] font-mono bg-muted/80 px-1.5 py-0.5 rounded border border-border/30">
                                  {activity.action}
                                </code>
                              </span>
                            )}

                            {activity.ipAddress && (
                              <span className="flex items-center gap-1.5">
                                <span className="font-medium text-muted-foreground/60">IP:</span>
                                <span className="font-semibold">{activity.ipAddress}</span>
                              </span>
                            )}

                            {activity.userAgent && (
                              <span className="flex items-center gap-1.5 max-w-[200px] truncate" title={activity.userAgent}>
                                <span className="font-medium text-muted-foreground/60">Disp:</span>
                                <span className="font-semibold truncate">{activity.userAgent}</span>
                              </span>
                            )}

                            <span className="flex items-center gap-1.5 ml-auto">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                              <span className="font-semibold">{relativeTime}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center animate-[dashboard-rise_300ms_ease-out]">
            <AppLottie
              src={feedbackAnimations.empty}
              className="h-28 w-28 mb-3"
              ariaLabel="Sin información disponible"
            />
            <h3 className="text-sm font-bold text-foreground">
              No hay actividad registrada
            </h3>
            <p className="mt-1 max-w-xs text-xs sm:text-sm text-muted-foreground">
              {getEmptyStateMessage()}
            </p>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border px-6 py-4 bg-muted/10">
            <div className="text-xs text-muted-foreground text-center sm:text-left">
              Mostrando <span className="font-semibold text-foreground">{activities.length}</span> de{" "}
              <span className="font-semibold text-foreground">{pagination.total}</span> {pagination.total === 1 ? "evento" : "eventos"}
              {pagination.totalPages > 1 && (
                <>
                  {" "}· Página <span className="font-semibold text-foreground">{pagination.page}</span> de{" "}
                  <span className="font-semibold text-foreground">{pagination.totalPages}</span>
                </>
              )}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={!pagination.hasPrevPage || isLoading || isFetching}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="h-8 px-3 text-xs rounded-xl gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  disabled={!pagination.hasNextPage || isLoading || isFetching}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                  className="h-8 px-3 text-xs rounded-xl gap-1"
                >
                  Siguiente
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
