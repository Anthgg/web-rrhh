"use client";

import { useState } from "react";
import { MapPin, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attendanceService } from "@/services/attendance.service";

export function AttendanceAction() {
 const [loading, setLoading] = useState<"check-in" | "check-out" | null>(null);
 const [result, setResult] = useState<{
 success: boolean;
 message: string;
 details?: string;
 } | null>(null);

 const handleAttendance = async (type: "check-in" | "check-out") => {
 setLoading(type);
 setResult(null);

 if (!navigator.geolocation) {
 setResult({ success: false, message: "Geolocalización no soportada por el navegador." });
 setLoading(null);
 return;
 }

 navigator.geolocation.getCurrentPosition(
 async (position) => {
 try {
 const payload = {
 latitude: position.coords.latitude,
 longitude: position.coords.longitude,
 accuracy: position.coords.accuracy,
 device_info: {
 platform: navigator.platform || "web",
 browser: "Chrome/Web", // Placeholder
 userAgent: navigator.userAgent,
 },
 };

 const response =
 type === "check-in"
 ? await attendanceService.checkIn(payload)
 : await attendanceService.checkOut(payload);

 setResult({
 success: true,
 message: `Marcación registrada en ${response.workLocation || "tu lugar de trabajo"}.`,
 details: `Distancia: ${response.distanceMeters} m / Radio: ${response.allowedRadiusMeters} m`,
 });
 } catch (error: any) {
 // Extract specific error code handling if possible from API payload
 const apiError = error?.response?.data || {};
 const errCode = apiError?.error_code || apiError?.code;
 let errMsg = error.message || "Error desconocido";

 if (errCode === "WORK_LOCATION_REQUIRED") errMsg = "El trabajador no tiene un lugar de trabajo asignado para realizar marcaciones.";
 else if (errCode === "WORK_LOCATION_COORDINATES_REQUIRED") errMsg = "El lugar de trabajo asignado no tiene coordenadas configuradas.";
 else if (errCode === "WORK_LOCATION_INACTIVE") errMsg = "El lugar de trabajo asignado no está activo.";
 else if (errCode === "INVALID_COORDINATES") errMsg = "Debe enviar coordenadas válidas para registrar asistencia.";
 else if (errCode === "GPS_ACCURACY_TOO_LOW") errMsg = "La precisión GPS es insuficiente para registrar asistencia.";
 else if (errCode === "OUT_OF_WORK_LOCATION_RADIUS") {
 errMsg = "No se puede registrar la marcación porque se encuentra fuera del radio permitido.";
 if (apiError.distance_meters !== undefined) {
 errMsg += ` Distancia actual: ${apiError.distance_meters} m. Radio permitido: ${apiError.allowed_radius_meters} m. Lugar asignado: ${apiError.work_location || "N/A"}.`;
 }
 } else if (apiError.message) {
 errMsg = apiError.message;
 }

 setResult({
 success: false,
 message: errMsg,
 });
 } finally {
 setLoading(null);
 }
 },
 (error) => {
 let msg = "No se pudo obtener la ubicación.";
 if (error.code === 1) msg = "El usuario denegó el permiso de ubicación.";
 else if (error.code === 2) msg = "Ubicación no disponible.";
 else if (error.code === 3) msg = "Tiempo de espera agotado al obtener ubicación.";
 
 setResult({ success: false, message: msg });
 setLoading(null);
 },
 {
 enableHighAccuracy: true,
 timeout: 10000,
 maximumAge: 0,
 }
 );
 };

 return (
 <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-card/5 p-4 border border-white/10">
 <div className="flex items-center gap-2 text-white/90">
 <MapPin className="size-4" />
 <span className="text-sm font-semibold">Registro de Asistencia (GPS)</span>
 </div>
 <div className="flex flex-wrap gap-3">
 <Button
 onClick={() => handleAttendance("check-in")}
 disabled={loading !== null}
 className="bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
 >
 {loading === "check-in" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
 Check-In
 </Button>
 <Button
 onClick={() => handleAttendance("check-out")}
 disabled={loading !== null}
 className="bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50"
 >
 {loading === "check-out" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
 Check-Out
 </Button>
 </div>
 {result && (
 <div className={`mt-2 flex items-start gap-2 rounded-lg p-3 text-sm ${result.success ? "bg-emerald-900/40 text-emerald-200 border border-emerald-800/50" : "bg-rose-900/40 text-rose-200 border border-rose-800/50"}`}>
 {result.success ? <CheckCircle2 className="size-5 shrink-0" /> : <XCircle className="size-5 shrink-0" />}
 <div>
 <p className="font-medium">{result.message}</p>
 {result.details && <p className="mt-1 text-xs opacity-80">{result.details}</p>}
 </div>
 </div>
 )}
 </div>
 );
}
