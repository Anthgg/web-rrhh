"use client";

import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { Card } from "@/components/ui/card";
import { payrollService } from "@/services/payroll.service";
import { reportsService } from "@/services/reports.service";

export function ReportsWorkspace() {
 const {
 data: reports,
 isError: isReportsError,
 isLoading: isReportsLoading,
 refetch: refetchReports,
 } = useQuery({
 queryKey: ["reports"],
 queryFn: reportsService.list,
 });
 const {
 data: payrollPeriods,
 isError: isPayrollPeriodsError,
 isLoading: isPayrollPeriodsLoading,
 } = useQuery({
 queryKey: ["payroll-periods"],
 queryFn: payrollService.periods,
 });

 if (isReportsLoading) {
 return <LoadingPanel title="Consultando reportes administrativos." />;
 }

 if (isReportsError || !reports) {
 return (
 <ErrorState
 title="No pudimos cargar reportes"
 description="La web solo consulta endpoints administrativos reales. Revisa la sesion o el contrato del backend."
 onRetry={() => void refetchReports()}
 />
 );
 }

 return (
 <>
 <PageHeader
 eyebrow="Analisis"
 title="Reportes"
 description="Estado real de los endpoints administrativos de reportes, sin graficas ni catalogos simulados."
 />

 <Card className="grid gap-4">
 <div className="grid gap-1">
 <h2 className="section-title text-2xl font-semibold text-foreground">Endpoints conectados</h2>
 <p className="text-sm text-foreground-soft">
 Si un endpoint falta o devuelve error, se muestra el estado real reportado por el
 backend.
 </p>
 </div>

 <div className="grid gap-3">
 {reports.map((report) => (
 <div key={report.id} className="rounded-3xl border border-border bg-card p-5">
 <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
 <div className="grid gap-1">
 <strong className="text-lg font-semibold text-foreground">{report.title}</strong>
 <p className="text-sm text-foreground-soft">{report.description}</p>
 <p className="font-mono text-xs text-foreground-soft">{report.endpoint}</p>
 </div>

 <div className="grid gap-2 text-sm text-foreground-soft md:text-right">
 <span
 className={
 report.availability === "available"
 ? "font-semibold text-emerald-700"
 : "font-semibold text-rose-700"
 }
 >
 {report.availability === "available" ? "Disponible" : "No disponible"}
 </span>
 <span>HTTP {report.httpStatus ?? "sin respuesta"}</span>
 {report.responseShape ? (
 <span>
 {report.responseShape.type}
 {report.responseShape.itemCount !== null
 ? ` - ${report.responseShape.itemCount} registros`
 : ""}
 </span>
 ) : null}
 </div>
 </div>

 {report.responseShape?.keys.length ? (
 <div className="mt-4 flex flex-wrap gap-2">
 {report.responseShape.keys.map((key) => (
 <span
 key={key}
 className="rounded-full bg-card-muted px-3 py-1 font-mono text-xs text-foreground-soft"
 >
 {key}
 </span>
 ))}
 </div>
 ) : null}

 {report.message ? (
 <p className="mt-3 text-sm text-rose-700">{report.message}</p>
 ) : null}
 </div>
 ))}
 </div>
 </Card>

 <Card className="grid gap-4">
 <div className="grid gap-1">
 <h2 className="section-title text-2xl font-semibold text-foreground">Periodos de planilla</h2>
 <p className="text-sm text-foreground-soft">
 Conectado a GET /payroll/periods. El resumen de planilla queda pendiente hasta que
 backend exponga un endpoint productivo.
 </p>
 </div>

 {isPayrollPeriodsLoading ? (
 <div className="h-24 animate-pulse rounded-3xl bg-card-muted" />
 ) : isPayrollPeriodsError || !payrollPeriods ? (
 <p className="rounded-3xl border border-dashed border-border bg-card p-5 text-sm text-foreground-soft">
 Pendiente de backend: no se pudo confirmar GET /payroll/periods en esta sesion.
 </p>
 ) : payrollPeriods.length ? (
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
 {payrollPeriods.map((period) => (
 <div key={period.id} className="rounded-3xl border border-border bg-card p-5">
 <strong className="text-base font-semibold text-foreground">{period.label}</strong>
 <p className="mt-2 text-sm text-foreground-soft">
 {[period.startDate, period.endDate].filter(Boolean).join(" - ") || "Sin rango confirmado"}
 </p>
 {period.status ? (
 <span className="mt-3 inline-flex rounded-full bg-card-muted px-3 py-1 text-xs font-semibold text-foreground-soft">
 {period.status}
 </span>
 ) : null}
 </div>
 ))}
 </div>
 ) : (
 <p className="rounded-3xl border border-dashed border-border bg-card p-5 text-sm text-foreground-soft">
 El backend respondio sin periodos disponibles.
 </p>
 )}
 </Card>

 <Card className="grid gap-2 border-dashed bg-card">
 <h2 className="section-title text-xl font-semibold text-foreground">Modulos pendientes de backend</h2>
 <p className="text-sm text-foreground-soft">
 Pendiente de backend: overtime, payroll summary, attendance admin avanzada, CRUD de
 documentos y exports productivos adicionales. La web no consume endpoints no confirmados.
 </p>
 </Card>
 </>
 );
}
