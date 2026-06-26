import { apiClient, ApiClientError } from "@/lib/api/client";
import { normalizeBirthdayWorker } from "@/lib/api/normalizers";
import type { BirthdayWorker, UserProfile } from "@/types";

type LooseRecord = Record<string, unknown>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reintenta una llamada cuando el backend responde 429 (rate limit). El
 * dashboard dispara varios endpoints a la vez y el límite de peticiones puede
 * rechazar algunos en ráfaga; reintentar con backoff evita que la tabla de
 * asistencia y los KPIs queden vacíos por un 429 transitorio.
 */
async function withRetry<T>(factory: () => Promise<T>, retries = 3): Promise<T> {
 let attempt = 0;
 for (;;) {
  try {
   return await factory();
  } catch (error) {
   const isRateLimited = error instanceof ApiClientError && error.status === 429;
   if (!isRateLimited || attempt >= retries) throw error;
   await sleep(Math.min(600 * 2 ** attempt, 4000));
   attempt += 1;
  }
 }
}

const asRecord = (value: unknown): LooseRecord | null =>
 value && typeof value === "object" ? (value as LooseRecord) : null;

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export interface DashboardUser {
 firstName: string;
 lastName: string;
 fullName: string;
 role: string;
}

export interface DashboardSummaryResponse {
 data: {
 activeWorkers: number;
 };
}

export interface AttendanceTodayResponse {
 data: {
 totalRecords: number;
 totalLate: number;
 fakeGpsAlerts: number;
 };
}

export interface DashboardAlert {
 type: string;
 severity: "info" | "warning" | "critical";
 total: number;
 message: string;
 targetUserId?: string;
}

export interface DashboardAlertsResponse {
 data: {
 alerts: DashboardAlert[];
 };
}

export interface WeeklyChartItem {
 dayName: string;
 date: string;
 totalPresent: number;
 totalLate: number;
 totalHours: number;
}

export interface WeeklyChartResponse {
 data: WeeklyChartItem[];
}

export interface WorkerStatus {
 attendanceId: string;
 workerId: string;
 workerName: string;
 projectName: string;
 checkIn: string | null;
 checkOut: string | null;
 status: string;
 lateMinutes: number;
 overtimeMinutes?: number;
 avatarUrl?: string;
}

export interface DailyStatusListResponse {
 data: {
 workers: WorkerStatus[];
 pagination: unknown;
 };
}

export interface AdminAttendanceDashboard {
 user: DashboardUser;
 summary: {
  activeWorkers: number;
  totalRecords: number;
  totalLate: number;
  fakeGpsAlerts: number;
 };
 alerts: DashboardAlert[];
 weeklyChart: WeeklyChartItem[];
 dailyStatusList: WorkerStatus[];
 birthdays: BirthdayWorker[];
 _partialFailure?: boolean;
}

interface RawWorkerStatus {
  attendanceId?: string;
  attendance_id?: string;
  workerId?: string;
  worker_id?: string;
  workerName?: string;
  worker_name?: string;
  worker?: {
    fullName?: string;
    profilePhotoUrl?: string;
  };
  projectName?: string;
  project_name?: string;
  workLocationName?: string;
  work_location_name?: string;
  checkIn?: string | null;
  check_in?: string | null;
  checkOut?: string | null;
  check_out?: string | null;
  status?: string;
  lateMinutes?: number;
  late_minutes?: number;
  overtimeMinutes?: number;
  overtime_minutes?: number;
  approvedOvertimeMinutes?: number;
  approved_overtime_minutes?: number;
  maxOvertimeMinutes?: number;
  max_overtime_minutes?: number;
  avatarUrl?: string;
  avatar_url?: string;
  profilePhotoUrl?: string;
  profile_photo_url?: string;
  attendance?: {
    id?: string;
    check_in?: string | null;
    checkIn?: string | null;
    check_out?: string | null;
    checkOut?: string | null;
    late_minutes?: number;
    lateMinutes?: number;
    workLocation?: string;
    overtime_minutes?: number;
    overtimeMinutes?: number;
  };
  shift?: {
    name?: string;
  };
  positionName?: string;
}

