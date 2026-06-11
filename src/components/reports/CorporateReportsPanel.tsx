"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
 CalendarCheck,
 CreditCard,
 FileText,
 Users,
 BarChart3,
 Palmtree,
 FolderOpen,
 Settings2,
 Plus,
 Trash2,
 AlertCircle,
 Table,
 Sparkles,
 Loader2,
 Download
} from "lucide-react";

import { ReportsLayout } from "@/components/reports/ReportsLayout";
import { LoadingState } from "@/components/reports/LoadingState";
import { ErrorState } from "@/components/reports/ErrorState";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { DownloadPdfButton } from "@/components/reports/DownloadPdfButton";
import { payrollService } from "@/services/payroll.service";
import { workersService } from "@/services/workers.service";
import { downloadReportPdf } from "@/services/reports/downloadReportPdf";
import type { PayrollPeriod, WorkerRecord } from "@/types";
import { toast } from "sonner";

type CorporatePdfFilters = Record<string, string | number | boolean | null | undefined>;

interface RequestsReportFilters extends CorporatePdfFilters {
 start_date: string;
 end_date: string;
 status: "" | "pending" | "approved" | "rejected" | "observed" | "cancelled";
 worker_id: string;
}

interface AttendanceReportFilters extends CorporatePdfFilters {
 start_date: string;
 end_date: string;
 worker_id: string;
}

interface WorkersReportFilters extends CorporatePdfFilters {
 status: "" | "ACTIVE" | "INACTIVE";
 department_id: string;
}

interface PayrollReportFilters extends CorporatePdfFilters {
 payroll_period_id: string;
 status: string;
}

interface MonthlySummaryReportFilters extends CorporatePdfFilters {
 start_date: string;
 end_date: string;
 department_id: string;
}

interface VacationsReportFilters extends CorporatePdfFilters {
 year: number;
 worker_id: string;
 status: string;
}

interface DocumentsReportFilters extends CorporatePdfFilters {
 category: string;
 status: string;
}

interface DepartmentOption {
 id: string;
 name: string;
}

function getErrorMessage(error: unknown) {
 if (error instanceof Error) {
 return error.message;
 }
 return "Error al cargar los catálogos.";
}

// Default estable a nivel de módulo
const EMPTY_DEPARTMENTS: DepartmentOption[] = [];

function validateDateRange(startDate: string, endDate: string) {
 if (!startDate || !endDate) {
 return "Debes completar la fecha de inicio y fin.";
 }
 if (startDate > endDate) {
 return "La fecha de inicio no puede ser posterior a la fecha de fin.";
 }
 return null;
}

