/**
 * Derivaciones operativas del dashboard.
 *
 * El backend expone totales agregados (summary) y un listado del día paginado
 * (dailyStatusList). Aquí derivamos métricas de forma honesta: lo que se calcula
 * a partir de totales agregados es exacto; lo que se cuenta del listado paginado
 * se marca como tal para no presentar estimaciones como verdades absolutas.
 */
import type { WorkerStatus } from "@/services/dashboard.service";

export interface DashboardSummary {
  activeWorkers: number;
  totalRecords: number;
  totalLate: number;
  fakeGpsAlerts: number;
}

export interface OperationalPulse {
  /** Universo total de empleados activos. */
  total: number;
  /** Marcaron a tiempo (asistencias − tardanzas). Exacto sobre agregados. */
  onTime: number;
  /** Tardanzas registradas hoy. Exacto. */
  late: number;
  /** Empleados sin asistencia registrada (faltas + aún sin marcar). Derivado. */
  missing: number;
  /** Total de marcaciones registradas hoy. */
  records: number;
}

/**
 * Pulso del día calculado solo desde totales agregados, por lo que los segmentos
 * suman exactamente `total` cuando totalRecords ≤ activeWorkers.
 */
export function getOperationalPulse(summary: DashboardSummary): OperationalPulse {
  const total = Math.max(0, summary.activeWorkers);
  const records = Math.max(0, summary.totalRecords);
  const late = Math.max(0, Math.min(summary.totalLate, records));
  const onTime = Math.max(0, records - late);
  const missing = Math.max(0, total - records);

  return { total, onTime, late, missing, records };
}

/** Faltas estimadas: empleados activos que no tienen marcación hoy. */
export function getEstimatedAbsences(summary: DashboardSummary): number {
  return Math.max(0, summary.activeWorkers - summary.totalRecords);
}

/**
 * Desglose por estado contado desde el listado del día. El listado viene
 * paginado, por lo que estos conteos representan la página cargada, no el total
 * de la operación. Útil para el panel de chips secundarios.
 */
export interface StatusBreakdown {
  present: number;
  late: number;
  absent: number;
  pendingCheckout: number;
  completed: number;
  restDay: number;
  other: number;
  /** Cantidad de filas sobre las que se contó (tamaño de la página cargada). */
  sample: number;
}

export function getStatusBreakdown(workers: WorkerStatus[]): StatusBreakdown {
  const breakdown: StatusBreakdown = {
    present: 0,
    late: 0,
    absent: 0,
    pendingCheckout: 0,
    completed: 0,
    restDay: 0,
    other: 0,
    sample: workers.length,
  };

  for (const worker of workers) {
    switch (worker.status) {
      case "present":
        breakdown.present += 1;
        break;
      case "late":
        breakdown.late += 1;
        break;
      case "absent":
        breakdown.absent += 1;
        break;
      case "pending-checkout":
        breakdown.pendingCheckout += 1;
        break;
      case "completed":
        breakdown.completed += 1;
        break;
      case "rest-day":
        breakdown.restDay += 1;
        break;
      default:
        breakdown.other += 1;
    }
  }

  return breakdown;
}

/** Cuenta alertas por severidad para el panel de notificaciones. */
export function countAlertsBySeverity(
  alerts: { severity: "info" | "warning" | "critical" }[],
): { critical: number; warning: number; info: number } {
  return alerts.reduce(
    (acc, alert) => {
      if (alert.severity === "critical") acc.critical += 1;
      else if (alert.severity === "warning") acc.warning += 1;
      else acc.info += 1;
      return acc;
    },
    { critical: 0, warning: 0, info: 0 },
  );
}
