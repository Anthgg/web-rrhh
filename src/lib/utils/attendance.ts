import type { AttendanceSummary, AttendanceDayStatus, WorkerAttendanceSummary } from "@/types/schedule";

// ─── Formatters ──────────────────────────────────────────────────────────────

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);
}

export function formatTimeDuration(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value) || value <= 0) return "0 h";
  const hours = Math.floor(value);
  const mins = Math.round((value - hours) * 60);
  return mins === 0 ? `${hours} h` : `${hours} h ${mins} min`;
}

export function formatMinutes(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value) || value <= 0) return "—";
  if (value < 60) return `${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const mins = Math.round(value % 60);
  return mins === 0 ? `${hours} h` : `${hours} h ${mins} min`;
}

export function formatAnalyticsRate(val: number | undefined | null): string {
  if (val === undefined || val === null) return "0.0%";
  const rate = val <= 1 && val > 0 ? val * 100 : val;
  return `${rate.toFixed(1)}%`;
}

export function buildAnalyticsParams(filters: {
  month?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  workerId?: string | null;
  areaId?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  workLocationId?: string | null;
  crewId?: string | null;
  status?: string | null;
  limit?: number | null;
}): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  const hasRange = Boolean(filters.startDate || filters.endDate);
  if (hasRange) {
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
  } else if (filters.month) {
    params.month = filters.month;
  }
  if (filters.workerId) params.workerId = filters.workerId;
  if (filters.areaId) params.areaId = filters.areaId;
  if (filters.departmentId) params.departmentId = filters.departmentId;
  if (filters.positionId) params.positionId = filters.positionId;
  if (filters.workLocationId) params.workLocationId = filters.workLocationId;
  if (filters.crewId) params.crewId = filters.crewId;
  if (filters.status) params.status = filters.status;
  if (filters.limit) params.limit = filters.limit;
  return params;
}


/** Parse a YYYY-MM-DD string without UTC offset issues */
export function formatDateLocal(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const only = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = only.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

/** Format HH:MM:SS → HH:MM, or full ISO timestamp → HH:MM in America/Lima */
export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "—";
  
  if (timeStr.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(timeStr)) {
    try {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat("es-PE", {
          timeZone: "America/Lima",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(date);
      }
    } catch (e) {
      // Fallback
    }
  }

  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    const timePart = parts[0].includes(" ") ? parts[0].split(" ")[1] : parts[0];
    return `${timePart.slice(-2)}:${parts[1]}`;
  }
  return timeStr;
}

// ─── Status Normalization ─────────────────────────────────────────────────────

export function classifyStatusValue(val: unknown): AttendanceDayStatus | null {
  if (!val) return null;
  const str = String(val).toLowerCase().trim();
  
  if (str.includes("vacaci") || str.includes("vacation")) {
    return "vacation";
  }
  if (
    str.includes("descanso_medico") ||
    str.includes("descansomedico") ||
    str.includes("medical") ||
    str.includes("sick") ||
    str.includes("enfermedad") ||
    str.includes("médico") ||
    str.includes("medico")
  ) {
    return "medical_leave";
  }
  if (
    str.includes("permiso") ||
    str.includes("licencia") ||
    str.includes("unpaid_leave") ||
    str.includes("unpaid") ||
    str.includes("permission")
  ) {
    return "unpaid_leave";
  }
  if (
    str.includes("feriado_trabajado") ||
    str.includes("holiday_worked") ||
    str.includes("feriado trabajado")
  ) {
    return "holiday_worked";
  }
  if (str.includes("feriado") || str.includes("holiday")) {
    return "holiday";
  }
  if (
    str.includes("descanso") ||
    str.includes("rest_day") ||
    str.includes("day_off") ||
    str.includes("libre") ||
    str.includes("no_laboral")
  ) {
    return "rest_day";
  }
  if (str.includes("tardanza") || str.includes("late") || str.includes("tardy")) {
    return "late";
  }
  if (
    str.includes("present") ||
    str.includes("regular") ||
    str.includes("completed") ||
    str.includes("asist") ||
    str.includes("asistencia")
  ) {
    return "present";
  }
  if (
    str.includes("absent") ||
    str.includes("falta") ||
    str.includes("faltó") ||
    str.includes("falto")
  ) {
    return "absent";
  }
  if (str.includes("incomplete") || str.includes("incompleto") || str.includes("incompleta")) {
    return "incomplete";
  }
  if (str.includes("not_scheduled") || str.includes("sin_horario") || str.includes("sin horario")) {
    return "not_scheduled";
  }
  if (
    str.includes("pending") ||
    str.includes("pendiente") ||
    str.includes("draft") ||
    str.includes("observed") ||
    str.includes("supervisor") ||
    str.includes("rrhh")
  ) {
    return "pending";
  }
  if (
    str === "none" ||
    str === "sin_marcar" ||
    str === "sin marcar" ||
    str === "missing" ||
    str === "unknown"
  ) {
    return "none";
  }

  return null;
}

export function normalizeAttendanceStatus(row: Record<string, unknown>): AttendanceDayStatus {
  // ─── Special Request flags ───
  const isRequest = 
    row.source === "REQUEST" || 
    row.blockedByRequest === true || 
    row.blocked_by_request === true ||
    Boolean(row.requestType || row.request_type || row.requestTypeId || row.request_type_id);

  const requestTypeVal = row.requestType && typeof row.requestType === "object"
    ? ((row.requestType as any).code ?? (row.requestType as any).type ?? (row.requestType as any).name)
    : (row.requestType || row.request_type);

  // Candidates in priority order: statusLabel -> displayStatus -> attendanceStatus -> status -> requestType
  const candidates = [
    row.statusLabel ?? row.status_label,
    row.displayStatus ?? row.display_status,
    row.attendanceStatus ?? row.attendance_status,
    row.statusKey ?? row.status_key ?? row.status ?? (row.workflowStatus ?? row.workflow_status),
    requestTypeVal,
  ];

  let firstClassified: AttendanceDayStatus | null = null;

  for (const candidate of candidates) {
    const classified = classifyStatusValue(candidate);
    if (classified) {
      // If it's a specific action status (not pending/none), return immediately
      if (classified !== "pending" && classified !== "none") {
        if (classified === "late") {
          const lateMinutes = (row.late_minutes as number) ?? (row.lateMinutes as number) ?? 0;
          const hasCheckIn = Boolean(row.hasCheckIn ?? row.has_check_in ?? row.check_in ?? row.checkIn);
          const shift = row.shift as Record<string, unknown> | undefined;
          const tolerance = shift
            ? (shift.tolerance_minutes as number) ?? (shift.toleranceMinutes as number) ?? 0
            : 0;
          if (hasCheckIn && lateMinutes <= tolerance) return "present";
        }
        return classified;
      }
      
      // Save the first pending/none classification
      if (!firstClassified) {
        firstClassified = classified;
      }
    }
  }

  // Special Request rule: return resolved request status even if no check-in/out or attendance_id is null
  if (isRequest) {
    if (firstClassified) return firstClassified;
    return "pending";
  }

  // ─── Fallback from attendance fields ───
  const isWorkingDay = row.isWorkingDay ?? row.is_working_day;
  const workedMinutes = (row.worked_hours as number) ?? (row.workedMinutes as number) ?? 0;
  const effectiveMinutes = (row.effective_worked_hours as number) ?? (row.effectiveMinutes as number) ?? 0;
  const lateMinutes = (row.late_minutes as number) ?? (row.lateMinutes as number) ?? 0;
  const absentDays = (row.absent_days as number) ?? (row.absentDays as number) ?? 0;
  const hasCheckIn = Boolean(row.hasCheckIn ?? row.has_check_in ?? row.check_in ?? row.checkIn);
  const hasCheckOut = Boolean(row.hasCheckOut ?? row.has_check_out ?? row.check_out ?? row.checkOut);
  const expectedMinutes = (row.expected_hours as number) ?? 0;

  const shift = row.shift as Record<string, unknown> | undefined;
  const tolerance = shift
    ? (shift.tolerance_minutes as number) ?? (shift.toleranceMinutes as number) ?? 0
    : 0;

  if (isWorkingDay === false || isWorkingDay === 0) return "rest_day";
  if (absentDays > 0 && workedMinutes === 0 && !hasCheckIn) return "absent";
  if (hasCheckIn && !hasCheckOut && workedMinutes > 0) return "incomplete";
  if (hasCheckIn && lateMinutes > tolerance) return "late";
  if (workedMinutes > 0 || effectiveMinutes > 0) return "present";
  if (!expectedMinutes || expectedMinutes === 0) return "not_scheduled";

  return firstClassified || "pending";
}

/**
 * Strict fault predicate — the ONLY source of truth for counting absences.
 * Vacaciones, descanso médico y permiso personal son estados distintos y NUNCA son faltas.
 */
export function isFault(status: AttendanceDayStatus): boolean {
  return status === "absent";
}

// ─── Grouping ─────────────────────────────────────────────────────────────────

export function groupRecordsByWorker(records: AttendanceSummary[]): WorkerAttendanceSummary[] {
  const map = new Map<string, WorkerAttendanceSummary>();

  for (const r of records) {
    const id = r.worker_id;
    if (!map.has(id)) {
      const photoUrl =
        r.profilePhotoUrl ??
        r.avatarUrl ??
        r.profile_photo_url ??
        r.avatar_url ??
        (r as unknown as Record<string, unknown>).worker_avatar_url as string | undefined;

      map.set(id, {
        worker_id: id,
        worker_name: r.worker_name,
        worker_document: r.worker_document,
        worker_position: r.worker_position ?? r.positionName,
        profilePhotoUrl: photoUrl,
        is_active: r.is_active ?? r.isActive ?? true,
        expected_hours: 0,
        worked_hours: 0,
        effective_worked_hours: 0,
        overtime_hours: 0,
        late_minutes: 0,
        absent_days: 0,
        vacation_days: 0,
        medical_leave_days: 0,
        permission_unpaid_days: 0,
        estimated_discounts: 0,
        base_salary: r.base_salary ?? r.baseSalary,
        ordinary_earnings: 0,
        overtime_earnings: 0,
        total_earnings: 0,
        dominant_status: "pending",
        records: [],
      });
    }

    const entry = map.get(id)!;
    entry.records.push(r);
    entry.expected_hours += r.expected_hours || 0;
    entry.worked_hours += r.worked_hours || 0;
    entry.effective_worked_hours += r.effective_worked_hours || 0;
    entry.overtime_hours += r.overtime_hours || 0;
    entry.late_minutes += r.late_minutes || 0;
    entry.estimated_discounts += r.estimated_discounts || 0;
    entry.ordinary_earnings += Number(r.ordinary_earnings || 0);
    entry.overtime_earnings += Number(r.overtime_earnings || 0);
    entry.total_earnings += Number(r.total_earnings || 0);

    // Accumulate per-status day counters — keep them strictly separate
    const dayStatus = normalizeAttendanceStatus(r as unknown as Record<string, unknown>);
    if (isFault(dayStatus)) {
      entry.absent_days += 1;
    } else if (dayStatus === "vacation") {
      entry.vacation_days = (entry.vacation_days ?? 0) + 1;
    } else if (dayStatus === "medical_leave") {
      entry.medical_leave_days = (entry.medical_leave_days ?? 0) + 1;
    } else if (dayStatus === "unpaid_leave") {
      entry.permission_unpaid_days = (entry.permission_unpaid_days ?? 0) + 1;
    }

    // Keep the most recent base_salary
    if (r.base_salary || r.baseSalary) {
      entry.base_salary = r.base_salary ?? r.baseSalary;
    }

    if (r.is_active !== undefined || r.isActive !== undefined) {
      entry.is_active = r.is_active ?? r.isActive;
    }
  }

  // Compute dominant_status for each worker
  for (const entry of map.values()) {
    const statusPriority: Record<string, number> = {
      absent: 5, incomplete: 4, late: 3, present: 2, rest_day: 1, not_scheduled: 0, pending: 0, unknown: 0,
    };
    let maxPriority = -1;
    let dominant: AttendanceDayStatus = "pending";
    for (const rec of entry.records) {
      const s = normalizeAttendanceStatus(rec as unknown as Record<string, unknown>);
      const p = statusPriority[s] ?? 0;
      if (p > maxPriority) {
        maxPriority = p;
        dominant = s;
      }
    }
    entry.dominant_status = dominant;
  }

  return Array.from(map.values());
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

export function getStatusColor(status: AttendanceDayStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const map: Record<AttendanceDayStatus, { bg: string; text: string; border: string; dot: string }> = {
    present: {
      bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-500/30",
      dot: "bg-emerald-500",
    },
    late: {
      bg: "bg-amber-500/15 dark:bg-amber-500/20",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-500/30",
      dot: "bg-amber-500",
    },
    absent: {
      bg: "bg-rose-500/15 dark:bg-rose-500/20",
      text: "text-rose-700 dark:text-rose-400",
      border: "border-rose-500/30",
      dot: "bg-rose-500",
    },
    vacation: {
      bg: "bg-blue-500/15 dark:bg-blue-500/20",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-500/30",
      dot: "bg-blue-500",
    },
    medical_leave: {
      bg: "bg-purple-500/15 dark:bg-purple-500/20",
      text: "text-purple-700 dark:text-purple-400",
      border: "border-purple-500/30",
      dot: "bg-purple-500",
    },
    unpaid_leave: {
      bg: "bg-amber-600/15 dark:bg-amber-600/20",
      text: "text-amber-800 dark:text-amber-300",
      border: "border-amber-600/30",
      dot: "bg-amber-600",
    },
    holiday: {
      bg: "bg-teal-500/15 dark:bg-teal-500/20",
      text: "text-teal-700 dark:text-teal-400",
      border: "border-teal-500/30",
      dot: "bg-teal-500",
    },
    holiday_worked: {
      bg: "bg-teal-600/15 dark:bg-teal-600/20",
      text: "text-teal-800 dark:text-teal-300",
      border: "border-teal-600/30",
      dot: "bg-teal-600",
    },
    incomplete: {
      bg: "bg-orange-500/15 dark:bg-orange-500/20",
      text: "text-orange-700 dark:text-orange-400",
      border: "border-orange-500/30",
      dot: "bg-orange-500",
    },
    rest_day: {
      bg: "bg-slate-500/10 dark:bg-slate-500/15",
      text: "text-slate-600 dark:text-slate-400",
      border: "border-slate-500/20",
      dot: "bg-slate-400",
    },
    not_scheduled: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
      dot: "bg-muted-foreground",
    },
    pending: {
      bg: "bg-violet-500/10 dark:bg-violet-500/15",
      text: "text-violet-600 dark:text-violet-400",
      border: "border-violet-500/20",
      dot: "bg-violet-400",
    },
    none: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
      dot: "bg-muted-foreground",
    },
    unknown: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
      dot: "bg-muted-foreground",
    },
  };
  return map[status] ?? map.unknown;
}

export const STATUS_LABELS: Record<AttendanceDayStatus, string> = {
  present: "Asistió",
  late: "Tardanza",
  absent: "Falta",
  vacation: "Vacaciones",
  medical_leave: "Descanso médico",
  unpaid_leave: "Permiso personal",
  holiday: "Feriado",
  holiday_worked: "Feriado trabajado",
  incomplete: "Marcación incompleta",
  rest_day: "Es tu descanso",
  not_scheduled: "Sin horario asignado",
  pending: "Sin marcar",
  none: "Sin marcar",
  unknown: "Sin marcar",
};

export function getRecordStatusLabel(record: any, status: AttendanceDayStatus): string {
  const statusCode =
    record.attendanceStatus ||
    record.attendance_status ||
    record.status;

  const classifiedCode = statusCode ? classifyStatusValue(statusCode) : null;
  const mapped = classifiedCode ? STATUS_LABELS[classifiedCode] : null;

  const label =
    record.statusLabel ||
    record.status_label ||
    record.displayStatus ||
    mapped ||
    STATUS_LABELS[status] ||
    "Sin marcar";

  return label;
}

export function getSalaryIndicator(record: any, status: AttendanceDayStatus): "Percibe" | "No percibe" | null {
  const isRequest = 
    record.source === "REQUEST" || 
    record.blockedByRequest === true || 
    record.blocked_by_request === true ||
    Boolean(record.requestType || record.request_type || record.requestTypeId || record.request_type_id) ||
    status === "vacation" ||
    status === "medical_leave" ||
    status === "unpaid_leave";

  if (!isRequest) return null;

  const noPercibe =
    record.isPaid === false ||
    record.is_paid === false ||
    record.perceivesPay === false ||
    record.perceives_pay === false ||
    record.paymentStatus === 'unpaid' ||
    record.payment_status === 'unpaid';

  if (noPercibe) {
    return "No percibe";
  }

  const isPaid =
    record.isPaid === true ||
    record.is_paid === true ||
    record.perceivesPay === true ||
    record.perceives_pay === true ||
    record.paymentStatus === 'paid' ||
    record.payment_status === 'paid';

  if (isPaid) {
    return "Percibe";
  }

  // Fallback default rules:
  if (status === "unpaid_leave") return "No percibe";
  if (status === "vacation") return "Percibe";
  if (status === "medical_leave") return "Percibe";

  return null;
}

/**
 * Adds a given number of minutes to a "HH:mm" time string.
 */
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  if (!timeStr || !timeStr.includes(":")) return timeStr;
  const [hStr, mStr] = timeStr.split(":");
  let hours = parseInt(hStr, 10);
  let mins = parseInt(mStr, 10);
  if (isNaN(hours) || isNaN(mins)) return timeStr;

  mins += minutesToAdd;
  hours += Math.floor(mins / 60);
  mins = mins % 60;
  if (mins < 0) {
    mins += 60;
  }
  
  // Handle 24-hour wrap around
  hours = ((hours % 24) + 24) % 24;

  const hOut = String(hours).padStart(2, "0");
  const mOut = String(mins).padStart(2, "0");
  return `${hOut}:${mOut}`;
}

export function getStatusExplanation(status: AttendanceDayStatus): string {
  switch (status) {
    case "absent":
      return "El trabajador tenía jornada asignada, pero no registra entrada ni salida.";
    case "vacation":
      return "El trabajador tiene vacaciones aprobadas para este día.";
    case "medical_leave":
      return "El trabajador tiene descanso médico aprobado para este día.";
    case "unpaid_leave":
      return "El trabajador tiene permiso personal sin goce aprobado.";
    case "holiday":
      return "Es un día feriado nacional o local.";
    case "incomplete":
      return "El trabajador registró entrada, pero no registra salida.";
    case "late":
      return "La entrada fue posterior al horario permitido considerando la tolerancia.";
    case "present":
      return "El trabajador completó su jornada dentro del registro esperado.";
    case "rest_day":
      return "El día no estaba configurado como laboral.";
    case "not_scheduled":
    case "none":
    case "unknown":
    case "pending":
    default:
      return "No hay información suficiente para evaluar este estado.";
  }
}

export function getDayReason(status: AttendanceDayStatus): string {
  switch (status) {
    case "absent":
      return "Sin entrada/salida";
    case "vacation":
      return "Vacaciones aprobadas";
    case "medical_leave":
      return "Descanso médico";
    case "unpaid_leave":
      return "Permiso sin goce";
    case "holiday":
      return "Feriado";
    case "incomplete":
      return "Sin salida registrada";
    case "late":
      return "Entrada fuera de tolerancia";
    case "present":
      return "Jornada completa";
    case "rest_day":
      return "Día no laboral";
    case "not_scheduled":
    case "none":
    case "unknown":
    case "pending":
    default:
      return "Sin registros";
  }
}

/**
 * Reconstructs or extracts the actual check in/out time from a record,
 * applying late minutes or overtime if raw timestamps are missing.
 */
export function getRecordCheckTime(record: AttendanceSummary, type: "in" | "out"): string | null {
  const row = record as unknown as Record<string, unknown>;
  const shift = (row.shift ?? (row.schedule as Record<string,unknown>)?.shift) as Record<string,unknown> | undefined;

  if (type === "in") {
    const actual =
      (row.check_in_time as string) ??
      (row.checkInTime as string) ??
      (row.check_in as string) ??
      (row.checkIn as string) ??
      (row.entry_time as string) ??
      (row.entryTime as string) ??
      null;
    if (actual) return actual;
    
    const hasIn = Boolean(row.hasCheckIn ?? row.has_check_in);
    if (!hasIn) return null;
    
    const baseTime = (shift?.startTime as string) ?? (shift?.start_time as string);
    if (!baseTime) return null;
    
    const lateMins = Number(row.late_minutes ?? row.lateMinutes ?? 0);
    if (lateMins > 0) {
      return addMinutesToTime(baseTime, lateMins);
    }
    return baseTime;
  }

  const actual =
    (row.check_out_time as string) ??
    (row.checkOutTime as string) ??
    (row.check_out as string) ??
    (row.checkOut as string) ??
    (row.exit_time as string) ??
    (row.exitTime as string) ??
    null;
  if (actual) return actual;
  
  const hasOut = Boolean(row.hasCheckOut ?? row.has_check_out);
  if (!hasOut) return null;
  
  const baseTime = (shift?.endTime as string) ?? (shift?.end_time as string);
  if (!baseTime) return null;
  
  const overtimeMins = Number(row.overtime_minutes ?? row.overtimeMinutes ?? 0);
  if (overtimeMins > 0) {
    return addMinutesToTime(baseTime, overtimeMins);
  }
  return baseTime;
}