export function CorporateReportsPanel({
 departments = EMPTY_DEPARTMENTS,
}: {
 departments?: DepartmentOption[];
}) {
 const [requestFilters, setRequestFilters] = useState<RequestsReportFilters>({
 start_date: "",
 end_date: "",
 status: "",
 worker_id: "",
 });
 const [attendanceFilters, setAttendanceFilters] = useState<AttendanceReportFilters>({
 start_date: "",
 end_date: "",
 worker_id: "",
 });
 const [workersFilters, setWorkersFilters] = useState<WorkersReportFilters>({
 status: "",
 department_id: "",
 });
 const [payrollFilters, setPayrollFilters] = useState<PayrollReportFilters>({
 payroll_period_id: "",
 status: "",
 });
 const [monthlyFilters, setMonthlyFilters] = useState<MonthlySummaryReportFilters>({
 start_date: "",
 end_date: "",
 department_id: "",
 });
 const [vacationFilters, setVacationFilters] = useState<VacationsReportFilters>({
 year: new Date().getFullYear(),
 worker_id: "",
 status: "",
 });
 const [documentFilters, setDocumentFilters] = useState<DocumentsReportFilters>({
 category: "",
 status: "",
 });

 // States for dynamic header overrides
 const [activeSettingsCard, setActiveSettingsCard] = useState<string | null>(null);
 const [requestCustom, setRequestCustom] = useState({ title: "", docType: "", label: "" });
 const [attendanceCustom, setAttendanceCustom] = useState({ title: "", docType: "", label: "" });
 const [workersCustom, setWorkersCustom] = useState({ title: "", docType: "", label: "" });
 const [payrollCustom, setPayrollCustom] = useState({ title: "", docType: "", label: "" });
 const [monthlyCustom, setMonthlyCustom] = useState({ title: "", docType: "", label: "" });
 const [vacationCustom, setVacationCustom] = useState({ title: "", docType: "", label: "" });
 const [documentCustom, setDocumentCustom] = useState({ title: "", docType: "", label: "" });

 // State for the interactive visual table (customData export)
 const [tableData, setTableData] = useState([
 { id: "1", full_name: "Juan Pérez", check_in: "08:00 AM", status: "Presente" },
 { id: "2", full_name: "María Gómez", check_in: "08:15 AM", status: "Tardanza" },
 { id: "3", full_name: "Carlos Plaza", check_in: "07:55 AM", status: "Presente" },
 ]);
 const [customTableTitle, setCustomTableTitle] = useState("Control de Horas del Personal de Vigilancia");
 const [customTableDocType, setCustomTableDocType] = useState("Registro Interno de Seguridad");
 const [customTableLabel, setCustomTableLabel] = useState("F-SEC-01");
 const [isExportingCustomTable, setIsExportingCustomTable] = useState(false);

 const {
 data: workersResponse,
 error: workersError,
 isError: isWorkersError,
 isLoading: isWorkersLoading,
 refetch: refetchWorkers,
 } = useQuery({
 queryKey: ["corporate-report-workers"],
 queryFn: () => workersService.list({ page: 1, pageSize: 100 }),
 staleTime: 5 * 60_000,
 refetchOnWindowFocus: false,
 });
 const {
 data: payrollPeriodsResponse,
 isLoading: isPayrollPeriodsLoading,
 } = useQuery({
 queryKey: ["corporate-report-payroll-periods"],
 queryFn: payrollService.periods,
 staleTime: 5 * 60_000,
 refetchOnWindowFocus: false,
 });

 const workers = useMemo<WorkerRecord[]>(() => workersResponse?.items ?? [], [workersResponse]);
 const payrollPeriods = useMemo<PayrollPeriod[]>(() => payrollPeriodsResponse ?? [], [payrollPeriodsResponse]);

 // Validaciones locales de rango de fechas
 const requestValidationError = validateDateRange(requestFilters.start_date, requestFilters.end_date);
 const attendanceValidationError = validateDateRange(attendanceFilters.start_date, attendanceFilters.end_date);
 const monthlyValidationError = validateDateRange(monthlyFilters.start_date, monthlyFilters.end_date);

 const toggleSettings = (cardName: string) => {
 setActiveSettingsCard(activeSettingsCard === cardName ? null : cardName);
 };

 const handleAddRow = () => {
 setTableData([
 ...tableData,
 {
 id: Date.now().toString(),
 full_name: "Nuevo Colaborador",
 check_in: "08:00 AM",
 status: "Presente",
 },
 ]);
 };

 const handleDeleteRow = (id: string) => {
 setTableData(tableData.filter((row) => row.id !== id));
 };

 const handleCellChange = (id: string, field: string, value: string) => {
 setTableData(
 tableData.map((row) => (row.id === id ? { ...row, [field]: value } : row))
 );
 };

 const handleExportCustomTable = async () => {
 setIsExportingCustomTable(true);
 toast.loading("Generando PDF corporativo con datos de tabla...", { id: "custom-table-toast" });
 try {
 await downloadReportPdf({
 endpoint: "/api/reports/attendance/pdf",
 customData: {
 reportTitle: customTableTitle || undefined,
 documentType: customTableDocType || undefined,
 internalLabel: customTableLabel || undefined,
 columns: [
 { key: "full_name", label: "Colaborador", widthRatio: 0.35 },
 { key: "check_in", label: "Ingreso", widthRatio: 0.30 },
 { key: "status", label: "Estatus", widthRatio: 0.35 }
 ],
 rows: tableData.map(({ full_name, check_in, status }) => ({ full_name, check_in, status })),
 summary: {
 "Total Efectivos": tableData.length,
 "Tardanzas": tableData.filter((r) => r.status === "Tardanza").length,
 }
 }
 });
 toast.success("PDF de tabla exportado y descargado con éxito.", { id: "custom-table-toast" });
 } catch (err: unknown) {
 toast.error(err instanceof Error ? err.message : "Error al exportar reporte con customData.", { id: "custom-table-toast" });
 } finally {
 setIsExportingCustomTable(false);
 }
 };

 if (isWorkersError) {
 return (
 <ReportsLayout
 title="Reportes Corporativos"
 description="Genera documentos oficiales en PDF con la identidad corporativa de FABRYOR."
 >
 <ErrorState
 title="No se pudieron cargar los catálogos"
 description={getErrorMessage(workersError)}
 onRetry={() => void refetchWorkers()}
 />
 </ReportsLayout>
 );
 }

 if (isWorkersLoading && !workersResponse) {
 return (
 <ReportsLayout
 title="Reportes Corporativos"
 description="Genera documentos oficiales en PDF con la identidad corporativa de FABRYOR."
 >
 <LoadingState title="Cargando catálogos de reportes corporativos." />
 </ReportsLayout>
 );
 }

 return (
 <ReportsLayout
 title="Reportes Corporativos"
 description="Genera documentos oficiales en PDF con la identidad corporativa de FABRYOR."
 >
 <div className="grid gap-6">
 <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-border dark:bg-foreground">
 <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-card ">
 <Image
 src="/logo.png"
 alt="FABRYOR SERVICIOS GENERALES S.A.C."
 fill
 sizes="64px"
 className="object-contain p-2"
 priority
 />
 </div>
 <div className="grid gap-1">
 <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-muted-foreground">
 FABRYOR SERVICIOS GENERALES S.A.C.
 </p>
 <p className="text-sm leading-6 text-muted-foreground ">
 Módulo de reportes administrativos integrados con la plantilla corporativa institucional de FABRYOR.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
 {/* 1. Solicitudes */}
 <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-border dark:bg-foreground flex flex-col justify-between hover:shadow-md transition-shadow">
 <div className="grid gap-4 mb-5">
 <div className="flex items-start gap-4">
 <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
 <FileText className="size-5" />
 </div>
 <div className="grid gap-1">
 <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Solicitudes</h3>
 <p className="text-sm leading-5 text-muted-foreground">Exporta solicitudes laborales filtradas por rango de fechas, estado y trabajador.</p>
 </div>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame label="Fecha inicio">
 <Input
 type="date"
 value={requestFilters.start_date}
 onChange={(event) =>
 setRequestFilters((current) => ({ ...current, start_date: event.target.value }))
 }
 />
 </FieldFrame>
 <FieldFrame label="Fecha fin">
 <Input
 type="date"
 value={requestFilters.end_date}
 onChange={(event) =>
 setRequestFilters((current) => ({ ...current, end_date: event.target.value }))
 }
 />
 </FieldFrame>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame label="Estado">
 <Select
 value={requestFilters.status}
 onChange={(event) =>
 setRequestFilters((current) => ({
 ...current,
 status: event.target.value as RequestsReportFilters["status"],
 }))
 }
 >
 <option value="">Todos</option>
 <option value="pending">Pendiente</option>
 <option value="approved">Aprobado</option>
 <option value="rejected">Rechazado</option>
 <option value="observed">Observado</option>
 <option value="cancelled">Cancelado</option>
 </Select>
 </FieldFrame>
 <FieldFrame label="Trabajador opcional">
 <Select
 value={requestFilters.worker_id}
 onChange={(event) =>
 setRequestFilters((current) => ({ ...current, worker_id: event.target.value }))
 }
 >
 <option value="">Todos</option>
 {workers.map((worker) => (
 <option key={worker.id} value={worker.id}>
 {worker.fullName}
 </option>
 ))}
 </Select>
 </FieldFrame>
 </div>

 {requestValidationError && (
 <p className="text-xs text-rose-500 font-medium">{requestValidationError}</p>
 )}

 {/* Personalización */}
 <div className="border-t border-border dark:border-border pt-3">
 <button
 type="button"
 onClick={() => toggleSettings("requests")}
 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-slate-200 transition-colors"
 >
 <Settings2 className="size-3.5" />
 {activeSettingsCard === "requests" ? "Ocultar personalización" : "Personalizar títulos (Opcional)"}
 </button>

 {activeSettingsCard === "requests" && (
 <div className="grid gap-3 pt-3 grid-cols-1 sm:grid-cols-3">
 <FieldFrame label="Título personalizado" hint="Título principal oficial">
 <Input
 value={requestCustom.title}
 onChange={(e) => setRequestCustom({ ...requestCustom, title: e.target.value })}
 placeholder="Ej. REPORTE EXTRAORDINARIO"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Tipo de documento" hint="Subtítulo oficial">
 <Input
 value={requestCustom.docType}
 onChange={(e) => setRequestCustom({ ...requestCustom, docType: e.target.value })}
 placeholder="Ej. Nómina Administrativa"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Código de control" hint="internalLabel oficial">
 <Input
 value={requestCustom.label}
 onChange={(e) => setRequestCustom({ ...requestCustom, label: e.target.value })}
 placeholder="Ej. F-RRHH-02"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 </div>
 )}
 </div>
 </div>

 <DownloadPdfButton
 reportType="requests"
 filters={requestFilters}
 reportTitle={requestCustom.title || undefined}
 documentType={requestCustom.docType || "Reporte de Solicitudes"}
 internalLabel={requestCustom.label || undefined}
 disabled={Boolean(requestValidationError)}
 className="w-full h-11 rounded-xl bg-blue-900 text-white shadow hover:bg-blue-950 transition-all active:scale-[0.98]"
 >
 Descargar PDF de Solicitudes
 </DownloadPdfButton>
 </div>

 {/* 2. Asistencia */}
 <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-border dark:bg-foreground flex flex-col justify-between hover:shadow-md transition-shadow">
 <div className="grid gap-4 mb-5">
 <div className="flex items-start gap-4">
 <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
 <CalendarCheck className="size-5" />
 </div>
 <div className="grid gap-1">
 <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Asistencia</h3>
 <p className="text-sm leading-5 text-muted-foreground">Descarga el consolidado oficial de asistencia en PDF por colaborador o periodo.</p>
 </div>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame label="Fecha inicio">
 <Input
 type="date"
 value={attendanceFilters.start_date}
 onChange={(event) =>
 setAttendanceFilters((current) => ({ ...current, start_date: event.target.value }))
 }
 />
 </FieldFrame>
 <FieldFrame label="Fecha fin">
 <Input
 type="date"
 value={attendanceFilters.end_date}
 onChange={(event) =>
 setAttendanceFilters((current) => ({ ...current, end_date: event.target.value }))
 }
 />
 </FieldFrame>
 </div>

 <FieldFrame label="Trabajador opcional">
 <Select
 value={attendanceFilters.worker_id}
 onChange={(event) =>
 setAttendanceFilters((current) => ({ ...current, worker_id: event.target.value }))
 }
 >
 <option value="">Todos</option>
 {workers.map((worker) => (
 <option key={worker.id} value={worker.id}>
 {worker.fullName}
 </option>
 ))}
 </Select>
 </FieldFrame>

 {attendanceValidationError && (
 <p className="text-xs text-rose-500 font-medium">{attendanceValidationError}</p>
 )}

 {/* Personalización */}
 <div className="border-t border-border dark:border-border pt-3">
 <button
 type="button"
 onClick={() => toggleSettings("attendance")}
 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-slate-200 transition-colors"
 >
 <Settings2 className="size-3.5" />
 {activeSettingsCard === "attendance" ? "Ocultar personalización" : "Personalizar títulos (Opcional)"}
 </button>

 {activeSettingsCard === "attendance" && (
 <div className="grid gap-3 pt-3 grid-cols-1 sm:grid-cols-3">
 <FieldFrame label="Título personalizado" hint="Título principal oficial">
 <Input
 value={attendanceCustom.title}
 onChange={(e) => setAttendanceCustom({ ...attendanceCustom, title: e.target.value })}
 placeholder="Ej. CONTROL DE ASISTENCIA"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Tipo de documento" hint="Subtítulo oficial">
 <Input
 value={attendanceCustom.docType}
 onChange={(e) => setAttendanceCustom({ ...attendanceCustom, docType: e.target.value })}
 placeholder="Ej. Registro Mensual"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Código de control" hint="internalLabel oficial">
 <Input
 value={attendanceCustom.label}
 onChange={(e) => setAttendanceCustom({ ...attendanceCustom, label: e.target.value })}
 placeholder="Ej. F-RRHH-ATT-01"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 </div>
 )}
 </div>
 </div>

 <DownloadPdfButton
 reportType="attendance"
 filters={attendanceFilters}
 reportTitle={attendanceCustom.title || undefined}
 documentType={attendanceCustom.docType || "Reporte de Asistencia"}
 internalLabel={attendanceCustom.label || undefined}
 disabled={Boolean(attendanceValidationError)}
 className="w-full h-11 rounded-xl bg-blue-900 text-white shadow hover:bg-blue-950 transition-all active:scale-[0.98]"
 >
 Descargar PDF de Asistencia
 </DownloadPdfButton>
 </div>

 {/* 3. Colaboradores */}
 <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-border dark:bg-foreground flex flex-col justify-between hover:shadow-md transition-shadow">
 <div className="grid gap-4 mb-5">
 <div className="flex items-start gap-4">
 <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
 <Users className="size-5" />
 </div>
 <div className="grid gap-1">
 <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Colaboradores</h3>
 <p className="text-sm leading-5 text-muted-foreground">Genera el reporte PDF de trabajadores activos o inactivos con filtro departamental.</p>
 </div>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame label="Estado">
 <Select
 value={workersFilters.status}
 onChange={(event) =>
 setWorkersFilters((current) => ({
 ...current,
 status: event.target.value as WorkersReportFilters["status"],
 }))
 }
 >
 <option value="">Todos</option>
 <option value="ACTIVE">Activos</option>
 <option value="INACTIVE">Inactivos</option>
 </Select>
 </FieldFrame>

 <FieldFrame
 label="Departamento opcional"
 hint={!departments.length ? "Catálogo pendiente de sincronización." : undefined}
 >
 <Select
 value={workersFilters.department_id}
 onChange={(event) =>
 setWorkersFilters((current) => ({ ...current, department_id: event.target.value }))
 }
 >
 <option value="">Todos</option>
 {departments.map((department) => (
 <option key={department.id} value={department.id}>
 {department.name}
 </option>
 ))}
 </Select>
 </FieldFrame>
 </div>

 {/* Personalización */}
 <div className="border-t border-border dark:border-border pt-3">
 <button
 type="button"
 onClick={() => toggleSettings("workers")}
 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-slate-200 transition-colors"
 >
 <Settings2 className="size-3.5" />
 {activeSettingsCard === "workers" ? "Ocultar personalización" : "Personalizar títulos (Opcional)"}
 </button>

 {activeSettingsCard === "workers" && (
 <div className="grid gap-3 pt-3 grid-cols-1 sm:grid-cols-3">
 <FieldFrame label="Título personalizado" hint="Título principal oficial">
 <Input
 value={workersCustom.title}
 onChange={(e) => setWorkersCustom({ ...workersCustom, title: e.target.value })}
 placeholder="Ej. REPORTE DE TRABAJADORES"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Tipo de documento" hint="Subtítulo oficial">
 <Input
 value={workersCustom.docType}
 onChange={(e) => setWorkersCustom({ ...workersCustom, docType: e.target.value })}
 placeholder="Ej. Padrón General"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Código de control" hint="internalLabel oficial">
 <Input
 value={workersCustom.label}
 onChange={(e) => setWorkersCustom({ ...workersCustom, label: e.target.value })}
 placeholder="Ej. F-RRHH-WRK-01"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 </div>
 )}
 </div>
 </div>

 <DownloadPdfButton
 reportType="workers"
 filters={workersFilters}
 reportTitle={workersCustom.title || undefined}
 documentType={workersCustom.docType || "Reporte de Colaboradores"}
 internalLabel={workersCustom.label || undefined}
 className="w-full h-11 rounded-xl bg-blue-900 text-white shadow hover:bg-blue-950 transition-all active:scale-[0.98]"
 >
 Descargar PDF de Colaboradores
 </DownloadPdfButton>
 </div>

 {/* 4. Nómina / Planilla */}
 <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-border dark:bg-foreground flex flex-col justify-between hover:shadow-md transition-shadow">
 <div className="grid gap-4 mb-5">
 <div className="flex items-start gap-4">
 <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
 <CreditCard className="size-5" />
 </div>
 <div className="grid gap-1">
 <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Nómina / Planilla</h3>
 <p className="text-sm leading-5 text-muted-foreground">Descarga el documento PDF de planilla por periodo y estado de aprobación.</p>
 </div>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame
 label="Periodo de planilla opcional"
 hint={isPayrollPeriodsLoading ? "Cargando periodos..." : undefined}
 >
 <Select
 value={payrollFilters.payroll_period_id}
 onChange={(event) =>
 setPayrollFilters((current) => ({
 ...current,
 payroll_period_id: event.target.value,
 }))
 }
 >
 <option value="">Todos</option>
 {payrollPeriods.map((period) => (
 <option key={period.id} value={period.id}>
 {period.label}
 </option>
 ))}
 </Select>
 </FieldFrame>

 <FieldFrame label="Estado opcional">
 <Input
 value={payrollFilters.status}
 onChange={(event) =>
 setPayrollFilters((current) => ({ ...current, status: event.target.value }))
 }
 placeholder="approved"
 />
 </FieldFrame>
 </div>

 {/* Personalización */}
 <div className="border-t border-border dark:border-border pt-3">
 <button
 type="button"
 onClick={() => toggleSettings("payroll")}
 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-slate-200 transition-colors"
 >
 <Settings2 className="size-3.5" />
 {activeSettingsCard === "payroll" ? "Ocultar personalización" : "Personalizar títulos (Opcional)"}
 </button>

 {activeSettingsCard === "payroll" && (
 <div className="grid gap-3 pt-3 grid-cols-1 sm:grid-cols-3">
 <FieldFrame label="Título personalizado" hint="Título principal oficial">
 <Input
 value={payrollCustom.title}
 onChange={(e) => setPayrollCustom({ ...payrollCustom, title: e.target.value })}
 placeholder="Ej. PLANILLA MENSUAL REVISADA"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Tipo de documento" hint="Subtítulo oficial">
 <Input
 value={payrollCustom.docType}
 onChange={(e) => setPayrollCustom({ ...payrollCustom, docType: e.target.value })}
 placeholder="Ej. Nómina Administrativa"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Código de control" hint="internalLabel oficial">
 <Input
 value={payrollCustom.label}
 onChange={(e) => setPayrollCustom({ ...payrollCustom, label: e.target.value })}
 placeholder="Ej. F-RRHH-PAY-01"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 </div>
 )}
 </div>
 </div>

 <DownloadPdfButton
 reportType="payroll"
 filters={payrollFilters}
 reportTitle={payrollCustom.title || undefined}
 documentType={payrollCustom.docType || "Reporte de Nómina"}
 internalLabel={payrollCustom.label || undefined}
 className="w-full h-11 rounded-xl bg-blue-900 text-white shadow hover:bg-blue-950 transition-all active:scale-[0.98]"
 >
 Descargar PDF de Nómina
 </DownloadPdfButton>
 </div>

 {/* 5. Resumen Mensual */}
 <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-border dark:bg-foreground flex flex-col justify-between hover:shadow-md transition-shadow">
 <div className="grid gap-4 mb-5">
 <div className="flex items-start gap-4">
 <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
 <BarChart3 className="size-5" />
 </div>
 <div className="grid gap-1">
 <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Resumen Mensual</h3>
 <p className="text-sm leading-5 text-muted-foreground">Consolidado general de horas, incidencias y eventos operacionales del mes.</p>
 </div>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame label="Fecha inicio">
 <Input
 type="date"
 value={monthlyFilters.start_date}
 onChange={(event) =>
 setMonthlyFilters((current) => ({ ...current, start_date: event.target.value }))
 }
 />
 </FieldFrame>
 <FieldFrame label="Fecha fin">
 <Input
 type="date"
 value={monthlyFilters.end_date}
 onChange={(event) =>
 setMonthlyFilters((current) => ({ ...current, end_date: event.target.value }))
 }
 />
 </FieldFrame>
 </div>

 <FieldFrame label="Departamento opcional">
 <Select
 value={monthlyFilters.department_id}
 onChange={(event) =>
 setMonthlyFilters((current) => ({ ...current, department_id: event.target.value }))
 }
 >
 <option value="">Todos</option>
 {departments.map((department) => (
 <option key={department.id} value={department.id}>
 {department.name}
 </option>
 ))}
 </Select>
 </FieldFrame>

 {monthlyValidationError && (
 <p className="text-xs text-rose-500 font-medium">{monthlyValidationError}</p>
 )}

 {/* Personalización */}
 <div className="border-t border-border dark:border-border pt-3">
 <button
 type="button"
 onClick={() => toggleSettings("monthly")}
 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-slate-200 transition-colors"
 >
 <Settings2 className="size-3.5" />
 {activeSettingsCard === "monthly" ? "Ocultar personalización" : "Personalizar títulos (Opcional)"}
 </button>

 {activeSettingsCard === "monthly" && (
 <div className="grid gap-3 pt-3 grid-cols-1 sm:grid-cols-3">
 <FieldFrame label="Título personalizado" hint="Título principal oficial">
 <Input
 value={monthlyCustom.title}
 onChange={(e) => setMonthlyCustom({ ...monthlyCustom, title: e.target.value })}
 placeholder="Ej. RESUMEN GESTIÓN MENSUAL"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Tipo de documento" hint="Subtítulo oficial">
 <Input
 value={monthlyCustom.docType}
 onChange={(e) => setMonthlyCustom({ ...monthlyCustom, docType: e.target.value })}
 placeholder="Ej. Cuadro Consolidado"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Código de control" hint="internalLabel oficial">
 <Input
 value={monthlyCustom.label}
 onChange={(e) => setMonthlyCustom({ ...monthlyCustom, label: e.target.value })}
 placeholder="Ej. F-RRHH-MON-01"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 </div>
 )}
 </div>
 </div>

 <DownloadPdfButton
 reportType="monthly-summary"
 filters={monthlyFilters}
 reportTitle={monthlyCustom.title || undefined}
 documentType={monthlyCustom.docType || "Reporte de Resumen Mensual"}
 internalLabel={monthlyCustom.label || undefined}
 disabled={Boolean(monthlyValidationError)}
 className="w-full h-11 rounded-xl bg-blue-900 text-white shadow hover:bg-blue-950 transition-all active:scale-[0.98]"
 >
 Descargar Resumen Mensual
 </DownloadPdfButton>
 </div>

 {/* 6. Vacaciones */}
 <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-border dark:bg-foreground flex flex-col justify-between hover:shadow-md transition-shadow">
 <div className="grid gap-4 mb-5">
 <div className="flex items-start gap-4">
 <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
 <Palmtree className="size-5" />
 </div>
 <div className="grid gap-1">
 <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Vacaciones</h3>
 <p className="text-sm leading-5 text-muted-foreground">Historial y saldos de vacaciones por colaborador, año fiscal o estado.</p>
 </div>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame label="Año fiscal">
 <Input
 type="number"
 value={vacationFilters.year || ""}
 suppressHydrationWarning
 onChange={(event) =>
 setVacationFilters((current) => ({ ...current, year: parseInt(event.target.value) || new Date().getFullYear() }))
 }
 />
 </FieldFrame>

 <FieldFrame label="Estado de solicitud">
 <Select
 value={vacationFilters.status}
 onChange={(event) =>
 setVacationFilters((current) => ({ ...current, status: event.target.value }))
 }
 >
 <option value="">Todos</option>
 <option value="approved">Aprobado</option>
 <option value="pending">Pendiente</option>
 <option value="rejected">Rechazado</option>
 </Select>
 </FieldFrame>
 </div>

 <FieldFrame label="Trabajador opcional">
 <Select
 value={vacationFilters.worker_id}
 onChange={(event) =>
 setVacationFilters((current) => ({ ...current, worker_id: event.target.value }))
 }
 >
 <option value="">Todos</option>
 {workers.map((worker) => (
 <option key={worker.id} value={worker.id}>
 {worker.fullName}
 </option>
 ))}
 </Select>
 </FieldFrame>

 {/* Personalización */}
 <div className="border-t border-border dark:border-border pt-3">
 <button
 type="button"
 onClick={() => toggleSettings("vacations")}
 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-slate-200 transition-colors"
 >
 <Settings2 className="size-3.5" />
 {activeSettingsCard === "vacations" ? "Ocultar personalización" : "Personalizar títulos (Opcional)"}
 </button>

 {activeSettingsCard === "vacations" && (
 <div className="grid gap-3 pt-3 grid-cols-1 sm:grid-cols-3">
 <FieldFrame label="Título personalizado" hint="Título principal oficial">
 <Input
 value={vacationCustom.title}
 onChange={(e) => setVacationCustom({ ...vacationCustom, title: e.target.value })}
 placeholder="Ej. RESUMEN GESTIÓN VACACIONES"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Tipo de documento" hint="Subtítulo oficial">
 <Input
 value={vacationCustom.docType}
 onChange={(e) => setVacationCustom({ ...vacationCustom, docType: e.target.value })}
 placeholder="Ej. Reporte General de Saldos"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Código de control" hint="internalLabel oficial">
 <Input
 value={vacationCustom.label}
 onChange={(e) => setVacationCustom({ ...vacationCustom, label: e.target.value })}
 placeholder="Ej. F-RRHH-VAC-01"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 </div>
 )}
 </div>
 </div>

 <DownloadPdfButton
 reportType="vacations"
 filters={vacationFilters}
 reportTitle={vacationCustom.title || undefined}
 documentType={vacationCustom.docType || "Reporte de Vacaciones"}
 internalLabel={vacationCustom.label || undefined}
 className="w-full h-11 rounded-xl bg-blue-900 text-white shadow hover:bg-blue-950 transition-all active:scale-[0.98]"
 >
 Descargar PDF de Vacaciones
 </DownloadPdfButton>
 </div>

 {/* 7. Documentos */}
 <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-border dark:bg-foreground flex flex-col justify-between hover:shadow-md transition-shadow">
 <div className="grid gap-4 mb-5">
 <div className="flex items-start gap-4">
 <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
 <FolderOpen className="size-5" />
 </div>
 <div className="grid gap-1">
 <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Documentos</h3>
 <p className="text-sm leading-5 text-muted-foreground">Expediente corporativo y control de vigencia documental de los colaboradores.</p>
 </div>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame label="Categoría de documento">
 <Input
 value={documentFilters.category}
 placeholder="Ej. boleta, contrato"
 onChange={(event) =>
 setDocumentFilters((current) => ({ ...current, category: event.target.value }))
 }
 />
 </FieldFrame>

 <FieldFrame label="Estado de vigencia">
 <Select
 value={documentFilters.status}
 onChange={(event) =>
 setDocumentFilters((current) => ({ ...current, status: event.target.value }))
 }
 >
 <option value="">Todos</option>
 <option value="available">Disponible</option>
 <option value="pending">Pendiente</option>
 <option value="expired">Vencido</option>
 <option value="missing">Faltante</option>
 </Select>
 </FieldFrame>
 </div>

 {/* Personalización */}
 <div className="border-t border-border dark:border-border pt-3">
 <button
 type="button"
 onClick={() => toggleSettings("documents")}
 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-slate-200 transition-colors"
 >
 <Settings2 className="size-3.5" />
 {activeSettingsCard === "documents" ? "Ocultar personalización" : "Personalizar títulos (Opcional)"}
 </button>

 {activeSettingsCard === "documents" && (
 <div className="grid gap-3 pt-3 grid-cols-1 sm:grid-cols-3">
 <FieldFrame label="Título personalizado" hint="Título principal oficial">
 <Input
 value={documentCustom.title}
 onChange={(e) => setDocumentCustom({ ...documentCustom, title: e.target.value })}
 placeholder="Ej. EXPEDIENTE DOCUMENTAL FABRYOR"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Tipo de documento" hint="Subtítulo oficial">
 <Input
 value={documentCustom.docType}
 onChange={(e) => setDocumentCustom({ ...documentCustom, docType: e.target.value })}
 placeholder="Ej. Legajo de Contratos"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Código de control" hint="internalLabel oficial">
 <Input
 value={documentCustom.label}
 onChange={(e) => setDocumentCustom({ ...documentCustom, label: e.target.value })}
 placeholder="Ej. F-RRHH-DOC-01"
 className="text-xs h-9 rounded-xl"
 />
 </FieldFrame>
 </div>
 )}
 </div>
 </div>

 <DownloadPdfButton
 reportType="documents"
 filters={documentFilters}
 reportTitle={documentCustom.title || undefined}
 documentType={documentCustom.docType || "Reporte de Documentos"}
 internalLabel={documentCustom.label || undefined}
 className="w-full h-11 rounded-xl bg-blue-900 text-white shadow hover:bg-blue-950 transition-all active:scale-[0.98]"
 >
 Descargar PDF de Documentos
 </DownloadPdfButton>
 </div>
 </div>

 {/* 8. Interactive Custom Table Section (customData) */}
 <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-border dark:bg-foreground mt-2">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border dark:border-border/80">
 <div className="flex items-start gap-4">
 <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 shrink-0">
 <Table className="size-5" />
 </div>
 <div className="grid gap-1">
 <div className="flex items-center gap-2">
 <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Exportación Directa de Tabla Visual (customData)</h3>
 <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
 <Sparkles className="size-3" />
 Mapeo Manual
 </span>
 </div>
 <p className="text-sm leading-5 text-muted-foreground">
 Modifica las filas del estado de React local y exporta la tabla en tiempo real, aplicando títulos y subtítulos personalizados en el JSON.
 </p>
 </div>
 </div>
 </div>

 <div className="grid gap-4 mb-6 grid-cols-1 md:grid-cols-3">
 <FieldFrame label="Título del Reporte" hint="reportTitle (ej: Control de Horas)">
 <Input
 value={customTableTitle}
 onChange={(e) => setCustomTableTitle(e.target.value)}
 placeholder="Título del reporte corporativo"
 className="h-10 text-sm rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Tipo de Documento" hint="documentType (ej: Registro Interno)">
 <Input
 value={customTableDocType}
 onChange={(e) => setCustomTableDocType(e.target.value)}
 placeholder="Subtítulo/Estructura"
 className="h-10 text-sm rounded-xl"
 />
 </FieldFrame>
 <FieldFrame label="Código de Control" hint="internalLabel (ej: F-SEC-01)">
 <Input
 value={customTableLabel}
 onChange={(e) => setCustomTableLabel(e.target.value)}
 placeholder="Identificador de control"
 className="h-10 text-sm rounded-xl"
 />
 </FieldFrame>
 </div>

 {/* Performance Notice */}
 <div className="flex items-start gap-3 rounded-xl bg-amber-50/50 p-4 mb-6 dark:bg-amber-950/25 border border-amber-100 dark:border-amber-900/40">
 <AlertCircle className="size-5 text-amber-700 shrink-0 mt-0.5" />
 <div className="grid gap-0.5">
 <span className="text-xs font-semibold text-foreground ">Compilación y Firmas del Backend (RR.HH.)</span>
 <span className="text-xs text-muted-foreground dark:text-muted-foreground leading-4">
 La generación de este PDF tarda entre 1.5 y 3 segundos debido a la incrustación de logos dinámicos de FABRYOR, la compilación de firmas digitales y la encriptación de metadatos de seguridad del documento.
 </span>
 </div>
 </div>

 {/* Table Container */}
 <div className="overflow-x-auto rounded-xl border border-border dark:border-border mb-6">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-muted /80 border-b border-border dark:border-border">
 <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Colaborador</th>
 <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Ingreso</th>
 <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Estatus</th>
 <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {tableData.map((row) => (
 <tr key={row.id} className="hover:bg-muted/50 dark:hover:bg-slate-950/20">
 <td className="p-3">
 <Input
 value={row.full_name}
 onChange={(e) => handleCellChange(row.id, "full_name", e.target.value)}
 className="h-8 text-xs rounded-lg bg-transparent border-border w-full focus:bg-card dark:bg-transparent"
 />
 </td>
 <td className="p-3">
 <Input
 value={row.check_in}
 onChange={(e) => handleCellChange(row.id, "check_in", e.target.value)}
 className="h-8 text-xs rounded-lg bg-transparent border-border w-full focus:bg-card dark:bg-transparent"
 />
 </td>
 <td className="p-3">
 <Select
 value={row.status}
 onChange={(e) => handleCellChange(row.id, "status", e.target.value)}
 className="h-8 text-xs rounded-lg bg-transparent border-border w-full focus:bg-card dark:bg-transparent"
 >
 <option value="Presente">Presente</option>
 <option value="Tardanza">Tardanza</option>
 <option value="Falta">Falta</option>
 </Select>
 </td>
 <td className="p-3 text-right">
 <button
 type="button"
 onClick={() => handleDeleteRow(row.id)}
 className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
 disabled={tableData.length <= 1}
 >
 <Trash2 className="size-4" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
 <button
 type="button"
 onClick={handleAddRow}
 className="flex items-center justify-center gap-2 px-4 h-10 text-xs font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted dark:hover:bg-secondary transition-colors cursor-pointer w-full sm:w-auto"
 >
 <Plus className="size-4" />
 Añadir Fila de Prueba
 </button>

 <button
 type="button"
 disabled={isExportingCustomTable}
 onClick={handleExportCustomTable}
 className="flex items-center justify-center gap-2 px-6 h-11 text-sm font-semibold text-white bg-indigo-900 rounded-xl hover:bg-indigo-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer w-full sm:w-auto shadow-sm"
 >
 {isExportingCustomTable ? (
 <>
 <Loader2 className="size-4 animate-spin" />
 Generando PDF...
 </>
 ) : (
 <>
 <Download className="size-4" />
 Exportar Tabla Visual (customData)
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 </ReportsLayout>
 );
}
