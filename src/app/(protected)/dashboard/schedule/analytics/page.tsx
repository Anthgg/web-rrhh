"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  BriefcaseBusiness,
  Building,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Table,
  Timer,
  User,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PageContainer } from "@/components/layout/page-container";
import { useSession } from "@/features/auth/auth-provider";
import { useWorkerAttendanceDetail } from "@/hooks/useAttendanceSummary";
import { attendanceService } from "@/services/attendance.service";
import { areasService } from "@/services/areas.service";
import { departmentsService } from "@/services/departments.service";
import { organizationService } from "@/services/organization.service";
import { workersService } from "@/services/workers.service";
import { workCrewsService } from "@/services/work-crews.service";
import {
  buildAnalyticsParams,
  formatAnalyticsRate,
  getRecordCheckTime,
  getStatusColor,
  normalizeAttendanceStatus,
  STATUS_LABELS,
} from "@/lib/utils/attendance";
import { cn } from "@/lib/utils/cn";
import { extractArray } from "@/lib/utils/extract-array";
import type {
  AttendanceAnalyticsChartItem,
  AttendanceAnalyticsKpis,
  AttendanceAnalyticsRankingItem,
  AttendanceSummary,
} from "@/types/schedule";
import type { WorkerRecord } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  present: "#10b981",
  PRESENT: "#10b981",
  late: "#f59e0b",
  LATE: "#f59e0b",
  absent: "#ef4444",
  ABSENT: "#ef4444",
  vacation: "#3b82f6",
  VACATION: "#3b82f6",
  medical_leave: "#8b5cf6",
  MEDICAL_LEAVE: "#8b5cf6",
  unpaid_leave: "#f97316",
  UNPAID_LEAVE: "#f97316",
  holiday: "#14b8a6",
  HOLIDAY: "#14b8a6",
  rest_day: "#64748b",
  REST_DAY: "#64748b",
  no_schedule: "#94a3b8",
  not_scheduled: "#94a3b8",
  pending: "#a855f7",
  PENDING: "#a855f7",
  incomplete: "#d946ef",
  INCOMPLETE: "#d946ef",
};

const STATUS_FILTERS = [
  { value: "", label: "Todos los estados" },
  { value: "PRESENT", label: "Asistió" },
  { value: "LATE", label: "Tardanza" },
  { value: "ABSENT", label: "Falta" },
  { value: "VACATION", label: "Vacaciones" },
  { value: "MEDICAL_LEAVE", label: "Descanso médico" },
  { value: "UNPAID_LEAVE", label: "Permiso personal" },
  { value: "HOLIDAY", label: "Feriado" },
  { value: "REST_DAY", label: "Día de descanso" },
  { value: "PENDING", label: "Pendiente" },
] as const;

const RANKING_TABS = [
  { key: "workers", label: "Colaboradores", icon: Users },
  { key: "areas", label: "Áreas", icon: Layers },
  { key: "locations", label: "Obras / Sedes", icon: Building },
  { key: "crews", label: "Cuadrillas", icon: BriefcaseBusiness },
] as const;

const CHART_MARGIN = { top: 18, right: 18, left: 0, bottom: 8 };

type RankingTab = (typeof RANKING_TABS)[number]["key"];
type ViewMode = "dashboard" | "table";
type RankingTone = "blue" | "green" | "amber" | "rose" | "purple" | "slate";
type ExtendedRankingItem = AttendanceAnalyticsRankingItem & Record<string, unknown>;

interface FiltersState {
  month: string;
  startDate: string;
  endDate: string;
  workerId: string;
  workerSearch: string;
  areaId: string;
  departmentId: string;
  positionId: string;
  workLocationId: string;
  crewId: string;
  status: string;
  limit: number;
}

interface PeriodRange {
  startDate: string;
  endDate: string;
  label: string;
  month?: string;
}

interface ActiveChip {
  key: keyof FiltersState | "dateRange";
  label: string;
}

interface WorkerRankingContext {
  item: ExtendedRankingItem;
  metricLabel: string;
  metricTone: RankingTone;
  worker?: WorkerRecord;
}

interface AggregateRankingContext {
  item: ExtendedRankingItem;
  title: string;
  subtitle: string;
  metricLabel: string;
  metricTone: RankingTone;
}

interface DirectoryMaps {
  byId: Map<string, WorkerRecord>;
  byName: Map<string, WorkerRecord>;
}

function getDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function getCurrentMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthRange(month: string): PeriodRange {
  const [yearValue, monthValue] = month.split("-").map(Number);
  const year = Number.isFinite(yearValue) ? yearValue : new Date().getFullYear();
  const monthIndex = Number.isFinite(monthValue) ? monthValue - 1 : new Date().getMonth();
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);

  return {
    startDate: getDateString(first),
    endDate: getDateString(last),
    label: first.toLocaleDateString("es-PE", { month: "long", year: "numeric" }),
    month,
  };
}

function resolvePeriod(filters: FiltersState, fallbackMonth: string): PeriodRange {
  if (filters.startDate || filters.endDate) {
    const fallback = getMonthRange(fallbackMonth);
    const startDate = filters.startDate || fallback.startDate;
    const endDate = filters.endDate || startDate;
    return {
      startDate,
      endDate,
      label: `${formatDate(startDate)} - ${formatDate(endDate)}`,
      month: "",
    };
  }

  return getMonthRange(filters.month || fallbackMonth);
}