function normalizeWorkerStatus(w: RawWorkerStatus | null | undefined): WorkerStatus {
  if (!w || typeof w !== "object") {
    return {
      attendanceId: "",
      workerId: "",
      workerName: "Desconocido",
      projectName: "",
      checkIn: null,
      checkOut: null,
      status: "unknown",
      lateMinutes: 0,
      overtimeMinutes: 0,
      avatarUrl: "",
    };
  }

  let status = String(w.status ?? "unknown").toLowerCase().replace(/_/g, "-");
  if (status === "presente") status = "present";
  if (status === "tardanza" || status === "tardy") status = "late";
  if (status === "falta" || status === "ausente") status = "absent";
  if (status === "pending-checkout" || status === "pending_checkout") status = "pending-checkout";
  if (status === "completed" || status === "completado") status = "completed";

  const checkIn = w.checkIn ?? w.check_in ?? w.attendance?.check_in ?? w.attendance?.checkIn ?? null;
  const checkOut = w.checkOut ?? w.check_out ?? w.attendance?.check_out ?? w.attendance?.checkOut ?? null;
  const projectName = w.projectName ?? w.project_name ?? w.workLocationName ?? w.work_location_name ?? w.attendance?.workLocation ?? w.shift?.name ?? w.positionName ?? "";

  return {
    attendanceId: w.attendanceId ?? w.attendance_id ?? w.attendance?.id ?? "",
    workerId: w.workerId ?? w.worker_id ?? "",
    workerName: w.workerName ?? w.worker_name ?? w.worker?.fullName ?? "Desconocido",
    projectName,
    checkIn,
    checkOut,
    status,
    lateMinutes: Number(w.lateMinutes ?? w.late_minutes ?? w.attendance?.late_minutes ?? w.attendance?.lateMinutes ?? 0),
    overtimeMinutes: Number(w.overtimeMinutes ?? w.overtime_minutes ?? w.attendance?.overtime_minutes ?? w.attendance?.overtimeMinutes ?? w.approvedOvertimeMinutes ?? w.approved_overtime_minutes ?? w.maxOvertimeMinutes ?? w.max_overtime_minutes ?? 0),
    avatarUrl: w.avatarUrl ?? w.avatar_url ?? w.profilePhotoUrl ?? w.profile_photo_url ?? w.worker?.profilePhotoUrl ?? "",
  };
}

