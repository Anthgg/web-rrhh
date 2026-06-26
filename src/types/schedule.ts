export interface SchedulePolicy {
  id?: string;
  lateToleranceMinutes: number;
  autoAbsenceEnabled: boolean;
  autoAbsenceAfterTime: string; // "HH:mm"
  defaultBreakMinutes: number;
  defaultBreakPaid: boolean;
  weeklyTargetMinutes: number;
  timezone: string;
  workingDays: (number | string)[]; // Can be [1,2,3...] or ["monday", "tuesday"...]
  workingDaysNames?: string[];
}

export interface Shift {
  id: string;
  name: string;
  start_time: string; // "HH:MM"
  startTime?: string;
  end_time: string; // "HH:MM"
  endTime?: string;
  tolerance_minutes: number;
  toleranceMinutes?: number;
  break_minutes: number;
  breakMinutes?: number;
  break_paid: boolean;
  breakPaid?: boolean;
  weekly_target_minutes: number;
  weeklyTargetMinutes?: number;
  working_days: number[]; // Array of weekdays 1-7
  workingDays?: number[];
  workingDaysNames?: string[];
  timezone: string;
  allows_overtime: boolean;
  allowsOvertime?: boolean;
  is_active: boolean;
  isActive?: boolean;
  effective_minutes?: number;
  effectiveMinutes?: number;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface ShiftPayload {
  name: string;
  start_time: string;
  startTime?: string;
  end_time: string;
  endTime?: string;
  tolerance_minutes: number;
  toleranceMinutes?: number;
  break_minutes: number;
  breakMinutes?: number;
  break_paid: boolean;
  breakPaid?: boolean;
  weekly_target_minutes: number;
  weeklyTargetMinutes?: number;
  working_days: number[];
  workingDays?: number[];
  timezone: string;
  allows_overtime: boolean;
  allowsOvertime?: boolean;
  is_active: boolean;
  isActive?: boolean;
  effective_minutes?: number;
  effectiveMinutes?: number;
}

export interface ScheduleAssignment {
  id: string;
  worker_id: string;
  workerId?: string;
  worker_name?: string;
  workerName?: string;
  worker_document?: string;
  workerDocument?: string;
  worker_avatar_url?: string;
  workerAvatarUrl?: string;
  avatarUrl?: string;
  profilePhotoUrl?: string;
  worker?: {
    profilePhotoUrl?: string;
    fullName?: string;
    documentNumber?: string;
  };
  shift_id: string;
  shiftId?: string;
  shift_name?: string;
  shiftName?: string;
  start_date: string; // YYYY-MM-DD
  startDate?: string;
  end_date: string | null; // YYYY-MM-DD
  endDate?: string | null;
  is_active: boolean;
  isActive?: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleAssignmentPayload {
  worker_id: string;
  workerId?: string;
  shift_id: string;
  shiftId?: string;
  start_date: string;
  startDate?: string;
  end_date?: string | null;
  endDate?: string | null;
  notes?: string;
}

export type RestDayType = "manual" | "fijo" | "rotativo";

export interface RestDayEntry {
  date: string; // YYYY-MM-DD
  type: RestDayType;
}

export interface HolidayEntry {
  date: string; // YYYY-MM-DD
  name: string;
  type: string; // "nacional" | "national" | etc.
}

export interface WorkerRestDaysResponse {
  worker_id: string;
  start_date: string;
  end_date: string;
  rest_days: RestDayEntry[];
  holidays: HolidayEntry[];
}

/** Shape returned by POST /api/schedule/workers/:id/rest-days */
export interface SetRestDayResponse {
  type: RestDayType;
  day_of_week?: number;
  dayOfWeek?: number;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  rest_day_config?: { type: RestDayType; dayOfWeek?: number };
  restDayConfig?:   { type: RestDayType; dayOfWeek?: number };
  /** Number of individual rest-day records materialised */
  materialized_count?: number;
  materializedCount?:  number;
  /** Materialised rest-day dates (same as querying GET rest-days) */
  rest_days?: RestDayEntry[];
  restDays?:  RestDayEntry[];
}

/** Shape returned by DELETE /api/schedule/workers/:id/rest-days */
export interface RemoveRestDayResponse {
  date: string;
  removed: boolean;
  restDay?: RestDayEntry;
}

export interface WorkerSchedule {
  date: string;
  worker_id: string;
  workerId?: string;
  is_working_day: boolean;
  isWorkingDay?: boolean;
  /** true if this day has a materialised rest day */
  isRestDay?: boolean;
  /** type of the rest day; null when isRestDay is false */
  restDayType?: RestDayType | null;
  isHoliday?: boolean;
  dayName?: string;
  dayOfWeek?: number;
  shift: {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    tolerance_minutes: number;
    break_minutes: number;
    break_paid: boolean;
    timezone: string;
    allows_overtime: boolean;
  } | null;
}

export interface AttendanceSummary {
  id?: string;
  date: string;
  dateKey?: string;
  dayKey?: string;
  calendarDate?: string;
  localDate?: string;
  dateTime?: string;
  calendarDateTime?: string;
  worker_id: string;
  worker_name: string;
  worker_document?: string;
  worker_position?: string;
  positionName?: string;
  profilePhotoUrl?: string;
  avatarUrl?: string;
  avatar_url?: string;
  profile_photo_url?: string;
  is_active?: boolean;
  isActive?: boolean;
  expected_hours: number;
  effective_hours: number;
  late_count: number;
  absence_count: number;
  estimated_discounts: number;
  overtime_hours: number;
  incomplete_days: number;
  status: string;
  statusKey?: string;
  status_key?: string;
  statusLabel?: string;
  status_label?: string;
  worked_hours?: number;
  effective_worked_hours?: number;
  late_minutes?: number;
  absent_days?: number;
  is_working_day?: boolean;
  isWorkingDay?: boolean;
  has_check_in?: boolean;
  hasCheckIn?: boolean;
  has_check_out?: boolean;
  hasCheckOut?: boolean;
  check_in?: string | null;
  checkIn?: string | null;
  check_out?: string | null;
  checkOut?: string | null;
  base_salary?: number;
  baseSalary?: number;
  hourly_rate?: number;
  ordinary_earnings?: number;
  overtime_earnings?: number;
  total_earnings?: number;
  shift?: {
    id?: string;
    name?: string;
    start_time?: string;
    startTime?: string;
    end_time?: string;
    endTime?: string;
    tolerance_minutes?: number;
    toleranceMinutes?: number;
  };
  paymentType?: "regular" | "rest_day" | "paid_holiday" | "holiday_worked";
  payment_type?: "regular" | "rest_day" | "paid_holiday" | "holiday_worked";
}

export type AttendanceRecordByDateValue =
  | AttendanceSummary
  | AttendanceSummary[]
  | null
  | undefined;

export type AttendanceRecordsByDate = Record<string, AttendanceRecordByDateValue>;

export interface WorkerAttendanceSummary {
  worker_id: string;
  worker_name: string;
  worker_document?: string;
  worker_position?: string;
  profilePhotoUrl?: string;
  is_active?: boolean;
  // Aggregated totals
  expected_hours: number;
  worked_hours: number;
  effective_worked_hours: number;
  overtime_hours: number;
  late_minutes: number;
  absent_days: number;
  /** Days with status=vacation (separate from absent_days) */
  vacation_days: number;
  /** Days with status=medical_leave (separate from absent_days) */
  medical_leave_days: number;
  /** Days with status=unpaid_leave (separate from absent_days) */
  permission_unpaid_days: number;
  estimated_discounts: number;
  absence_discount?: number;
  /** Discount specific to unpaid leave (permiso sin goce) */
  unpaid_permission_discount?: number;
  late_discount?: number;
  base_salary?: number;
  ordinary_earnings: number;
  overtime_earnings: number;
  holiday_worked_days?: number;
  holiday_earnings?: number;
  total_earnings: number;
  // Dominant status
  dominant_status: string;
  // Raw records for the detail view
  records: AttendanceSummary[];
}

export type AttendanceDayStatus =
  | "present"
  | "late"
  | "absent"
  | "vacation"
  | "medical_leave"
  | "unpaid_leave"
  | "holiday"
  | "holiday_worked"
  | "incomplete"
  | "rest_day"
  | "not_scheduled"
  | "pending"
  | "none"
  | "unknown";

// ─── Vacation Balance ─────────────────────────────────────────────────────────

export interface VacationBalance {
  /** Total days accrued in the current period */
  generatedDays: number;
  /** Days accumulated including proration */
  accumulatedDays: number;
  /** Days already taken (approved requests that ended) */
  usedDays: number;
  /** Days reserved by pending requests (not yet approved) */
  reservedDays: number;
  /** Days awaiting approval */
  pendingDays: number;
  /** generatedDays - usedDays - reservedDays */
  availableDays: number;
  /** Total annual vacation days allocated (e.g. 30) */
  annualVacationDays: number;
  /** Monthly vacation accrual rate (e.g. 2.5) */
  monthlyAccrualRate: number;
  /** Daily vacation accrual rate (e.g. 0.083333) */
  dailyAccrualRate: number;
  /** Months of completed service */
  completedServiceMonths: number;
  /** Remaining days to complete next service month */
  remainingServiceDays: number;
  /** ISO date of next accrual */
  nextAccrualDate?: string | null;
  /** ISO date of next labor anniversary */
  nextServiceAnniversary?: string | null;
  /** Calculation mode applied by backend */
  calculationMode?: 'service_months_and_days_prorated' | string;
}

// ─── Attendance History & Summary ─────────────────────────────────────────────

export type AttendanceHistoryStatus =
  | "VACATION"
  | "MEDICAL_LEAVE"
  | "UNPAID_LEAVE"
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "HOLIDAY"
  | "REST_DAY"
  | "INCOMPLETE";

export interface AttendanceHistoryParams {
  month: number;
  year: number;
  /** Comma-separated uppercase statuses, e.g. "VACATION,MEDICAL_LEAVE" */
  status?: string;
}

export interface AttendanceMonthlySummary {
  month: number;
  year: number;
  presentDays: number;
  lateDays: number;
  /** Strictly absent (unjustified) — never includes vacation/medical/unpaid */
  absentDays: number;
  vacationDays: number;
  medicalLeaveDays: number;
  unpaidLeaveDays: number;
  holidayDays: number;
  restDays: number;
  incompleteDays: number;
  totalWorkedHours?: number;
}

export interface AttendanceSummaryApiResponse {
  success: boolean;
  data?: AttendanceSummary[];
  records?: AttendanceSummary[];
  recordsByDate?: AttendanceRecordsByDate;
  calendarByDate?: AttendanceRecordsByDate;
  summary?: {
    start_date?: string;
    end_date?: string;
    records?: AttendanceSummary[];
    recordsByDate?: AttendanceRecordsByDate;
    calendarByDate?: AttendanceRecordsByDate;
  };
  meta?: {
    start_date?: string;
    end_date?: string;
    total?: number;
  };
}

// ─── Attendance Analytics Dashboard ──────────────────────────────────────────

export interface AttendanceAnalyticsFilters {
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
}

export interface AttendanceAnalyticsKpis {
  totalWorkers: number;
  totalWorkDays: number;
  scheduledWorkDays: number;
  presentCount: number;
  onTimeCount: number;
  presentOnTimeCount: number;
  lateCount: number;
  absentCount: number;
  vacationCount: number;
  medicalLeaveCount: number;
  unpaidLeaveCount: number;
  holidayCount: number;
  restDayCount: number;
  noScheduleCount: number;
  incompleteCount: number;
  pendingCount: number;
  workedMinutes: number;
  workedHours: number;
  lateMinutes: number;
  overtimeMinutes: number;
  overtimeHours: number;
  attendanceRate: number;
  punctualityRate: number;
  absenceRate: number;
  lateRate: number;
  averageLateMinutes: number;
  completedShiftRate: number;
  score: number;
}

export interface AttendanceAnalyticsRankingItem {
  rank: number;
  label: string;
  value: number;
  secondaryValue?: number | string | null;
}

export interface AttendanceAnalyticsRankings {
  topAbsentWorkers: AttendanceAnalyticsRankingItem[];
  topLateWorkers: AttendanceAnalyticsRankingItem[];
  bestAttendanceWorkers: AttendanceAnalyticsRankingItem[];
  topAbsentAreas: AttendanceAnalyticsRankingItem[];
  topLateAreas: AttendanceAnalyticsRankingItem[];
  topAbsentWorkLocations: AttendanceAnalyticsRankingItem[];
  topLateWorkLocations: AttendanceAnalyticsRankingItem[];
  bestAttendanceWorkLocations: AttendanceAnalyticsRankingItem[];
  topAbsentCrews: AttendanceAnalyticsRankingItem[];
  topLateCrews: AttendanceAnalyticsRankingItem[];
  bestAttendanceCrews: AttendanceAnalyticsRankingItem[];
}

export interface AttendanceAnalyticsChartItem {
  key: string;
  label: string;
  value: number;
  percentage?: number;
  [key: string]: unknown;
}

export interface AttendanceAnalyticsCharts {
  statusDistribution: AttendanceAnalyticsChartItem[];
  dailyTrend: AttendanceAnalyticsChartItem[];
  weeklyTrend: AttendanceAnalyticsChartItem[];
  byArea: AttendanceAnalyticsChartItem[];
  byDepartment: AttendanceAnalyticsChartItem[];
  byWorkLocation: AttendanceAnalyticsChartItem[];
  byCrew: AttendanceAnalyticsChartItem[];
}

export interface AttendanceAnalyticsResponse {
  success: boolean;
  data: {
    period: string;
    filters: AttendanceAnalyticsFilters;
    kpis: AttendanceAnalyticsKpis;
    rankings: AttendanceAnalyticsRankings;
    charts: AttendanceAnalyticsCharts;
    generatedAt: string;
  };
}

export interface AttendanceRecalculateResponse {
  success: boolean;
  message?: string;
  meta?: {
    persisted?: boolean;
    [key: string]: unknown;
  };
}