function formatDate(value?: string | null): string {
  if (!value) return "No informado";
  const onlyDate = value.includes("T") ? value.split("T")[0] : value;
  const [year, month, day] = onlyDate.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatDateTimeStr(value?: string | null): string {
  if (!value) return "No informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLateMinutes(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "0 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getStringField(value: unknown, keys: string[]): string {
  const record = asRecord(value);
  for (const key of keys) {
    const field = record[key];
    if (typeof field === "string" && field.trim()) return field;
    if (typeof field === "number") return String(field);
  }
  return "";
}

function getNumberField(value: unknown, keys: string[]): number | null {
  const record = asRecord(value);
  for (const key of keys) {
    const field = record[key];
    if (typeof field === "number" && Number.isFinite(field)) return field;
    if (typeof field === "string" && field.trim() && Number.isFinite(Number(field))) return Number(field);
  }
  return null;
}

function getOptionId(value: unknown): string {
  return getStringField(value, ["id", "value", "key"]);
}

function getOptionName(value: unknown): string {
  return getStringField(value, ["name", "label", "fullName", "title", "description"]) || "Sin nombre";
}

function getOptionLabel(list: unknown[], id: string): string {
  if (!id) return "";
  const found = list.find((item) => getOptionId(item) === id);
  return found ? getOptionName(found) : id;
}

function getStatusLabel(value: string): string {
  return STATUS_FILTERS.find((status) => status.value === value)?.label || value;
}

function getRankingValueLabel(item: AttendanceAnalyticsRankingItem, suffix: string): string {
  if (suffix === "%") return formatAnalyticsRate(item.value);
  return `${item.value} ${suffix}`;
}

function getWorkerPhoto(worker?: WorkerRecord | null): string | null {
  if (!worker) return null;
  const record = worker as unknown as Record<string, unknown>;
  const userRecord = asRecord(record.user);

  return (
    worker.profilePhotoUrl ||
    getStringField(worker, ["photoUrl"]) ||
    worker.avatarUrl ||
    getStringField(userRecord, ["profilePhotoUrl", "photoUrl", "avatarUrl"]) ||
    null
  );
}

function getWorkerPosition(worker?: WorkerRecord): string {
  return worker?.positionName || worker?.position || "Cargo no informado";
}

function getWorkerArea(worker?: WorkerRecord): string {
  return worker?.areaName || worker?.departmentName || worker?.department || "Área no informada";
}

function getWorkerLocation(worker?: WorkerRecord): string {
  return worker?.workLocationName || worker?.work_location_name || worker?.project || "Obra / sede no informada";
}

function buildWorkerMaps(workers: WorkerRecord[]): DirectoryMaps {
  const byId = new Map<string, WorkerRecord>();
  const byName = new Map<string, WorkerRecord>();

  for (const worker of workers) {
    if (worker.id) byId.set(worker.id, worker);
    const alternativeId = worker.workerId || worker.worker_id || worker.userId || worker.user_id || "";
    if (alternativeId) byId.set(alternativeId, worker);
    if (worker.fullName) byName.set(normalizeName(worker.fullName), worker);
  }

  return { byId, byName };
}

function resolveWorker(item: ExtendedRankingItem, maps: DirectoryMaps): WorkerRecord | undefined {
  const possibleId = getStringField(item, [
    "workerId",
    "worker_id",
    "workerUuid",
    "id",
    "userId",
    "user_id",
  ]);
  if (possibleId && maps.byId.has(possibleId)) return maps.byId.get(possibleId);

  const possibleName = item.label ? normalizeName(item.label) : "";
  return possibleName ? maps.byName.get(possibleName) : undefined;
}

function hasChartData(data: AttendanceAnalyticsChartItem[] | undefined, keys: string[]) {
  if (!data?.length) return false;
  return data.some((item) =>
    keys.some((key) => {
      const value = item[key] ?? item.value;
      return typeof value === "number" && value > 0;
    }),
  );
}

function buildGroupedChartData(data: AttendanceAnalyticsChartItem[] | undefined, labelKeys: string[]) {
  return (data ?? []).map((item) => {
    const label = getStringField(item, labelKeys) || item.label || item.key || "Sin nombre";
    return {
      label,
      presentCount: Number(item.presentCount ?? item.value ?? 0),
      lateCount: Number(item.lateCount ?? 0),
      absentCount: Number(item.absentCount ?? 0),
    };
  });
}

function exportCsv(fileName: string, rows: Array<Record<string, string | number>>) {
  if (!rows.length) {
    toast.info("No hay datos para exportar.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const escapeCell = (cell: string | number) => {
    const text = String(cell ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const csv = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header] ?? "")).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function buildAnalyticsExportRows(
  kpis: AttendanceAnalyticsKpis,
  period: PeriodRange,
): Array<Record<string, string | number>> {
  return [
    { seccion: "Periodo", metrica: "Inicio", valor: period.startDate },
    { seccion: "Periodo", metrica: "Fin", valor: period.endDate },
    { seccion: "KPI", metrica: "Total trabajadores", valor: kpis.totalWorkers },
    { seccion: "KPI", metrica: "Asistencias", valor: kpis.presentCount },
    { seccion: "KPI", metrica: "Faltas", valor: kpis.absentCount },
    { seccion: "KPI", metrica: "Tardanzas", valor: kpis.lateCount },
    { seccion: "KPI", metrica: "Vacaciones", valor: kpis.vacationCount },
    { seccion: "KPI", metrica: "Descansos médicos", valor: kpis.medicalLeaveCount },
    { seccion: "KPI", metrica: "Permisos personales", valor: kpis.unpaidLeaveCount },
    { seccion: "Tasa", metrica: "Asistencia", valor: formatAnalyticsRate(kpis.attendanceRate) },
    { seccion: "Tasa", metrica: "Puntualidad", valor: formatAnalyticsRate(kpis.punctualityRate) },
    { seccion: "Tasa", metrica: "Faltas", valor: formatAnalyticsRate(kpis.absenceRate) },
  ];
}

function buildWorkerRows(
  rankings: {
    topAbsentWorkers?: AttendanceAnalyticsRankingItem[];
    topLateWorkers?: AttendanceAnalyticsRankingItem[];
    bestAttendanceWorkers?: AttendanceAnalyticsRankingItem[];
  },
  maps: DirectoryMaps,
) {
  const rows = new Map<string, {
    label: string;
    worker?: WorkerRecord;
    absences: number | null;
    late: number | null;
    attendanceRate: number | null;
  }>();

  const ensureRow = (item: ExtendedRankingItem) => {
    const worker = resolveWorker(item, maps);
    const key = worker?.id || normalizeName(item.label || "");
    const current = rows.get(key) ?? {
      label: worker?.fullName || item.label || "Sin nombre",
      worker,
      absences: null,
      late: null,
      attendanceRate: null,
    };
    if (!current.worker && worker) current.worker = worker;
    rows.set(key, current);
    return current;
  };

  rankings.topAbsentWorkers?.forEach((item) => {
    ensureRow(item as ExtendedRankingItem).absences = item.value;
  });

  rankings.topLateWorkers?.forEach((item) => {
    ensureRow(item as ExtendedRankingItem).late = item.value;
  });

  rankings.bestAttendanceWorkers?.forEach((item) => {
    ensureRow(item as ExtendedRankingItem).attendanceRate = item.value;
  });

  return Array.from(rows.values());
}

function AnalyticsSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="h-8 w-72 animate-pulse rounded-xl bg-muted" />
            <div className="h-4 w-full max-w-lg animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-11 w-32 animate-pulse rounded-2xl bg-muted" />
            <div className="h-11 w-32 animate-pulse rounded-2xl bg-muted" />
            <div className="h-11 w-32 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="min-h-40 rounded-2xl border border-border bg-card p-5">
            <div className="mb-5 h-12 w-12 animate-pulse rounded-2xl bg-muted" />
            <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
            <div className="mt-3 h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="min-h-[360px] animate-pulse rounded-2xl bg-muted" />
        <div className="min-h-[360px] animate-pulse rounded-2xl bg-muted" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="size-11 animate-pulse rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full max-w-sm animate-pulse rounded bg-muted" />
              </div>
              <div className="h-7 w-20 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyAnalyticsState({
  title = "No hay datos suficientes",
  description = "Aún no existen registros para calcular esta métrica en el periodo seleccionado.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-sm">
        <Activity className="size-6" />
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function AnalyticsHeader({
  generatedAt,
  period,
  canRecalculate,
  isFetching,
  isRecalculating,
  viewMode,
  onRefresh,
  onRecalculate,
  onExport,
  onPeriodSelect,
  onViewModeChange,
}: {
  generatedAt?: string | null;
  period: PeriodRange;
  canRecalculate: boolean;
  isFetching: boolean;
  isRecalculating: boolean;
  viewMode: ViewMode;
  onRefresh: () => void;
  onRecalculate: () => void;
  onExport: (format: "xlsx" | "pdf" | "csv") => void;
  onPeriodSelect: (period: "today" | "week" | "month" | "custom") => void;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  const quickPeriods = [
    { key: "today", label: "Hoy" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mes" },
    { key: "custom", label: "Personalizado" },
  ] as const;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Horarios y Asistencia</span>
            <span>/</span>
            <span className="font-semibold text-foreground">Analítica de asistencia</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 sm:flex">
              <BarChart3 className="size-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight text-foreground lg:text-4xl">
                Analítica de Asistencia
              </h1>
              <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
                Métricas, tendencias y desempeño del personal
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 font-medium">
                  <CalendarDays className="size-4" />
                  {period.label}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 font-medium">
                  <Clock3 className="size-4" />
                  Última actualización: {formatDateTimeStr(generatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 xl:min-w-[520px]">
          <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
            <Button
              onClick={onRefresh}
              disabled={isFetching}
              className="h-11 gap-2 rounded-2xl bg-blue-600 px-4 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              {isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Actualizar
            </Button>

            {canRecalculate ? (
              <Button
                onClick={onRecalculate}
                disabled={isRecalculating}
                variant="secondary"
                className="h-11 gap-2 rounded-2xl border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300"
              >
                {isRecalculating ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
                Recalcular
              </Button>
            ) : null}

            <div className="flex gap-2">
              <Button onClick={() => onExport("xlsx")} variant="secondary" className="h-11 gap-2 rounded-2xl">
                <FileSpreadsheet className="size-4" />
                Excel
              </Button>
              <Button onClick={() => onExport("pdf")} variant="secondary" className="h-11 gap-2 rounded-2xl">
                <FileText className="size-4" />
                PDF
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/40 p-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-4 gap-1">
              {quickPeriods.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onPeriodSelect(option.key)}
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-card hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 rounded-xl bg-card p-1 shadow-sm">
              <button
                type="button"
                onClick={() => onViewModeChange("dashboard")}
                className={cn(
                  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  viewMode === "dashboard" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BarChart3 className="size-4" />
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("table")}
                className={cn(
                  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  viewMode === "table" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Table className="size-4" />
                Vista tabla
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalyticsFilters({
  filterForm,
  activeChips,
  workersList,
  departments,
  areas,
  positions,
  workLocations,
  workCrews,
  isLoadingWorkers,
  onChange,
  onApply,
  onClear,
  onRemoveChip,
}: {
  filterForm: FiltersState;
  activeChips: ActiveChip[];
  workersList: WorkerRecord[];
  departments: unknown[];
  areas: unknown[];
  positions: unknown[];
  workLocations: unknown[];
  workCrews: unknown[];
  isLoadingWorkers: boolean;
  onChange: (patch: Partial<FiltersState>) => void;
  onApply: () => void;
  onClear: () => void;
  onRemoveChip: (chip: ActiveChip) => void;
}) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) setShowWorkerDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Filter className="size-5 text-blue-600" />
            Filtros de análisis
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Filtra por periodo, colaborador, estructura y estado sin ocupar toda la pantalla.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowMoreFilters((current) => !current)}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
        >
          <ChevronDown className={cn("size-4 transition-transform", showMoreFilters && "rotate-180")} />
          Más filtros
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FieldFrame label="Mes">
          <Input
            type="month"
            value={filterForm.month}
            onChange={(event) => onChange({ month: event.target.value })}
            disabled={Boolean(filterForm.startDate || filterForm.endDate)}
          />
        </FieldFrame>

        <div className="grid grid-cols-2 gap-3">
          <FieldFrame label="Desde">
            <Input
              type="date"
              value={filterForm.startDate}
              onChange={(event) => onChange({ startDate: event.target.value })}
              disabled={Boolean(filterForm.month)}
            />
          </FieldFrame>
          <FieldFrame label="Hasta">
            <Input
              type="date"
              value={filterForm.endDate}
              onChange={(event) => onChange({ endDate: event.target.value })}
              disabled={Boolean(filterForm.month)}
            />
          </FieldFrame>
        </div>

        <div ref={dropdownRef} className="relative">
          <FieldFrame label="Colaborador">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={filterForm.workerSearch}
                placeholder="Buscar por nombre"
                onFocus={() => setShowWorkerDropdown(true)}
                onChange={(event) => {
                  onChange({ workerSearch: event.target.value, workerId: event.target.value ? filterForm.workerId : "" });
                  setShowWorkerDropdown(true);
                }}
                className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {filterForm.workerSearch ? (
                <button
                  type="button"
                  aria-label="Limpiar colaborador"
                  onClick={() => {
                    onChange({ workerId: "", workerSearch: "" });
                    setShowWorkerDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 cursor-pointer rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          </FieldFrame>

          {showWorkerDropdown && filterForm.workerSearch ? (
            <div className="absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-2xl">
              {isLoadingWorkers ? (
                <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Buscando colaboradores...
                </div>
              ) : workersList.length ? (
                workersList.map((worker) => (
                  <button
                    key={worker.id}
                    type="button"
                    onClick={() => {
                      onChange({ workerId: worker.id, workerSearch: worker.fullName });
                      setShowWorkerDropdown(false);
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-muted"
                  >
                    <UserAvatar src={getWorkerPhoto(worker)} fullName={worker.fullName} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">{worker.fullName}</span>
                      <span className="block truncate text-sm text-muted-foreground">{getWorkerArea(worker)}</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-sm text-muted-foreground">Sin resultados para esta búsqueda.</div>
              )}
            </div>
          ) : null}
        </div>

        <FieldFrame label="Departamento">
          <Select
            value={filterForm.departmentId}
            onChange={(event) => onChange({ departmentId: event.target.value, areaId: "", positionId: "" })}
          >
            <option value="">Todos los departamentos</option>
            {departments.map((department) => (
              <option key={getOptionId(department) || getOptionName(department)} value={getOptionId(department)}>
                {getOptionName(department)}
              </option>
            ))}
          </Select>
        </FieldFrame>
      </div>

      {showMoreFilters ? (
        <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2 xl:grid-cols-5">
          <FieldFrame label="Área">
            <Select
              value={filterForm.areaId}
              onChange={(event) => onChange({ areaId: event.target.value, positionId: "" })}
            >
              <option value="">Todas las áreas</option>
              {areas.map((area) => (
                <option key={getOptionId(area) || getOptionName(area)} value={getOptionId(area)}>
                  {getOptionName(area)}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Puesto">
            <Select value={filterForm.positionId} onChange={(event) => onChange({ positionId: event.target.value })}>
              <option value="">Todos los puestos</option>
              {positions.map((position) => (
                <option key={getOptionId(position) || getOptionName(position)} value={getOptionId(position)}>
                  {getOptionName(position)}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Obra / Sede">
            <Select
              value={filterForm.workLocationId}
              onChange={(event) => onChange({ workLocationId: event.target.value })}
            >
              <option value="">Todas las obras/sedes</option>
              {workLocations.map((workLocation) => (
                <option key={getOptionId(workLocation) || getOptionName(workLocation)} value={getOptionId(workLocation)}>
                  {getOptionName(workLocation)}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Cuadrilla">
            <Select value={filterForm.crewId} onChange={(event) => onChange({ crewId: event.target.value })}>
              <option value="">Todas las cuadrillas</option>
              {workCrews.map((crew) => (
                <option key={getOptionId(crew) || getOptionName(crew)} value={getOptionId(crew)}>
                  {getOptionName(crew)}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Estado">
            <Select value={filterForm.status} onChange={(event) => onChange({ status: event.target.value })}>
              {STATUS_FILTERS.map((status) => (
                <option key={status.value || "all"} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </FieldFrame>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-4 border-t border-border pt-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-h-9 min-w-0 flex-1">
          {activeChips.length ? (
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <button
                  key={`${chip.key}-${chip.label}`}
                  type="button"
                  onClick={() => onRemoveChip(chip)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300"
                >
                  {chip.label}
                  <X className="size-3.5" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay filtros aplicados fuera del periodo base.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onClear} variant="secondary" className="h-10 gap-2 rounded-2xl">
            <X className="size-4" />
            Limpiar filtros
          </Button>
          <Button onClick={onApply} className="h-10 gap-2 rounded-2xl bg-blue-600 text-white hover:bg-blue-700">
            <CheckCircle2 className="size-4" />
            Aplicar filtros
          </Button>
        </div>
      </div>
    </Card>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  tone,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: string;
  icon: ComponentType<{ className?: string }>;
  tone: RankingTone;
  onClick?: () => void;
}) {
  const palette = {
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
    purple: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300",
    slate: "border-border bg-muted text-foreground",
  }[tone];

  const content = (
    <Card
      className={cn(
        "min-h-44 rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg",
        onClick && "cursor-pointer focus-within:ring-2 focus-within:ring-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex size-14 items-center justify-center rounded-2xl border", palette)}>
          <Icon className="size-7" />
        </div>
        {trend ? (
          <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground">{trend}</span>
        ) : null}
      </div>
      <div className="mt-5">
        <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="mt-2 text-4xl font-black tracking-tight text-foreground">{value}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
      </div>
    </Card>
  );

  if (!onClick) return content;

  return (
    <button type="button" onClick={onClick} className="block w-full text-left focus:outline-none">
      {content}
    </button>
  );
}

function SecondaryMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  tone: RankingTone;
}) {
  const textColor = {
    blue: "text-blue-700 dark:text-blue-300",
    green: "text-emerald-700 dark:text-emerald-300",
    amber: "text-amber-700 dark:text-amber-300",
    rose: "text-rose-700 dark:text-rose-300",
    purple: "text-violet-700 dark:text-violet-300",
    slate: "text-foreground",
  }[tone];

  return (
    <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-muted-foreground">{title}</p>
          <p className={cn("mt-1 text-2xl font-black", textColor)}>{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}

function KpiSections({
  kpis,
  onStatusFilter,
}: {
  kpis: AttendanceAnalyticsKpis;
  onStatusFilter: (status: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total trabajadores"
          value={kpis.totalWorkers}
          subtitle="Personal incluido en el periodo"
          trend={kpis.scheduledWorkDays ? `${kpis.scheduledWorkDays} jornadas` : undefined}
          icon={Users}
          tone="blue"
        />
        <KpiCard
          title="Asistencias"
          value={kpis.presentCount}
          subtitle="Marcaciones registradas como asistencia"
          trend={formatAnalyticsRate(kpis.attendanceRate)}
          icon={CalendarCheck}
          tone="green"
          onClick={() => onStatusFilter("PRESENT")}
        />
        <KpiCard
          title="Faltas"
          value={kpis.absentCount}
          subtitle="Inasistencias registradas"
          trend={formatAnalyticsRate(kpis.absenceRate)}
          icon={AlertCircle}
          tone="rose"
          onClick={() => onStatusFilter("ABSENT")}
        />
        <KpiCard
          title="Tardanzas"
          value={kpis.lateCount}
          subtitle="Llegadas fuera de tolerancia"
          trend={formatLateMinutes(kpis.lateMinutes)}
          icon={Timer}
          tone="amber"
          onClick={() => onStatusFilter("LATE")}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <SecondaryMetricCard title="Vacaciones" value={kpis.vacationCount} subtitle="Días aprobados" icon={CalendarDays} tone="blue" />
        <SecondaryMetricCard title="Descansos médicos" value={kpis.medicalLeaveCount} subtitle="Ausencias justificadas" icon={Activity} tone="purple" />
        <SecondaryMetricCard title="Permisos personales" value={kpis.unpaidLeaveCount} subtitle="Permisos registrados" icon={FileText} tone="amber" />
        <SecondaryMetricCard title="Tasa asistencia" value={formatAnalyticsRate(kpis.attendanceRate)} subtitle="Sobre días programados" icon={BarChart3} tone="green" />
        <SecondaryMetricCard title="Tasa puntualidad" value={formatAnalyticsRate(kpis.punctualityRate)} subtitle="Sobre asistencias" icon={Clock3} tone="amber" />
        <SecondaryMetricCard title="Tasa faltas" value={formatAnalyticsRate(kpis.absenceRate)} subtitle="Sobre días programados" icon={AlertCircle} tone="rose" />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
  isEmpty,
  emptyMessage,
  minHeight = "min-h-[360px]",
  action,
}: {
  title: string;
  description: string;
  children: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  minHeight?: string;
  action?: ReactNode;
}) {
  return (
    <Card className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", minHeight)}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {isEmpty ? <EmptyAnalyticsState description={emptyMessage} /> : children}
    </Card>
  );
}

function AttendanceDonutChart({ data }: { data?: AttendanceAnalyticsChartItem[] }) {
  const chartData = (data ?? []).filter((item) => item.value > 0);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid min-h-[320px] min-w-0 gap-5 lg:grid-cols-[minmax(260px,1fr)_260px]">
      <div className="relative h-[320px] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={82}
              outerRadius={118}
              paddingAngle={3}
              dataKey="value"
              nameKey="label"
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`${entry.key}-${index}`} fill={STATUS_COLORS[entry.key] || "#64748b"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, props) => {
                const payload = props.payload as AttendanceAnalyticsChartItem | undefined;
                return [`${value} registros (${payload?.percentage?.toFixed(1) ?? "0.0"}%)`, payload?.label ?? ""];
              }}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                color: "var(--foreground)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-semibold text-muted-foreground">Total</p>
            <p className="text-3xl font-black text-foreground">{total}</p>
          </div>
        </div>
      </div>

      <div className="grid content-center gap-3">
        {chartData.map((entry) => (
          <div key={entry.key} className="rounded-2xl border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[entry.key] || "#64748b" }}
                />
                <span className="truncate text-sm font-semibold text-foreground">{entry.label}</span>
              </div>
              <span className="text-sm font-bold text-foreground">{entry.value}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/70">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, entry.percentage ?? (total ? (entry.value / total) * 100 : 0))}%`,
                  backgroundColor: STATUS_COLORS[entry.key] || "#64748b",
                }}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{(entry.percentage ?? 0).toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendanceTrendChart({ data, type = "area" }: { data?: AttendanceAnalyticsChartItem[]; type?: "area" | "bar" }) {
  const chartData = data ?? [];

  if (type === "bar") {
    return (
      <div className="h-[380px] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <BarChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16 }} />
            <Bar dataKey="presentCount" name="Asistencias" fill="#10b981" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="lateCount" name="Tardanzas" fill="#f59e0b" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="absentCount" name="Faltas" fill="#ef4444" radius={[6, 6, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-[380px] min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <AreaChart data={chartData} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="analyticsPresentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="analyticsLateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.24} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="analyticsAbsentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16 }} />
          <Area type="monotone" dataKey="presentCount" name="Asistencias" stroke="#10b981" strokeWidth={3} fill="url(#analyticsPresentGradient)" isAnimationActive={false} />
          <Area type="monotone" dataKey="lateCount" name="Tardanzas" stroke="#f59e0b" strokeWidth={3} fill="url(#analyticsLateGradient)" isAnimationActive={false} />
          <Area type="monotone" dataKey="absentCount" name="Faltas" stroke="#ef4444" strokeWidth={3} fill="url(#analyticsAbsentGradient)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function GroupedBarChartCard({
  title,
  description,
  data,
  labelKeys,
}: {
  title: string;
  description: string;
  data?: AttendanceAnalyticsChartItem[];
  labelKeys: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  const chartData = buildGroupedChartData(data, labelKeys);
  const visibleData = showAll ? chartData : chartData.slice(0, 10);
  const height = Math.max(380, visibleData.length * 52 + 80);

  return (
    <ChartCard
      title={title}
      description={description}
      isEmpty={!hasChartData(data, ["presentCount", "lateCount", "absentCount", "value"])}
      emptyMessage="No hay registros suficientes para esta comparativa en el periodo seleccionado."
      minHeight="min-h-[420px]"
      action={
        chartData.length > 10 ? (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-card"
          >
            <Eye className="size-4" />
            {showAll ? "Ver top 10" : "Ver todos"}
          </button>
        ) : null
      }
    >
      <div style={{ height }} className="min-h-[380px] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <BarChart data={visibleData} layout="vertical" margin={{ top: 12, right: 42, left: 22, bottom: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" horizontal={false} />
            <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={154}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: string) => (value.length > 22 ? `${value.slice(0, 22)}...` : value)}
            />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16 }} />
            <Bar dataKey="presentCount" name="Asistencias" fill="#10b981" radius={[0, 6, 6, 0]} isAnimationActive={false}>
              <LabelList dataKey="presentCount" position="right" fill="var(--muted-foreground)" fontSize={12} />
            </Bar>
            <Bar dataKey="lateCount" name="Tardanzas" fill="#f59e0b" radius={[0, 6, 6, 0]} isAnimationActive={false}>
              <LabelList dataKey="lateCount" position="right" fill="var(--muted-foreground)" fontSize={12} />
            </Bar>
            <Bar dataKey="absentCount" name="Faltas" fill="#ef4444" radius={[0, 6, 6, 0]} isAnimationActive={false}>
              <LabelList dataKey="absentCount" position="right" fill="var(--muted-foreground)" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function ChartsSection({ charts }: { charts: NonNullable<ReturnType<typeof useChartsMemo>> }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Distribución de estados"
          description="Dona grande con leyenda lateral, total central y porcentaje por estado."
          isEmpty={!hasChartData(charts.statusDistribution, ["value"])}
          emptyMessage="No hay datos suficientes para calcular la distribución de estados."
          minHeight="min-h-[420px]"
        >
          <AttendanceDonutChart data={charts.statusDistribution} />
        </ChartCard>

        <ChartCard
          title="Tendencia diaria"
          description="Evolución de asistencias, faltas y tardanzas por día del periodo."
          isEmpty={!hasChartData(charts.dailyTrend, ["presentCount", "lateCount", "absentCount", "value"])}
          emptyMessage="No hay datos de tendencia diaria para el periodo seleccionado."
          minHeight="min-h-[420px]"
        >
          <AttendanceTrendChart data={charts.dailyTrend} />
        </ChartCard>
      </div>

      <ChartCard
        title="Tendencia semanal"
        description="Comportamiento consolidado por semana para detectar desviaciones del periodo."
        isEmpty={!hasChartData(charts.weeklyTrend, ["presentCount", "lateCount", "absentCount", "value"])}
        emptyMessage="No hay datos de tendencia semanal para el periodo seleccionado."
        minHeight="min-h-[430px]"
      >
        <AttendanceTrendChart data={charts.weeklyTrend} type="bar" />
      </ChartCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <GroupedBarChartCard
          title="Comparativa por área"
          description="Top de áreas por asistencias, faltas y tardanzas."
          data={charts.byArea}
          labelKeys={["areaName", "departmentName", "name", "label"]}
        />
        <GroupedBarChartCard
          title="Comparativa por obra / sede"
          description="Centros operativos con más movimiento de asistencia."
          data={charts.byWorkLocation}
          labelKeys={["workLocationName", "locationName", "name", "label"]}
        />
        <GroupedBarChartCard
          title="Comparativa por cuadrilla"
          description="Desempeño agregado por grupos operativos."
          data={charts.byCrew}
          labelKeys={["crewName", "name", "label"]}
        />
        <GroupedBarChartCard
          title="Comparativa por departamento"
          description="Vista agregada por estructura administrativa."
          data={charts.byDepartment}
          labelKeys={["departmentName", "name", "label"]}
        />
      </div>
    </div>
  );
}

function useChartsMemo(charts: unknown) {
  return charts as {
    statusDistribution?: AttendanceAnalyticsChartItem[];
    dailyTrend?: AttendanceAnalyticsChartItem[];
    weeklyTrend?: AttendanceAnalyticsChartItem[];
    byArea?: AttendanceAnalyticsChartItem[];
    byDepartment?: AttendanceAnalyticsChartItem[];
    byWorkLocation?: AttendanceAnalyticsChartItem[];
    byCrew?: AttendanceAnalyticsChartItem[];
  };
}

function RankingTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: RankingTab;
  onTabChange: (tab: RankingTab) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-muted/40 p-2">
      {RANKING_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "inline-flex min-w-fit cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-primary/30",
              isActive ? "bg-card text-blue-700 shadow-sm dark:text-blue-300" : "text-muted-foreground hover:bg-card hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function RankingPanel({
  title,
  description,
  icon: Icon,
  items,
  suffix,
  tone,
  emptyText = "Sin registros para este ranking.",
  children,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  items?: AttendanceAnalyticsRankingItem[];
  suffix: string;
  tone: RankingTone;
  emptyText?: string;
  children?: (item: ExtendedRankingItem, max: number) => ReactNode;
}) {
  const [showAll, setShowAll] = useState(false);
  const list = (items ?? []) as ExtendedRankingItem[];
  const visibleItems = showAll ? list : list.slice(0, 5);
  const max = Math.max(1, ...list.map((item) => item.value || 0));

  const toneClass = {
    blue: "text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300",
    green: "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300",
    purple: "text-violet-700 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-300",
    slate: "text-foreground bg-muted",
  }[tone];

  return (
    <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", toneClass)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>

      {visibleItems.length ? (
        <div className="grid gap-3">
          {visibleItems.map((item) =>
            children ? (
              children(item, max)
            ) : (
              <GenericRankingItem key={`${item.rank}-${item.label}`} item={item} max={max} suffix={suffix} tone={tone} />
            ),
          )}
        </div>
      ) : (
        <EmptyAnalyticsState title="Sin datos suficientes" description={emptyText} />
      )}

      {list.length > 5 ? (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mt-4 w-full cursor-pointer rounded-xl border border-border bg-muted px-3 py-2 text-sm font-bold text-foreground transition hover:bg-card"
        >
          {showAll ? "Ver menos" : `Ver todos (${list.length})`}
        </button>
      ) : null}
    </Card>
  );
}

function GenericRankingItem({
  item,
  max,
  suffix,
  tone,
  onClick,
}: {
  item: ExtendedRankingItem;
  max: number;
  suffix: string;
  tone: RankingTone;
  onClick?: () => void;
}) {
  const width = `${Math.max(8, Math.min(100, (item.value / max) * 100))}%`;
  const barColor = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    purple: "bg-violet-500",
    slate: "bg-slate-500",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-border bg-muted/30 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/60 dark:hover:border-blue-500/20 dark:hover:bg-blue-500/10",
        onClick ? "cursor-pointer" : "cursor-default",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">#{item.rank}</p>
          <p className="mt-1 truncate text-base font-bold text-foreground">{item.label}</p>
        </div>
        <span className="shrink-0 rounded-full bg-card px-3 py-1 text-sm font-black text-foreground shadow-sm">
          {getRankingValueLabel(item, suffix)}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
        <div className={cn("h-full rounded-full", barColor)} style={{ width }} />
      </div>
    </button>
  );
}

function WorkerRankingItem({
  item,
  max,
  suffix,
  tone,
  worker,
  onClick,
}: {
  item: ExtendedRankingItem;
  max: number;
  suffix: string;
  tone: RankingTone;
  worker?: WorkerRecord;
  onClick: () => void;
}) {
  const width = `${Math.max(8, Math.min(100, (item.value / max) * 100))}%`;
  const barColor = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    purple: "bg-violet-500",
    slate: "bg-slate-500",
  }[tone];
  const lastLate = getStringField(item, ["lastLateAt", "last_late_at", "lastLateDate", "last_late_date"]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex cursor-pointer gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/70 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:hover:border-blue-500/25 dark:hover:bg-blue-500/10"
    >
      <UserAvatar src={getWorkerPhoto(worker)} fullName={worker?.fullName || item.label} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-muted-foreground">#{item.rank}</p>
            <p className="truncate text-base font-bold text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300">
              {worker?.fullName || item.label}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {getWorkerArea(worker)} · {getWorkerPosition(worker)}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-card px-3 py-1 text-sm font-black text-foreground shadow-sm">
            {getRankingValueLabel(item, suffix)}
          </span>
        </div>
        {lastLate ? <p className="mt-2 text-sm text-muted-foreground">Última tardanza: {formatDateTimeStr(lastLate)}</p> : null}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
          <div className={cn("h-full rounded-full", barColor)} style={{ width }} />
        </div>
      </div>
    </button>
  );
}

function RankingsSection({
  rankings,
  workerMaps,
  activeTab,
  onTabChange,
  onWorkerClick,
  onAggregateClick,
}: {
  rankings: {
    topAbsentWorkers?: AttendanceAnalyticsRankingItem[];
    topLateWorkers?: AttendanceAnalyticsRankingItem[];
    bestAttendanceWorkers?: AttendanceAnalyticsRankingItem[];
    topAbsentAreas?: AttendanceAnalyticsRankingItem[];
    topLateAreas?: AttendanceAnalyticsRankingItem[];
    topAbsentWorkLocations?: AttendanceAnalyticsRankingItem[];
    topLateWorkLocations?: AttendanceAnalyticsRankingItem[];
    bestAttendanceWorkLocations?: AttendanceAnalyticsRankingItem[];
    topAbsentCrews?: AttendanceAnalyticsRankingItem[];
    topLateCrews?: AttendanceAnalyticsRankingItem[];
    bestAttendanceCrews?: AttendanceAnalyticsRankingItem[];
  };
  workerMaps: DirectoryMaps;
  activeTab: RankingTab;
  onTabChange: (tab: RankingTab) => void;
  onWorkerClick: (context: WorkerRankingContext) => void;
  onAggregateClick: (context: AggregateRankingContext) => void;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Rankings del periodo</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Listados ordenados por colaborador, área, obra/sede y cuadrilla sin llenar la pantalla de tarjetas repetidas.
          </p>
        </div>
        <RankingTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {activeTab === "workers" ? (
        <div className="grid gap-5 xl:grid-cols-3">
          <RankingPanel
            title="Trabajadores con más faltas"
            description="Inasistencias acumuladas por colaborador."
            icon={AlertCircle}
            items={rankings.topAbsentWorkers}
            suffix="faltas"
            tone="rose"
            emptyText="Aún no hay trabajadores con faltas en este periodo."
          >
            {(item, max) => {
              const worker = resolveWorker(item, workerMaps);
              return (
                <WorkerRankingItem
                  key={`${item.rank}-${item.label}`}
                  item={item}
                  max={max}
                  suffix="faltas"
                  tone="rose"
                  worker={worker}
                  onClick={() => onWorkerClick({ item, worker, metricLabel: "Faltas", metricTone: "rose" })}
                />
              );
            }}
          </RankingPanel>

          <RankingPanel
            title="Trabajadores con más tardanzas"
            description="Llegadas fuera de tolerancia en el periodo."
            icon={Timer}
            items={rankings.topLateWorkers}
            suffix="tardanzas"
            tone="amber"
            emptyText="Aún no hay tardanzas registradas para este periodo."
          >
            {(item, max) => {
              const worker = resolveWorker(item, workerMaps);
              return (
                <WorkerRankingItem
                  key={`${item.rank}-${item.label}`}
                  item={item}
                  max={max}
                  suffix="tardanzas"
                  tone="amber"
                  worker={worker}
                  onClick={() => onWorkerClick({ item, worker, metricLabel: "Tardanzas", metricTone: "amber" })}
                />
              );
            }}
          </RankingPanel>

          <RankingPanel
            title="Mejor asistencia"
            description="Colaboradores con mejor tasa de asistencia."
            icon={Award}
            items={rankings.bestAttendanceWorkers}
            suffix="%"
            tone="green"
            emptyText="Aún no hay suficientes datos para calcular mejor asistencia. Se requiere al menos más registros del periodo."
          >
            {(item, max) => {
              const worker = resolveWorker(item, workerMaps);
              return (
                <WorkerRankingItem
                  key={`${item.rank}-${item.label}`}
                  item={item}
                  max={max}
                  suffix="%"
                  tone="green"
                  worker={worker}
                  onClick={() => onWorkerClick({ item, worker, metricLabel: "Mejor asistencia", metricTone: "green" })}
                />
              );
            }}
          </RankingPanel>
        </div>
      ) : null}

      {activeTab === "areas" ? (
        <div className="grid gap-5 xl:grid-cols-3">
          <RankingPanel
            title="Áreas con más faltas"
            description="Comparativa agregada por área."
            icon={Layers}
            items={rankings.topAbsentAreas}
            suffix="faltas"
            tone="rose"
          >
            {(item, max) => (
              <GenericRankingItem
                key={`${item.rank}-${item.label}`}
                item={item}
                max={max}
                suffix="faltas"
                tone="rose"
                onClick={() => onAggregateClick({ item, title: item.label, subtitle: "Área", metricLabel: "Faltas", metricTone: "rose" })}
              />
            )}
          </RankingPanel>
          <RankingPanel
            title="Áreas con más tardanzas"
            description="Comparativa de tardanzas por área."
            icon={Timer}
            items={rankings.topLateAreas}
            suffix="tardanzas"
            tone="amber"
          >
            {(item, max) => (
              <GenericRankingItem
                key={`${item.rank}-${item.label}`}
                item={item}
                max={max}
                suffix="tardanzas"
                tone="amber"
                onClick={() => onAggregateClick({ item, title: item.label, subtitle: "Área", metricLabel: "Tardanzas", metricTone: "amber" })}
              />
            )}
          </RankingPanel>
          <RankingPanel
            title="Áreas con mejor asistencia"
            description="Este ranking depende del endpoint de analítica."
            icon={Award}
            items={[]}
            suffix="%"
            tone="green"
            emptyText="El endpoint actual aún no retorna ranking de mejor asistencia por área."
          />
        </div>
      ) : null}

      {activeTab === "locations" ? (
        <div className="grid gap-5 xl:grid-cols-3">
          <RankingPanel title="Obras con más faltas" description="Inasistencias por obra o sede." icon={Building} items={rankings.topAbsentWorkLocations} suffix="faltas" tone="rose">
            {(item, max) => (
              <GenericRankingItem key={`${item.rank}-${item.label}`} item={item} max={max} suffix="faltas" tone="rose" onClick={() => onAggregateClick({ item, title: item.label, subtitle: "Obra / sede", metricLabel: "Faltas", metricTone: "rose" })} />
            )}
          </RankingPanel>
          <RankingPanel title="Obras con más tardanzas" description="Llegadas tarde por obra o sede." icon={Timer} items={rankings.topLateWorkLocations} suffix="tardanzas" tone="amber">
            {(item, max) => (
              <GenericRankingItem key={`${item.rank}-${item.label}`} item={item} max={max} suffix="tardanzas" tone="amber" onClick={() => onAggregateClick({ item, title: item.label, subtitle: "Obra / sede", metricLabel: "Tardanzas", metricTone: "amber" })} />
            )}
          </RankingPanel>
          <RankingPanel title="Obras con mejor asistencia" description="Tasa de asistencia por obra o sede." icon={Award} items={rankings.bestAttendanceWorkLocations} suffix="%" tone="green">
            {(item, max) => (
              <GenericRankingItem key={`${item.rank}-${item.label}`} item={item} max={max} suffix="%" tone="green" onClick={() => onAggregateClick({ item, title: item.label, subtitle: "Obra / sede", metricLabel: "Mejor asistencia", metricTone: "green" })} />
            )}
          </RankingPanel>
        </div>
      ) : null}

      {activeTab === "crews" ? (
        <div className="grid gap-5 xl:grid-cols-3">
          <RankingPanel title="Cuadrillas con más faltas" description="Inasistencias por grupo operativo." icon={BriefcaseBusiness} items={rankings.topAbsentCrews} suffix="faltas" tone="rose">
            {(item, max) => (
              <GenericRankingItem key={`${item.rank}-${item.label}`} item={item} max={max} suffix="faltas" tone="rose" onClick={() => onAggregateClick({ item, title: item.label, subtitle: "Cuadrilla", metricLabel: "Faltas", metricTone: "rose" })} />
            )}
          </RankingPanel>
          <RankingPanel title="Cuadrillas con más tardanzas" description="Tardanzas por grupo operativo." icon={Timer} items={rankings.topLateCrews} suffix="tardanzas" tone="amber">
            {(item, max) => (
              <GenericRankingItem key={`${item.rank}-${item.label}`} item={item} max={max} suffix="tardanzas" tone="amber" onClick={() => onAggregateClick({ item, title: item.label, subtitle: "Cuadrilla", metricLabel: "Tardanzas", metricTone: "amber" })} />
            )}
          </RankingPanel>
          <RankingPanel title="Cuadrillas con mejor asistencia" description="Tasa de asistencia por cuadrilla." icon={Award} items={rankings.bestAttendanceCrews} suffix="%" tone="green">
            {(item, max) => (
              <GenericRankingItem key={`${item.rank}-${item.label}`} item={item} max={max} suffix="%" tone="green" onClick={() => onAggregateClick({ item, title: item.label, subtitle: "Cuadrilla", metricLabel: "Mejor asistencia", metricTone: "green" })} />
            )}
          </RankingPanel>
        </div>
      ) : null}
    </section>
  );
}

function AnalyticsDataTable({
  items = [],
  total = 0,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  search,
  onSearchChange,
  sortBy,
  sortDirection,
  onSort,
  onOpenWorker,
  onExport,
  isLoading,
}: {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (key: string) => void;
  onOpenWorker: (context: WorkerRankingContext) => void;
  onExport: (format: "xlsx" | "pdf" | "csv") => void;
  isLoading?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Vista tabla</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Análisis tabular con búsqueda, ordenamiento y paginación en servidor.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar colaborador..."
              className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-80"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onExport("xlsx")} variant="secondary" className="h-11 gap-2 rounded-2xl">
              <FileSpreadsheet className="size-4" />
              Excel
            </Button>
            <Button onClick={() => onExport("pdf")} variant="secondary" className="h-11 gap-2 rounded-2xl">
              <FileText className="size-4" />
              PDF
            </Button>
            <Button onClick={() => onExport("csv")} variant="secondary" className="h-11 gap-2 rounded-2xl">
              <FileSpreadsheet className="size-4" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="size-8 animate-spin text-primary" />
        </div>
      ) : items.length ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <SortableHeader label="Trabajador" active={sortBy === "fullName"} direction={sortDirection} onClick={() => onSort("fullName")} />
                  <th className="px-4 py-3 font-bold">Área</th>
                  <th className="px-4 py-3 font-bold">Obra / Sede</th>
                  <th className="px-4 py-3 font-bold">Días asistidos</th>
                  <SortableHeader label="Faltas" active={sortBy === "absentDays"} direction={sortDirection} onClick={() => onSort("absentDays")} />
                  <SortableHeader label="Tardanzas" active={sortBy === "lateDays"} direction={sortDirection} onClick={() => onSort("lateDays")} />
                  <th className="px-4 py-3 font-bold">Vacaciones</th>
                  <th className="px-4 py-3 font-bold">Permisos</th>
                  <SortableHeader label="Tasa asistencia" active={sortBy === "attendanceRate"} direction={sortDirection} onClick={() => onSort("attendanceRate")} />
                  <th className="px-4 py-3 font-bold">Tasa puntualidad</th>
                  <th className="px-4 py-3 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const photo = row.profilePhotoUrl || row.photoUrl || row.avatarUrl;
                  return (
                    <tr key={row.workerId} className="group">
                      <td className="border-t border-border px-4 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={photo} fullName={row.fullName} size="md" />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-foreground">{row.fullName}</p>
                            <p className="truncate text-sm text-muted-foreground">{row.positionName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="border-t border-border px-4 py-4 text-foreground">{row.areaName || "—"}</td>
                      <td className="border-t border-border px-4 py-4 text-foreground">{row.workLocationName || "—"}</td>
                      <td className="border-t border-border px-4 py-4 text-foreground">{row.attendedDays ?? "—"}</td>
                      <td className="border-t border-border px-4 py-4 font-bold text-rose-600">{row.absentDays ?? "—"}</td>
                      <td className="border-t border-border px-4 py-4 font-bold text-amber-600">{row.lateDays ?? "—"}</td>
                      <td className="border-t border-border px-4 py-4 text-foreground">{row.vacationDays ?? "—"}</td>
                      <td className="border-t border-border px-4 py-4 text-foreground">{row.unpaidLeaveDays ?? "—"}</td>
                      <td className="border-t border-border px-4 py-4 font-bold text-emerald-600">
                        {row.attendanceRate !== undefined && row.attendanceRate !== null ? `${row.attendanceRate}%` : "—"}
                      </td>
                      <td className="border-t border-border px-4 py-4 font-bold text-amber-600">
                        {row.punctualityRate !== undefined && row.punctualityRate !== null ? `${row.punctualityRate}%` : "—"}
                      </td>
                      <td className="border-t border-border px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            className="h-9 gap-2 rounded-xl px-3"
                            onClick={() =>
                              onOpenWorker({
                                item: {
                                  rank: 0,
                                  label: row.fullName,
                                  value: row.absentDays ?? row.lateDays ?? row.attendanceRate ?? 0,
                                  workerId: row.workerId,
                                },
                                worker: { id: row.workerId, fullName: row.fullName } as unknown as WorkerRecord,
                                metricLabel: "Resumen",
                                metricTone: "blue",
                              })
                            }
                          >
                            <Eye className="size-4" />
                            Ver detalle
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Página <span className="font-bold text-foreground">{page}</span> de{" "}
                <span className="font-bold text-foreground">{totalPages}</span> · {total} registros
              </p>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-8 rounded-xl border border-border bg-card px-2 text-xs text-foreground outline-none"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    Mostrar {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="h-10 rounded-xl px-3"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="secondary"
                className="h-10 rounded-xl px-3"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyAnalyticsState
          title="Sin filas para mostrar"
          description="No se encontraron registros de analítica para los filtros y búsqueda actuales."
        />
      )}
    </Card>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-muted-foreground transition hover:text-foreground"
      >
        {label}
        <ChevronDown className={cn("size-4 transition-transform", active && direction === "asc" && "rotate-180")} />
      </button>
    </th>
  );
}

function DrawerMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: RankingTone;
}) {
  const toneClass = {
    blue: "text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300",
    green: "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300",
    purple: "text-violet-700 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-300",
    slate: "text-foreground bg-muted",
  }[tone];

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className={cn("mt-1 rounded-xl px-2 py-1 text-xl font-black", toneClass)}>{value}</p>
    </div>
  );
}

function WorkerAnalyticsDrawer({
  context,
  period,
  onClose,
  onExport,
}: {
  context: WorkerRankingContext;
  period: PeriodRange;
  onClose: () => void;
  onExport: (format: "xlsx" | "pdf" | "csv", scope: string, workerId: string) => void;
}) {
  const workerId = String(context.worker?.id || context.item.workerId || context.item.id || "");
  const [selectedDay, setSelectedDay] = useState<{ date: string; record: any | null } | null>(null);

  const queryParams = useMemo(() => {
    if (period.startDate && period.endDate) {
      return { startDate: period.startDate, endDate: period.endDate };
    }
    return { month: period.month };
  }, [period]);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["worker-analytics-detail", workerId, queryParams],
    queryFn: () => attendanceService.getAnalyticsWorker(workerId || "", queryParams),
    enabled: Boolean(workerId),
    staleTime: 30_000,
  });

  const detailData = response?.data;
  const worker = detailData?.worker;
  const summary = detailData?.summary;
  const calendar = detailData?.calendar || [];

  const displayName = worker?.fullName || context.item.label || "Colaborador";
  const positionName = worker?.positionName || "—";
  const areaName = worker?.areaName || "—";
  const workLocationName = worker?.workLocationName || "—";
  const currentStatus = worker?.currentStatus || "—";
  const photo = worker?.profilePhotoUrl || worker?.photoUrl || worker?.avatarUrl;

  const detailUrl = workerId
    ? `/dashboard/schedule/attendance-summary/${workerId}?start_date=${period.startDate || period.month + "-01"}&end_date=${period.endDate || period.month + "-30"}`
    : "";

  const formatLateMinutes = (mins?: number) => {
    if (!mins) return "0 min";
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar detalle"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-slate-950/45 backdrop-blur-sm"
      />
      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full flex-col overflow-hidden border-l border-border bg-background shadow-2xl sm:max-w-[620px]">
        <header className="border-b border-border bg-card p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">Detalle de trabajador</p>
              <h2 className="text-xl font-black text-foreground">Analítica individual</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-2xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex items-start gap-4">
            <UserAvatar src={photo} fullName={displayName} size="hero" className="border border-border" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-2xl font-black text-foreground">{displayName}</h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">{positionName}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-foreground">{areaName}</span>
                <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-foreground">{workLocationName}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {currentStatus}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-5">
            <section className="grid gap-3 sm:grid-cols-2">
              <DrawerMetric label={context.metricLabel} value={context.metricLabel.includes("asistencia") ? `${summary?.attendanceRate ?? 0}%` : context.metricLabel === "Tardanzas" ? `${summary?.lateDays ?? 0} tardanzas` : `${summary?.absentDays ?? 0} faltas`} tone={context.metricTone} />
              <DrawerMetric label="Periodo" value={period.label} tone="blue" />
              <DrawerMetric label="Asistencias" value={summary?.attendedDays ?? "—"} tone="green" />
              <DrawerMetric label="Faltas" value={summary?.absentDays ?? "—"} tone="rose" />
              <DrawerMetric label="Tardanzas" value={summary?.lateDays ?? "—"} tone="amber" />
              <DrawerMetric label="Tiempo tarde" value={formatLateMinutes(summary?.lateMinutes)} tone="amber" />
              <DrawerMetric label="Vacaciones" value={summary?.vacationDays ?? "—"} tone="blue" />
              <DrawerMetric label="Permisos" value={summary?.unpaidLeaveDays ?? "—"} tone="purple" />
              <DrawerMetric label="Descansos médicos" value={summary?.medicalLeaveDays ?? "—"} tone="purple" />
            </section>

            {isLoading ? (
              <div className="min-h-[240px] animate-pulse rounded-2xl bg-muted" />
            ) : isError || !workerId ? (
              <EmptyAnalyticsState
                title={workerId ? "No se pudo cargar el calendario" : "Detalle diario no vinculado"}
                description={
                  workerId
                    ? "Ocurrió un error al cargar los datos del trabajador desde la API."
                    : "El ranking no incluye un identificador de trabajador y no se pudo enlazar."
                }
              />
            ) : (
              <WorkerDrawerCalendar
                calendar={calendar}
                period={period}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            )}
          </div>
        </div>

        <footer className="border-t border-border bg-card p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              variant="secondary"
              className="h-10 gap-2 rounded-xl"
              disabled={!detailUrl}
              onClick={() => {
                if (detailUrl) window.location.href = detailUrl;
              }}
            >
              <User className="size-4" />
              Ver perfil
            </Button>
            <Button
              variant="secondary"
              className="h-10 gap-2 rounded-xl"
              onClick={() => onExport("pdf", "worker", String(workerId))}
            >
              <FileText className="size-4" />
              Exportar PDF
            </Button>
            <Button
              variant="secondary"
              className="h-10 gap-2 rounded-xl"
              onClick={() => onExport("xlsx", "worker", String(workerId))}
            >
              <FileSpreadsheet className="size-4" />
              Exportar Excel
            </Button>
          </div>
        </footer>
      </aside>
    </>
  );
}

const getCalendarDayColors = (status?: string) => {
  const s = status ? status.toUpperCase() : "NONE";
  switch (s) {
    case "PRESENT":
      return { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" };
    case "LATE":
      return { bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" };
    case "ABSENT":
    case "REJECTED":
      return { bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/20", text: "text-rose-700 dark:text-rose-300", dot: "bg-rose-500" };
    case "VACATION":
    case "APPROVED":
      return { bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" };
    case "MEDICAL_LEAVE":
      return { bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/20", text: "text-violet-700 dark:text-violet-300", dot: "bg-violet-500" };
    case "UNPAID_LEAVE":
      return { bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" };
    case "HOLIDAY":
      return { bg: "bg-teal-50 dark:bg-teal-500/10", border: "border-teal-200 dark:border-teal-500/20", text: "text-teal-700 dark:text-teal-300", dot: "bg-teal-500" };
    case "REST_DAY":
      return { bg: "bg-slate-50 dark:bg-slate-500/10", border: "border-slate-200 dark:border-slate-500/20", text: "text-slate-700 dark:text-slate-300", dot: "bg-slate-500" };
    case "PENDING":
    case "PENDING_SUPERVISOR":
    case "PENDING_RRHH":
      return { bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500" };
    case "OBSERVED":
      return { bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" };
    case "INCOMPLETE":
      return { bg: "bg-fuchsia-50 dark:bg-fuchsia-500/10", border: "border-fuchsia-200 dark:border-fuchsia-500/20", text: "text-fuchsia-700 dark:text-fuchsia-300", dot: "bg-fuchsia-500" };
    case "DRAFT":
    case "CANCELLED":
    case "EXPIRED":
    case "NO_SCHEDULE":
    default:
      return { bg: "bg-muted/40", border: "border-transparent", text: "text-muted-foreground", dot: "bg-muted-foreground" };
  }
};

function WorkerDrawerCalendar({
  calendar = [],
  period,
  selectedDay,
  onSelectDay,
}: {
  calendar: any[];
  period: PeriodRange;
  selectedDay: { date: string; record: any | null } | null;
  onSelectDay: (day: { date: string; record: any | null }) => void;
}) {
  const recordByDate = useMemo(() => {
    const map = new Map<string, any>();
    for (const record of calendar) {
      if (record.date) map.set(record.date.includes("T") ? record.date.split("T")[0] : record.date, record);
    }
    return map;
  }, [calendar]);

  const days = useMemo(() => {
    const start = new Date(`${period.startDate}T00:00:00`);
    const end = new Date(`${period.endDate}T00:00:00`);
    const list: string[] = [];
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      list.push(getDateString(date));
    }
    return list;
  }, [period.endDate, period.startDate]);

  const selectedRecord = selectedDay?.record ?? null;
  const selectedRecordStatus = selectedRecord ? (selectedRecord.statusKey || selectedRecord.status_key || selectedRecord.status) : undefined;
  const colorsSelected = selectedRecordStatus ? getCalendarDayColors(selectedRecordStatus) : null;
  const selectedRecordLabel = selectedRecord ? (selectedRecord.statusLabel || selectedRecord.status_label || selectedRecord.label || selectedRecord.status || "Sin datos") : "Sin datos";

  const formatLateMinutes = (mins?: number) => {
    if (!mins) return "0 min";
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Calendario mensual</h3>
          <p className="text-sm text-muted-foreground">Colores por estado del día y detalle al seleccionar una fecha.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {[
            ["PRESENT", "Asistió"],
            ["LATE", "Tardanza"],
            ["ABSENT", "Falta"],
            ["VACATION", "Vacaciones"],
            ["MEDICAL_LEAVE", "Desc. médico"],
            ["REST_DAY", "No laboral"],
          ].map(([status, label]) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-full", getCalendarDayColors(status).dot)} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {[
          ["mon", "L"],
          ["tue", "M"],
          ["wed", "M"],
          ["thu", "J"],
          ["fri", "V"],
          ["sat", "S"],
          ["sun", "D"],
        ].map(([key, label]) => (
          <div key={key} className="py-1 text-center text-sm font-bold text-muted-foreground">
            {label}
          </div>
        ))}
        {days.map((date) => {
          const record = recordByDate.get(date) ?? null;
          const status = record ? (record.statusKey || record.status_key || record.status) : "NO_SCHEDULE";
          const label = record ? (record.statusLabel || record.status_label || record.label || record.status || "Sin datos") : "Sin datos";
          const colors = getCalendarDayColors(status);
          const dayNumber = Number(date.split("-")[2]);
          const isSelected = selectedDay?.date === date;
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDay({ date, record })}
              className={cn(
                "aspect-square cursor-pointer rounded-xl border p-1 text-sm font-bold transition hover:ring-2 hover:ring-primary/30",
                colors.bg,
                colors.border,
                colors.text,
                isSelected && "ring-2 ring-primary/40",
              )}
              title={`${formatDate(date)} · ${label}`}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-4">
        {selectedDay ? (
          selectedRecord ? (
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{formatDate(selectedDay.date)}</p>
                  <p className="text-lg font-black text-foreground">{selectedRecordLabel}</p>
                </div>
                <span className={cn("rounded-full px-3 py-1 text-sm font-bold", colorsSelected?.bg)}>
                  {selectedRecordLabel}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <InfoLine label="Check-in" value={selectedRecord.checkIn || "No registrado"} />
                <InfoLine label="Check-out" value={selectedRecord.checkOut || "No registrado"} />
                <InfoLine label="Tardanza" value={formatLateMinutes(selectedRecord.lateMinutes ?? 0)} />
                <InfoLine label="Ubicación" value={selectedRecord.locationName || "No informada"} />
                <InfoLine label="Evidencia" value={selectedRecord.evidencePhotoUrl ? (
                  <a href={selectedRecord.evidencePhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold">Ver foto</a>
                ) : "No disponible"} />
                <InfoLine label="Observación" value={selectedRecord.observation || "Sin observación"} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay registro diario para {formatDate(selectedDay.date)}.</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Selecciona un día para ver check-in, check-out, estado, tardanza y observaciones.</p>
        )}
      </div>
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function AggregateDetailDrawer({
  context,
  period,
  onClose,
  onExport,
}: {
  context: AggregateRankingContext;
  period: PeriodRange;
  onClose: () => void;
  onExport: (format: "xlsx" | "pdf" | "csv", scope: string, entityId: string) => void;
}) {
  const entityId = context.item.areaId || context.item.workLocationId || context.item.crewId || context.item.id;
  const entityType = context.subtitle; // "Área", "Obra / sede" o "Cuadrilla"

  const queryParams = useMemo(() => {
    if (period.startDate && period.endDate) {
      return { startDate: period.startDate, endDate: period.endDate };
    }
    return { month: period.month };
  }, [period]);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["aggregate-analytics-detail", entityType, entityId, queryParams],
    queryFn: () => {
      const typeStr = entityType.toLowerCase();
      if (typeStr.includes("área") || typeStr.includes("area")) {
        return attendanceService.getAnalyticsArea(String(entityId), queryParams);
      } else if (typeStr.includes("obra") || typeStr.includes("sede") || typeStr.includes("location")) {
        return attendanceService.getAnalyticsWorkLocation(String(entityId), queryParams);
      } else {
        return attendanceService.getAnalyticsCrew(String(entityId), queryParams);
      }
    },
    enabled: Boolean(entityId),
    staleTime: 30_000,
  });

  const detailData = response?.data;
  const entity = detailData?.entity;
  const summary = detailData?.summary;
  const trend = detailData?.trend || [];
  const statusDistribution = detailData?.statusDistribution || [];
  const topAbsentWorkers = detailData?.topAbsentWorkers || [];
  const topLateWorkers = detailData?.topLateWorkers || [];
  const bestAttendanceWorkers = detailData?.bestAttendanceWorkers || [];

  const scope = entityType.toLowerCase().includes("área") || entityType.toLowerCase().includes("area")
    ? "area"
    : entityType.toLowerCase().includes("obra") || entityType.toLowerCase().includes("sede") || entityType.toLowerCase().includes("location")
    ? "workLocation"
    : "crew";

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar detalle agregado"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-slate-950/45 backdrop-blur-sm"
      />
      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full flex-col overflow-hidden border-l border-border bg-background shadow-2xl sm:max-w-[520px]">
        <header className="border-b border-border bg-card p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">{entityType}</p>
              <h2 className="text-2xl font-black text-foreground">{entity?.name || context.title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-2xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DrawerMetric label={context.metricLabel} value={context.item.value} tone={context.metricTone} />
            <DrawerMetric label="Colaboradores" value={summary?.totalWorkers ?? "—"} tone="blue" />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="size-6 animate-spin text-primary" />
            </div>
          ) : isError || !entityId ? (
            <EmptyAnalyticsState
              title="Error al cargar"
              description="No se pudo cargar el desglose detallado de esta entidad desde la API."
            />
          ) : (
            <div className="grid gap-6">
              {/* Summary stats */}
              <section className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-border bg-card p-3 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Asistencia</p>
                  <p className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {summary?.attendanceRate !== undefined ? `${summary.attendanceRate}%` : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Puntualidad</p>
                  <p className="mt-1 text-lg font-black text-amber-600 dark:text-amber-400">
                    {summary?.punctualityRate !== undefined ? `${summary.punctualityRate}%` : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Faltas</p>
                  <p className="mt-1 text-lg font-black text-rose-600 dark:text-rose-400">
                    {summary?.absenceRate !== undefined ? `${summary.absenceRate}%` : "—"}
                  </p>
                </div>
              </section>

              {/* Status distribution chart */}
              {statusDistribution.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  <h4 className="text-sm font-bold text-foreground">Distribución de Estados</h4>
                  <div className="w-full min-w-0 h-48 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <PieChart>
                        <Pie
                          data={statusDistribution.filter((entry: any) => entry.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name || entry.status || "present"] || STATUS_COLORS[String(entry.name).toUpperCase()] || "#94a3b8"} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Rankings lists */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Top Rankings del Grupo</h4>
                
                {topAbsentWorkers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-rose-500 uppercase">Más faltas</p>
                    <div className="divide-y divide-border rounded-xl border border-border bg-card/50 overflow-hidden">
                      {topAbsentWorkers.map((w: any) => (
                        <div key={w.workerId || w.fullName} className="flex items-center justify-between p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <UserAvatar src={w.profilePhotoUrl || w.photoUrl || w.avatarUrl} fullName={w.fullName || w.label} size="sm" />
                            <span className="font-bold text-foreground">{w.fullName || w.label}</span>
                          </div>
                          <span className="font-bold text-rose-600 dark:text-rose-400">{w.value} faltas</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {topLateWorkers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-amber-500 uppercase">Más tardanzas</p>
                    <div className="divide-y divide-border rounded-xl border border-border bg-card/50 overflow-hidden">
                      {topLateWorkers.map((w: any) => (
                        <div key={w.workerId || w.fullName} className="flex items-center justify-between p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <UserAvatar src={w.profilePhotoUrl || w.photoUrl || w.avatarUrl} fullName={w.fullName || w.label} size="sm" />
                            <span className="font-bold text-foreground">{w.fullName || w.label}</span>
                          </div>
                          <span className="font-bold text-amber-600 dark:text-amber-400">{w.value} tardanzas</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bestAttendanceWorkers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-emerald-500 uppercase">Mejor asistencia</p>
                    <div className="divide-y divide-border rounded-xl border border-border bg-card/50 overflow-hidden">
                      {bestAttendanceWorkers.map((w: any) => (
                        <div key={w.workerId || w.fullName} className="flex items-center justify-between p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <UserAvatar src={w.profilePhotoUrl || w.photoUrl || w.avatarUrl} fullName={w.fullName || w.label} size="sm" />
                            <span className="font-bold text-foreground">{w.fullName || w.label}</span>
                          </div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-300">{w.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="border-t border-border bg-card p-4 flex gap-2">
          <Button
            variant="secondary"
            className="h-10 flex-1 gap-2 rounded-xl"
            onClick={() => onExport("pdf", scope, String(entityId))}
          >
            <FileText className="size-4" />
            PDF
          </Button>
          <Button
            variant="secondary"
            className="h-10 flex-1 gap-2 rounded-xl"
            onClick={() => onExport("xlsx", scope, String(entityId))}
          >
            <FileSpreadsheet className="size-4" />
            Excel
          </Button>
        </footer>
      </aside>
    </>
  );
}

function ExportFiltersModal({
  isOpen,
  defaultFormat,
  defaultScope,
  defaultEntityId,
  dashboardFilters,
  onClose,
}: {
  isOpen: boolean;
  defaultFormat?: string;
  defaultScope?: string;
  defaultEntityId?: string;
  dashboardFilters: FiltersState;
  onClose: () => void;
}) {
  const [modalFilters, setModalFilters] = useState<any>(() => {
    const scope = defaultScope || "dashboard";
    return {
      format: defaultFormat || "xlsx",
      scope,
      month: dashboardFilters.month,
      startDate: dashboardFilters.startDate,
      endDate: dashboardFilters.endDate,
      workerId: scope === "worker" ? defaultEntityId || dashboardFilters.workerId : dashboardFilters.workerId,
      areaId: scope === "area" ? defaultEntityId || dashboardFilters.areaId : dashboardFilters.areaId,
      departmentId: dashboardFilters.departmentId,
      positionId: dashboardFilters.positionId,
      workLocationId: scope === "workLocation" ? defaultEntityId || dashboardFilters.workLocationId : dashboardFilters.workLocationId,
      crewId: scope === "crew" ? defaultEntityId || dashboardFilters.crewId : dashboardFilters.crewId,
      status: dashboardFilters.status,
      search: "",
      sortBy: "fullName",
      sortDirection: "asc",
      periodType: (dashboardFilters.startDate || dashboardFilters.endDate) ? "range" : "month",
    };
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: configResponse, isLoading } = useQuery({
    queryKey: ["export-filters-config", modalFilters.month, modalFilters.startDate, modalFilters.endDate],
    queryFn: ({ signal }) =>
      attendanceService.getExportFilters(
        {
          month: modalFilters.month,
          startDate: modalFilters.startDate,
          endDate: modalFilters.endDate,
        },
        signal
      ),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const config = configResponse?.data;
  
  const formats = useMemo(() => {
    if (!config?.formats) return [{ value: "xlsx", label: "Excel corporativo" }, { value: "pdf", label: "PDF corporativo" }, { value: "csv", label: "CSV plano" }];
    return Object.entries(config.formats).map(([k, v]) => ({ value: k, label: String(v) }));
  }, [config?.formats]);

  const scopes = useMemo(() => {
    if (!config?.scopes) return [
      { value: "dashboard", label: "Dashboard completo" },
      { value: "table", label: "Tabla analítica" },
      { value: "worker", label: "Trabajador" },
      { value: "area", label: "Área" },
      { value: "workLocation", label: "Obra / Sede" },
      { value: "crew", label: "Cuadrilla" }
    ];
    return Object.entries(config.scopes).map(([k, v]) => ({ value: k, label: String(v) }));
  }, [config?.scopes]);

  const statuses = config?.statuses || [];
  const sortOptions = config?.sortOptions || [];
  const dimensions = config?.dimensions || {};
  
  const workers = dimensions.workers || [];
  const areas = dimensions.areas || [];
  const departments = dimensions.departments || [];
  const positions = dimensions.positions || [];
  const workLocations = dimensions.workLocations || [];
  const crews = dimensions.crews || [];

  const handleDownload = async () => {
    setValidationError(null);
    const { scope, workerId, areaId, workLocationId, crewId } = modalFilters;

    if (scope === "worker" && !workerId) {
      setValidationError("Debe seleccionar un colaborador para descargar el reporte de trabajador.");
      return;
    }
    if (scope === "area" && !areaId) {
      setValidationError("Debe seleccionar un área para descargar el reporte de área.");
      return;
    }
    if (scope === "workLocation" && !workLocationId) {
      setValidationError("Debe seleccionar una obra/sede para descargar el reporte de obra/sede.");
      return;
    }
    if (scope === "crew" && !crewId) {
      setValidationError("Debe seleccionar una cuadrilla para descargar el reporte de cuadrilla.");
      return;
    }

    try {
      setIsDownloading(true);
      
      const exportParams = { ...modalFilters };
      if (modalFilters.periodType === "month") {
        exportParams.startDate = "";
        exportParams.endDate = "";
      } else {
        exportParams.month = "";
      }
      delete exportParams.periodType;

      const { blob, filename } = await attendanceService.exportAnalytics(exportParams, "POST");
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Reporte descargado con éxito.");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al descargar el reporte.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-slate-950/45 backdrop-blur-sm"
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 p-4 animate-in zoom-in-95 duration-200">
        <Card className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <header className="border-b border-border p-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-foreground">Configurar Descarga de Reporte</h2>
              <p className="text-sm text-muted-foreground mt-1">Elige el formato, alcance y filtros del reporte.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-2xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Cerrar modal"
            >
              <X className="size-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                Cargando configuración de filtros...
              </div>
            ) : (
              <>
                {validationError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-rose-600" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Formato */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Formato de descarga</label>
                  <div className="grid grid-cols-3 gap-2">
                    {formats.map((f: any) => {
                      const isSelected = modalFilters.format === f.value;
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => setModalFilters((c: any) => ({ ...c, format: f.value }))}
                          className={cn(
                            "py-2 px-3 rounded-xl border text-sm font-bold transition text-center cursor-pointer",
                            isSelected 
                              ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                              : "border-border bg-card text-foreground hover:bg-muted"
                          )}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Alcance (Scope) */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Alcance (Scope)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {scopes.map((s: any) => {
                      const isSelected = modalFilters.scope === s.value;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => {
                            setModalFilters((c: any) => ({ 
                              ...c, 
                              scope: s.value,
                              workerId: s.value === "worker" ? c.workerId : "",
                              areaId: s.value === "area" ? c.areaId : "",
                              workLocationId: s.value === "workLocation" ? c.workLocationId : "",
                              crewId: s.value === "crew" ? c.crewId : "",
                            }));
                          }}
                          className={cn(
                            "py-2 px-3 rounded-xl border text-sm font-bold transition text-center cursor-pointer",
                            isSelected 
                              ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                              : "border-border bg-card text-foreground hover:bg-muted"
                          )}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Periodo */}
                <div className="space-y-3 border-t border-border pt-4">
                  <label className="text-sm font-bold text-foreground block">Periodo</label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="periodType"
                        checked={modalFilters.periodType === "month"}
                        onChange={() => setModalFilters((c: any) => ({ ...c, periodType: "month" }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Mes completo
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="periodType"
                        checked={modalFilters.periodType === "range"}
                        onChange={() => setModalFilters((c: any) => ({ ...c, periodType: "range" }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Rango de fechas
                    </label>
                  </div>

                  {modalFilters.periodType === "month" ? (
                    <FieldFrame label="Mes">
                      <Input
                        type="month"
                        value={modalFilters.month}
                        onChange={(e) => setModalFilters((c: any) => ({ ...c, month: e.target.value }))}
                      />
                    </FieldFrame>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <FieldFrame label="Desde">
                        <Input
                          type="date"
                          value={modalFilters.startDate}
                          onChange={(e) => setModalFilters((c: any) => ({ ...c, startDate: e.target.value }))}
                        />
                      </FieldFrame>
                      <FieldFrame label="Hasta">
                        <Input
                          type="date"
                          value={modalFilters.endDate}
                          onChange={(e) => setModalFilters((c: any) => ({ ...c, endDate: e.target.value }))}
                        />
                      </FieldFrame>
                    </div>
                  )}
                </div>

                {/* Filtros Estructurales */}
                <div className="space-y-4 border-t border-border pt-4">
                  <label className="text-sm font-bold text-foreground block">Filtros Opcionales</label>
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    {modalFilters.scope === "worker" ? (
                      <FieldFrame label="Colaborador (Requerido)">
                        <Select
                          value={modalFilters.workerId}
                          onChange={(e) => setModalFilters((c: any) => ({ ...c, workerId: e.target.value }))}
                        >
                          <option value="">Selecciona colaborador...</option>
                          {workers.map((item: any) => (
                            <option key={getOptionId(item)} value={getOptionId(item)}>{getOptionName(item)}</option>
                          ))}
                        </Select>
                      </FieldFrame>
                    ) : (
                      <FieldFrame label="Colaborador">
                        <Select
                          value={modalFilters.workerId}
                          onChange={(e) => setModalFilters((c: any) => ({ ...c, workerId: e.target.value }))}
                        >
                          <option value="">Todos los colaboradores</option>
                          {workers.map((item: any) => (
                            <option key={getOptionId(item)} value={getOptionId(item)}>{getOptionName(item)}</option>
                          ))}
                        </Select>
                      </FieldFrame>
                    )}

                    {modalFilters.scope === "area" ? (
                      <FieldFrame label="Área (Requerido)">
                        <Select
                          value={modalFilters.areaId}
                          onChange={(e) => setModalFilters((c: any) => ({ ...c, areaId: e.target.value }))}
                        >
                          <option value="">Selecciona área...</option>
                          {areas.map((item: any) => (
                            <option key={getOptionId(item)} value={getOptionId(item)}>{getOptionName(item)}</option>
                          ))}
                        </Select>
                      </FieldFrame>
                    ) : (
                      <FieldFrame label="Área">
                        <Select
                          value={modalFilters.areaId}
                          onChange={(e) => setModalFilters((c: any) => ({ ...c, areaId: e.target.value }))}
                        >
                          <option value="">Todas las áreas</option>
                          {areas.map((item: any) => (
                            <option key={getOptionId(item)} value={getOptionId(item)}>{getOptionName(item)}</option>
                          ))}
                        </Select>
                      </FieldFrame>
                    )}

                    <FieldFrame label="Departamento">
                      <Select
                        value={modalFilters.departmentId}
                        onChange={(e) => setModalFilters((c: any) => ({ ...c, departmentId: e.target.value }))}
                      >
                        <option value="">Todos los departamentos</option>
                        {departments.map((item: any) => (
                          <option key={getOptionId(item)} value={getOptionId(item)}>{getOptionName(item)}</option>
                        ))}
                      </Select>
                    </FieldFrame>

                    <FieldFrame label="Puesto">
                      <Select
                        value={modalFilters.positionId}
                        onChange={(e) => setModalFilters((c: any) => ({ ...c, positionId: e.target.value }))}
                      >
                        <option value="">Todos los puestos</option>
                        {positions.map((item: any) => (
                          <option key={getOptionId(item)} value={getOptionId(item)}>{getOptionName(item)}</option>
                        ))}
                      </Select>
                    </FieldFrame>

                    {modalFilters.scope === "workLocation" ? (
                      <FieldFrame label="Obra / Sede (Requerido)">
                        <Select
                          value={modalFilters.workLocationId}
                          onChange={(e) => setModalFilters((c: any) => ({ ...c, workLocationId: e.target.value }))}
                        >
                          <option value="">Selecciona obra / sede...</option>
                          {workLocations.map((item: any) => (
                            <option key={getOptionId(item)} value={getOptionId(item)}>{getOptionName(item)}</option>
                          ))}
                        </Select>
                      </FieldFrame>
                    ) : (
                      <FieldFrame label="Obra / Sede">
                        <Select
                          value={modalFilters.workLocationId}
                          onChange={(e) => setModalFilters((c: any) => ({ ...c, workLocationId: e.target.value }))}
                        >
                          <option value="">Todas las obras/sedes</option>
                          {workLocations.map((item: any) => (
                            <option key={getOptionId(item)} value={getOptionId(item)}>{getOptionName(item)}</option>
                          ))}
                        </Select>
                      </FieldFrame>
                    )}

                    {modalFilters.scope === "crew" ? (
                      <FieldFrame label="Cuadrilla (Requerido)">
                        <Select
                          value={modalFilters.crewId}
                          onChange={(e) => setModalFilters((c: any) => ({ ...c, crewId: e.target.value }))}
                        >
                          <option value="">Selecciona cuadrilla...</option>
                          {crews.map((item: any) => (
                            <option key={getOptionId(item)} value={getOptionId(item)}>{getOptionName(item)}</option>
                          ))}
                        </Select>
                      </FieldFrame>
                    ) : (
                      <FieldFrame label="Cuadrilla">
                        <Select
                          value={modalFilters.crewId}
                          onChange={(e) => setModalFilters((c: any) => ({ ...c, crewId: e.target.value }))}
                        >
                          <option value="">Todas las cuadrillas</option>
                          {crews.map((item: any) => (
                            <option key={getOptionId(item)} value={getOptionId(item)}>{getOptionName(item)}</option>
                          ))}
                        </Select>
                      </FieldFrame>
                    )}

                    <FieldFrame label="Estado de Asistencia">
                      <Select
                        value={modalFilters.status}
                        onChange={(e) => setModalFilters((c: any) => ({ ...c, status: e.target.value }))}
                      >
                        <option value="">Todos los estados</option>
                        {statuses.map((item: any) => (
                          <option key={item.value} value={item.value}>{item.label || item.value}</option>
                        ))}
                      </Select>
                    </FieldFrame>

                    <FieldFrame label="Texto de búsqueda">
                      <Input
                        type="text"
                        value={modalFilters.search}
                        placeholder="Buscar por nombre/documento..."
                        onChange={(e) => setModalFilters((c: any) => ({ ...c, search: e.target.value }))}
                      />
                    </FieldFrame>
                  </div>
                </div>

                {/* Ordenamiento (Solo para Tabla) */}
                {modalFilters.scope === "table" && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <label className="text-sm font-bold text-foreground block font-bold">Ordenamiento de Tabla</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FieldFrame label="Ordenar por">
                        <Select
                          value={modalFilters.sortBy}
                          onChange={(e) => setModalFilters((c: any) => ({ ...c, sortBy: e.target.value }))}
                        >
                          {sortOptions.map((item: any) => (
                            <option key={item.value} value={item.value}>{item.label || item.value}</option>
                          ))}
                        </Select>
                      </FieldFrame>
                      <FieldFrame label="Dirección">
                        <Select
                          value={modalFilters.sortDirection}
                          onChange={(e) => setModalFilters((c: any) => ({ ...c, sortDirection: e.target.value }))}
                        >
                          <option value="asc">Ascendente (A-Z, menor-mayor)</option>
                          <option value="desc">Descendente (Z-A, mayor-menor)</option>
                        </Select>
                      </FieldFrame>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <footer className="border-t border-border bg-card p-4 flex gap-2 justify-end">
            <Button
              variant="secondary"
              className="h-11 rounded-xl px-4"
              onClick={onClose}
              disabled={isDownloading}
            >
              Cancelar
            </Button>
            <Button
              className="h-11 rounded-xl px-5 bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20"
              onClick={handleDownload}
              disabled={isLoading || isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="size-4 animate-spin gap-2" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download className="size-4 gap-2" />
                  Descargar reporte
                </>
              )}
            </Button>
          </footer>
        </Card>
      </div>
    </>
  );
}

export default function AnalyticsDashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const today = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => getCurrentMonth(today), [today]);
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const mode = searchParams.get("viewMode");
    return mode === "table" ? "table" : "dashboard";
  });

  const [activeRankingTab, setActiveRankingTab] = useState<RankingTab>("workers");
  const [selectedWorker, setSelectedWorker] = useState<WorkerRankingContext | null>(null);
  const [selectedAggregate, setSelectedAggregate] = useState<AggregateRankingContext | null>(null);
  const [exportModalContext, setExportModalContext] = useState<{
    isOpen: boolean;
    defaultFormat: "xlsx" | "pdf" | "csv";
    defaultScope: "dashboard" | "table" | "worker" | "area" | "workLocation" | "crew";
    defaultEntityId?: string;
  } | null>(null);

  const initialFilters = useMemo<FiltersState>(() => {
    const monthVal = searchParams.get("month");
    const startDateVal = searchParams.get("startDate");
    const endDateVal = searchParams.get("endDate");
    // If we have explicit date range, month should be empty
    const defaultMonth = (startDateVal || endDateVal) ? "" : currentMonth;

    return {
      month: monthVal !== null ? monthVal : defaultMonth,
      startDate: startDateVal ?? "",
      endDate: endDateVal ?? "",
      workerId: searchParams.get("workerId") ?? "",
      workerSearch: searchParams.get("workerSearch") ?? "",
      areaId: searchParams.get("areaId") ?? "",
      departmentId: searchParams.get("departmentId") ?? "",
      positionId: searchParams.get("positionId") ?? "",
      workLocationId: searchParams.get("workLocationId") ?? "",
      crewId: searchParams.get("crewId") ?? "",
      status: searchParams.get("status") ?? "",
      limit: Number(searchParams.get("limit") || "10"),
    };
  }, [searchParams, currentMonth]);

  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [filterForm, setFilterForm] = useState<FiltersState>(initialFilters);

  // Table pagination/search/sort states
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState("");
  const [debouncedTableSearch, setDebouncedTableSearch] = useState("");
  const [tableSortBy, setTableSortBy] = useState("fullName");
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Update filterForm and filters when initialFilters changes (e.g. back navigation or manual URL updates)
  useEffect(() => {
    if (isMounted) {
      setFilters(initialFilters);
      setFilterForm(initialFilters);
    }
  }, [initialFilters, isMounted]);

  // Sync state back to URL query parameters when filters or viewMode changes
  useEffect(() => {
    if (!isMounted) return;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        params.set(key, String(val));
      }
    });
    if (viewMode === "table") {
      params.set("viewMode", "table");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [filters, pathname, router, isMounted, viewMode]);

  // Debounce table search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTableSearch(tableSearch);
      setTablePage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [tableSearch]);

  const canRecalculate = useMemo(() => {
    if (!user) return false;
    return user.role === "admin" || user.role === "hr" || user.permissions?.includes("manage_attendance");
  }, [user]);

  const handleFilterChange = (patch: Partial<FiltersState>) => {
    setFilterForm((current) => {
      const next = { ...current, ...patch };
      if (patch.month !== undefined && patch.month) {
        next.startDate = "";
        next.endDate = "";
      }
      if (patch.startDate !== undefined || patch.endDate !== undefined) {
        if (patch.startDate || patch.endDate) next.month = "";
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setFilterForm(initialFilters);
    setFilters(initialFilters);
  };

  const handleApplyFilters = () => {
    setFilters(filterForm);
    setTablePage(1); // Reset table pagination on filter apply
  };

  const handleQuickPeriod = (periodKey: "today" | "week" | "month" | "custom") => {
    const now = new Date();
    if (periodKey === "today") {
      const date = getDateString(now);
      const next = { ...filterForm, month: "", startDate: date, endDate: date };
      setFilterForm(next);
      setFilters(next);
      setTablePage(1);
      return;
    }
    if (periodKey === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      const next = { ...filterForm, month: "", startDate: getDateString(start), endDate: getDateString(now) };
      setFilterForm(next);
      setFilters(next);
      setTablePage(1);
      return;
    }
    if (periodKey === "month") {
      const next = { ...filterForm, month: currentMonth, startDate: "", endDate: "" };
      setFilterForm(next);
      setFilters(next);
      setTablePage(1);
      return;
    }
    const next = { ...filterForm, month: "", startDate: "", endDate: "" };
    setFilterForm(next);
  };

  const { data: departmentsData } = useQuery({
    queryKey: ["departments-list"],
    queryFn: () => departmentsService.list(),
    staleTime: 300_000,
  });
  const departments = useMemo(() => extractArray(departmentsData), [departmentsData]);

  const { data: areasData } = useQuery({
    queryKey: ["areas-list", filterForm.departmentId],
    queryFn: () => areasService.list(filterForm.departmentId || undefined),
    staleTime: 300_000,
  });
  const areas = useMemo(() => extractArray(areasData), [areasData]);

  const { data: positionsData } = useQuery({
    queryKey: ["positions-list", filterForm.areaId],
    queryFn: () => organizationService.getPositions(filterForm.areaId || undefined),
    staleTime: 300_000,
  });
  const positions = useMemo(() => extractArray(positionsData), [positionsData]);

  const { data: workLocationsData } = useQuery({
    queryKey: ["work-locations-list"],
    queryFn: () => organizationService.getWorkLocations(),
    staleTime: 300_000,
  });
  const workLocations = useMemo(() => extractArray(workLocationsData), [workLocationsData]);

  const { data: workCrewsData } = useQuery({
    queryKey: ["work-crews-list"],
    queryFn: () => workCrewsService.getWorkCrews(),
    staleTime: 300_000,
  });
  const workCrews = useMemo(() => extractArray(workCrewsData), [workCrewsData]);

  const { data: workerDirectoryData } = useQuery({
    queryKey: ["workers-directory-analytics"],
    queryFn: () => workersService.list({ page: 1, pageSize: 250 }),
    staleTime: 300_000,
  });
  const workerDirectory = useMemo(() => workerDirectoryData?.items ?? [], [workerDirectoryData]);
  const workerMaps = useMemo(() => buildWorkerMaps(workerDirectory), [workerDirectory]);

  const { data: workersSearchData, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ["workers-search-filter", filterForm.workerSearch],
    queryFn: () => workersService.list({ search: filterForm.workerSearch, page: 1, pageSize: 8 }),
    enabled: filterForm.workerSearch.trim().length > 1,
  });
  const workersList = useMemo(
    () => (filterForm.workerSearch.trim().length > 1 ? workersSearchData?.items ?? [] : workerDirectory.slice(0, 8)),
    [filterForm.workerSearch, workerDirectory, workersSearchData],
  );

  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];
    if (filters.month && filters.month !== currentMonth) chips.push({ key: "month", label: getMonthRange(filters.month).label });
    if (filters.startDate || filters.endDate) {
      chips.push({ key: "dateRange", label: `${formatDate(filters.startDate)} - ${formatDate(filters.endDate || filters.startDate)}` });
    }
    if (filters.workerSearch) chips.push({ key: "workerId", label: filters.workerSearch });
    if (filters.departmentId) chips.push({ key: "departmentId", label: getOptionLabel(departments, filters.departmentId) });
    if (filters.areaId) chips.push({ key: "areaId", label: getOptionLabel(areas, filters.areaId) });
    if (filters.positionId) chips.push({ key: "positionId", label: getOptionLabel(positions, filters.positionId) });
    if (filters.workLocationId) chips.push({ key: "workLocationId", label: getOptionLabel(workLocations, filters.workLocationId) });
    if (filters.crewId) chips.push({ key: "crewId", label: getOptionLabel(workCrews, filters.crewId) });
    if (filters.status) chips.push({ key: "status", label: getStatusLabel(filters.status) });
    return chips;
  }, [areas, currentMonth, departments, filters, positions, workCrews, workLocations]);

  const removeChip = (chip: ActiveChip) => {
    const patch: Partial<FiltersState> = {};
    if (chip.key === "dateRange") {
      patch.startDate = "";
      patch.endDate = "";
      patch.month = currentMonth;
    } else if (chip.key === "workerId") {
      patch.workerId = "";
      patch.workerSearch = "";
    } else if (chip.key === "departmentId") {
      patch.departmentId = "";
      patch.areaId = "";
      patch.positionId = "";
    } else if (chip.key === "limit") {
      patch.limit = 10;
    } else if (chip.key === "month") {
      patch.month = currentMonth;
    } else if (chip.key === "areaId") {
      patch.areaId = "";
      patch.positionId = "";
    } else if (chip.key === "positionId") {
      patch.positionId = "";
    } else if (chip.key === "workLocationId") {
      patch.workLocationId = "";
    } else if (chip.key === "crewId") {
      patch.crewId = "";
    } else if (chip.key === "status") {
      patch.status = "";
    } else if (chip.key === "startDate") {
      patch.startDate = "";
    } else if (chip.key === "endDate") {
      patch.endDate = "";
    } else if (chip.key === "workerSearch") {
      patch.workerSearch = "";
    } else {
      patch.workerId = "";
    }
    setFilterForm((current) => ({ ...current, ...patch }));
    setFilters((current) => ({ ...current, ...patch }));
    setTablePage(1);
  };

  const queryParams = useMemo(() => buildAnalyticsParams(filters), [filters]);
  const period = useMemo(() => resolvePeriod(filters, currentMonth), [currentMonth, filters]);

  // Main dashboard fetch with AbortSignal support
  const {
    data: response,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    refetch: refetchDashboard,
    isFetching: isDashboardFetching,
  } = useQuery({
    queryKey: ["attendance-analytics", queryParams],
    queryFn: ({ signal }) => attendanceService.getAnalyticsDashboard(queryParams, signal),
    staleTime: 60_000,
  });

  // Table analytical fetch with pagination/sort/search and AbortSignal support
  const tableQueryParams = useMemo(() => {
    const params = buildAnalyticsParams(filters);
    return {
      ...params,
      page: tablePage,
      pageSize: tablePageSize,
      search: debouncedTableSearch,
      sortBy: tableSortBy,
      sortDirection: tableSortDirection,
    };
  }, [filters, tablePage, tablePageSize, debouncedTableSearch, tableSortBy, tableSortDirection]);

  const {
    data: tableResponse,
    isLoading: isTableLoading,
    isError: isTableError,
    isFetching: isTableFetching,
  } = useQuery({
    queryKey: ["attendance-analytics-table", tableQueryParams],
    queryFn: ({ signal }) => attendanceService.getAnalyticsTable(tableQueryParams, signal),
    enabled: viewMode === "table" && isMounted,
    staleTime: 30_000,
  });

  const recalculateMutation = useMutation({
    mutationFn: () => attendanceService.recalculateAnalytics(queryParams),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-analytics-table"] });
      toast.success(
        result.message || "Recálculo finalizado y persistido correctamente."
      );
      if (result.meta?.persisted === false) {
        toast.warning("Cálculo realizado en vivo; falta aplicar migración de auditoría en backend", {
          duration: 6000,
        });
      }
    },
    onError: (error: unknown) => {
      const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
      toast.error(message || "Error al solicitar recálculo de analíticas.");
    },
  });

  const handleExport = (
    format: "csv" | "xlsx" | "pdf",
    scope: "dashboard" | "table" | "worker" | "area" | "workLocation" | "crew",
    entityId?: string,
  ) => {
    setExportModalContext({
      isOpen: true,
      defaultFormat: format,
      defaultScope: scope,
      defaultEntityId: entityId,
    });
  };

  const dashboardData = response?.data;
  const charts = useChartsMemo(dashboardData?.charts);
  const rankings = dashboardData?.rankings;

  const handleStatusFilter = (status: string) => {
    const next = { ...filterForm, status };
    setFilterForm(next);
    setFilters(next);
    setTablePage(1);
  };

  if (!isMounted) {
    return (
      <PageContainer variant="wide" className="space-y-6">
        <AnalyticsSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="wide" className="space-y-6">
      <AnalyticsHeader
        generatedAt={dashboardData?.generatedAt}
        period={period}
        canRecalculate={canRecalculate}
        isFetching={isDashboardFetching}
        isRecalculating={recalculateMutation.isPending}
        viewMode={viewMode}
        onRefresh={() => void refetchDashboard()}
        onRecalculate={() => recalculateMutation.mutate()}
        onExport={(format) => handleExport(format, "dashboard")}
        onPeriodSelect={handleQuickPeriod}
        onViewModeChange={setViewMode}
      />

      <AnalyticsFilters
        filterForm={filterForm}
        activeChips={activeChips}
        workersList={workersList}
        departments={departments}
        areas={areas}
        positions={positions}
        workLocations={workLocations}
        workCrews={workCrews}
        isLoadingWorkers={isLoadingWorkers}
        onChange={handleFilterChange}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onRemoveChip={removeChip}
      />

      {isDashboardError ? (
        <Card className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm dark:border-rose-500/25 dark:bg-rose-500/10">
          <AlertCircle className="mx-auto size-10 text-rose-600 dark:text-rose-300" />
          <h2 className="mt-4 text-xl font-black text-rose-900 dark:text-rose-200">Error al cargar analíticas</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-rose-800 dark:text-rose-300">
            No pudimos obtener los reportes precalculados. Actualiza la consulta o ejecuta el recálculo si tienes permisos.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button onClick={() => void refetchDashboard()} variant="secondary" className="gap-2 rounded-2xl">
              <RefreshCw className="size-4" />
              Actualizar
            </Button>
            {canRecalculate ? (
              <Button onClick={() => recalculateMutation.mutate()} variant="secondary" className="gap-2 rounded-2xl">
                <Activity className="size-4" />
                Recalcular
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {isDashboardLoading ? <AnalyticsSkeleton /> : null}

      {!isDashboardLoading && !isDashboardError && !dashboardData ? (
        <EmptyAnalyticsState
          title="Sin registros analíticos"
          description="El servidor no retornó analíticas de asistencia para los filtros seleccionados."
          action={
            <Button onClick={() => void refetchDashboard()} variant="secondary" className="gap-2 rounded-2xl">
              <RefreshCw className="size-4" />
              Actualizar
            </Button>
          }
        />
      ) : null}

      {!isDashboardLoading && !isDashboardError && dashboardData ? (
        <div className="grid gap-6">
          <KpiSections kpis={dashboardData.kpis} onStatusFilter={handleStatusFilter} />

          {viewMode === "dashboard" ? (
            <>
              <ChartsSection charts={charts} />
              {rankings ? (
                <RankingsSection
                  rankings={rankings}
                  workerMaps={workerMaps}
                  activeTab={activeRankingTab}
                  onTabChange={setActiveRankingTab}
                  onWorkerClick={setSelectedWorker}
                  onAggregateClick={setSelectedAggregate}
                />
              ) : null}
            </>
          ) : (
            <AnalyticsDataTable
              items={tableResponse?.data?.items ?? []}
              total={tableResponse?.data?.total ?? 0}
              page={tablePage}
              pageSize={tablePageSize}
              onPageChange={setTablePage}
              onPageSizeChange={(size) => {
                setTablePageSize(size);
                setTablePage(1);
              }}
              search={tableSearch}
              onSearchChange={setTableSearch}
              sortBy={tableSortBy}
              sortDirection={tableSortDirection}
              onSort={(key) => {
                if (tableSortBy === key) {
                  setTableSortDirection((curr) => (curr === "asc" ? "desc" : "asc"));
                } else {
                  setTableSortBy(key);
                  setTableSortDirection("asc");
                }
                setTablePage(1);
              }}
              onOpenWorker={setSelectedWorker}
              onExport={(format) => handleExport(format, "table")}
              isLoading={isTableLoading || isTableFetching}
            />
          )}
        </div>
      ) : null}

      {selectedWorker ? (
        <WorkerAnalyticsDrawer
          context={selectedWorker}
          period={period}
          onClose={() => setSelectedWorker(null)}
          onExport={(format, scope, workerId) => handleExport(format as any, scope as any, workerId)}
        />
      ) : null}
      {selectedAggregate ? (
        <AggregateDetailDrawer
          context={selectedAggregate}
          period={period}
          onClose={() => setSelectedAggregate(null)}
          onExport={(format, scope, entityId) => handleExport(format as any, scope as any, entityId)}
        />
      ) : null}
      {exportModalContext?.isOpen ? (
        <ExportFiltersModal
          isOpen={exportModalContext.isOpen}
          defaultFormat={exportModalContext.defaultFormat}
          defaultScope={exportModalContext.defaultScope}
          defaultEntityId={exportModalContext.defaultEntityId}
          dashboardFilters={filters}
          onClose={() => setExportModalContext(null)}
        />
      ) : null}
    </PageContainer>
  );
}