export const dashboardService = {
 async sendBirthdayGreeting(targetUserId: string) {
 return apiClient<{ success: boolean; message: string }>("/api/birthdays/greet", {
 method: "POST",
 body: JSON.stringify({ targetUserId }),
 });
 },

  async getAdminAttendanceDashboard(sessionUser?: UserProfile | null): Promise<AdminAttendanceDashboard> {
    const todayStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

    // Si ya tenemos el usuario de la sesión no hacemos la llamada extra a
    // /api/profile/current (~4-5s) que sólo sirve para obtener el nombre/rol.
    const results = await Promise.allSettled([
      withRetry(() => apiClient<DashboardSummaryResponse>("/api/dashboard/summary")),
      withRetry(() => apiClient<AttendanceTodayResponse>("/api/dashboard/attendance-today")),
      withRetry(() => apiClient<DashboardAlertsResponse>("/api/dashboard/alerts")),
      withRetry(() => apiClient<WeeklyChartResponse>("/api/dashboard/weekly-chart")),
      withRetry(() =>
        apiClient<any>(`/api/schedule/attendance-summary?start_date=${todayStr}&end_date=${todayStr}`)
          .catch(() => apiClient<any>("/api/dashboard/daily-status-list?page=1&limit=10"))
      ),
      withRetry(() => apiClient<unknown>("/api/birthdays/all")),
    ]);

 const summaryRes = results[0].status === "fulfilled" ? results[0].value : null;
 const attendanceTodayRes = results[1].status === "fulfilled" ? results[1].value : null;
 const alertsRes = results[2].status === "fulfilled" ? results[2].value : null;

 const weeklyChartRes = results[3].status === "fulfilled" ? results[3].value : null;
 const dailyStatusListRes = results[4].status === "fulfilled" ? results[4].value : null;
 const birthdaysRes = results[5].status === "fulfilled" ? results[5].value : null;

 const weeklyChartPayload = asRecord(weeklyChartRes)?.data;
 const chartData = Array.isArray(weeklyChartRes?.data)
 ? weeklyChartRes.data
 : Array.isArray(asRecord(weeklyChartPayload)?.items)
 ? asArray<WeeklyChartItem>(asRecord(weeklyChartPayload)?.items)
 : Array.isArray(weeklyChartRes)
 ? asArray<WeeklyChartItem>(weeklyChartRes)
 : [];

  const getWorkersArray = (val: unknown): RawWorkerStatus[] => {
    if (!val || typeof val !== "object") return [];
    if (Array.isArray(val)) return val as RawWorkerStatus[];
    
    const rec = val as Record<string, unknown>;
    if (rec.data && typeof rec.data === "object") {
      const dataRec = rec.data as Record<string, unknown>;
      if (Array.isArray(dataRec.workers)) return dataRec.workers as RawWorkerStatus[];
      if (Array.isArray(dataRec.items)) return dataRec.items as RawWorkerStatus[];
      if (Array.isArray(dataRec.data)) return dataRec.data as RawWorkerStatus[];
      if (Array.isArray(dataRec)) return dataRec as RawWorkerStatus[];
    }
    
    if (Array.isArray(rec.workers)) return rec.workers as RawWorkerStatus[];
    if (Array.isArray(rec.items)) return rec.items as RawWorkerStatus[];
    
    for (const key of Object.keys(rec)) {
      if (Array.isArray(rec[key])) {
        return rec[key] as RawWorkerStatus[];
      }
    }
    return [];
  };

  const rawWorkers = getWorkersArray(dailyStatusListRes);
  const workersData = rawWorkers.map(normalizeWorkerStatus);

 const alertsPayload = asRecord(alertsRes)?.data;
 const apiAlerts = Array.isArray(alertsRes?.data?.alerts)
 ? alertsRes.data.alerts
 : Array.isArray(alertsPayload)
 ? asArray<DashboardAlert>(alertsPayload)
 : [];

 const filteredApiAlerts = apiAlerts.filter(
 (alert) =>
 alert.type?.toLowerCase() !== "late_workers" && alert.type?.toLowerCase() !== "late workers",
 );

 const generatedAlerts: DashboardAlert[] = workersData
 .filter((worker) => worker.lateMinutes > 0)
 .map((worker) => ({
 type: "TARDANZA",
 severity: "warning",
 total: 1,
 message: `${worker.workerName} llegó ${worker.lateMinutes} minutos tarde.`,
 }));

 const birthdaysPayload = asRecord(birthdaysRes)?.data;
 const rawBirthdays = Array.isArray(asRecord(birthdaysPayload)?.birthdays)
 ? asArray<unknown>(asRecord(birthdaysPayload)?.birthdays)
 : Array.isArray(birthdaysPayload)
 ? asArray<unknown>(birthdaysPayload)
 : Array.isArray(birthdaysRes)
 ? asArray<unknown>(birthdaysRes)
 : [];

 const birthdays = rawBirthdays
 .map((entry) => normalizeBirthdayWorker(entry))
 .filter((entry): entry is BirthdayWorker => Boolean(entry));

 // Construir datos del usuario desde la sesión ya disponible o desde el
 // resultado de la API como respaldo.
 const dashboardUser: DashboardUser = (() => {
  const fullName = sessionUser?.fullName?.trim() || "Usuario";
  const parts = fullName.split(" ").filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  const role = sessionUser?.role ?? "";
  return { firstName, lastName, fullName, role };
 })();

 const hasPartialFailure = results.some((r) => r.status === "rejected");

 return {
  user: dashboardUser,
  summary: {
  activeWorkers: summaryRes?.data?.activeWorkers ?? 0,
  totalRecords: attendanceTodayRes?.data?.totalRecords ?? 0,
  totalLate: attendanceTodayRes?.data?.totalLate ?? 0,
  fakeGpsAlerts: attendanceTodayRes?.data?.fakeGpsAlerts ?? 0,
  },
  alerts: [...generatedAlerts, ...filteredApiAlerts],
  weeklyChart: chartData,
  dailyStatusList: workersData,
  birthdays,
  ...(hasPartialFailure ? { _partialFailure: true } : {}),
 };
 },
};
