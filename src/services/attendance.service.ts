import { apiClient } from "@/lib/api/client";

export interface AttendancePayload {
 latitude: number;
 longitude: number;
 accuracy: number;
 photo_url?: string;
 device_info: {
 platform: string;
 browser: string;
 userAgent: string;
 };
}

export interface AttendanceResponse {
 workLocationId?: string;
 workLocation?: string;
 distanceMeters?: number;
 allowedRadiusMeters?: number;
 isLocationValid?: boolean;
 message?: string;
}

export const attendanceService = {
 checkIn: (payload: AttendancePayload) => {
 return apiClient<AttendanceResponse>("/api/attendance/check-in", {
 method: "POST",
 body: payload,
 });
 },

 checkOut: (payload: AttendancePayload) => {
 return apiClient<AttendanceResponse>("/api/attendance/check-out", {
 method: "POST",
 body: payload,
 });
 },
};
