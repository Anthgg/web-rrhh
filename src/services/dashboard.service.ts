import { apiClient } from "@/lib/api/client";
import { normalizeBirthdayWorker, normalizeCurrentUserProfile } from "@/lib/api/normalizers";
import { getCurrentProfile } from "@/services/profile.service";
import type { BirthdayWorker } from "@/types";

type LooseRecord = Record<string, unknown>;

const asRecord = (value: unknown): LooseRecord | null =>
 value && typeof value === "object" ? (value as LooseRecord) : null;

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const asString = (value: unknown) => (typeof value === "string" ? value : "");

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
}

export const dashboardService = {
 async sendBirthdayGreeting(targetUserId: string) {
 return apiClient<{ success: boolean; message: string }>("/api/birthdays/greet", {
 method: "POST",
 body: JSON.stringify({ targetUserId }),
 });
 },

 async getAdminAttendanceDashboard(): Promise<AdminAttendanceDashboard> {
 const [
 userRes,
 summaryRes,
 attendanceTodayRes,
 alertsRes,
 weeklyChartRes,
 dailyStatusListRes,
 birthdaysRes,
 ] = await Promise.all([
 getCurrentProfile(),
 apiClient<DashboardSummaryResponse>("/api/dashboard/summary"),
 apiClient<AttendanceTodayResponse>("/api/dashboard/attendance-today"),
 apiClient<DashboardAlertsResponse>("/api/dashboard/alerts").catch(() => null),
 apiClient<WeeklyChartResponse>("/api/dashboard/weekly-chart"),
 apiClient<DailyStatusListResponse>("/api/dashboard/daily-status-list?page=1&limit=10"),
 apiClient<unknown>("/api/birthdays/all").catch(() => null),
 ]);

 const weeklyChartPayload = asRecord(weeklyChartRes)?.data;
 const chartData = Array.isArray(weeklyChartRes?.data)
 ? weeklyChartRes.data
 : Array.isArray(asRecord(weeklyChartPayload)?.items)
 ? asArray<WeeklyChartItem>(asRecord(weeklyChartPayload)?.items)
 : Array.isArray(weeklyChartRes)
 ? asArray<WeeklyChartItem>(weeklyChartRes)
 : [];

 const dailyStatusPayload = asRecord(dailyStatusListRes)?.data;
 const workersData = Array.isArray(asRecord(dailyStatusPayload)?.workers)
 ? asArray<WorkerStatus>(asRecord(dailyStatusPayload)?.workers)
 : Array.isArray(dailyStatusListRes?.data)
 ? asArray<WorkerStatus>(dailyStatusListRes.data)
 : Array.isArray(dailyStatusListRes)
 ? asArray<WorkerStatus>(dailyStatusListRes)
 : [];

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

 const normalizedUser = normalizeCurrentUserProfile(userRes);
 const [firstName = "", ...lastNameParts] = normalizedUser.fullName
 .split(" ")
 .filter(Boolean);
 const lastName = lastNameParts.join(" ");
 const dashboardUser: DashboardUser = {
 firstName,
 lastName,
 fullName: normalizedUser.fullName,
 role: normalizedUser.role !== "unknown" ? normalizedUser.role : "",
 };

 return {
 user: dashboardUser,
 summary: {
 activeWorkers: summaryRes.data?.activeWorkers ?? 0,
 totalRecords: attendanceTodayRes.data?.totalRecords ?? 0,
 totalLate: attendanceTodayRes.data?.totalLate ?? 0,
 fakeGpsAlerts: attendanceTodayRes.data?.fakeGpsAlerts ?? 0,
 },
 alerts: [...generatedAlerts, ...filteredApiAlerts],
 weeklyChart: chartData,
 dailyStatusList: workersData,
 birthdays,
 };
 },
};
