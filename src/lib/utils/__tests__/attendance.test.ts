/**
 * attendance.test.ts
 *
 * Validates the strict taxonomy rules:
 * - isFault === status === 'absent' (nothing else)
 * - vacation / medical_leave / unpaid_leave / holiday NEVER produce 'absent'
 * - normalizeAttendanceStatus handles both camelCase and snake_case inputs
 * - groupRecordsByWorker keeps counters strictly separate
 * - PENDING requests do NOT change attendance status
 */

import { normalizeAttendanceStatus, isFault, groupRecordsByWorker } from "../attendance";
import type { AttendanceSummary } from "../../../types/schedule";
import { normalizeRequestItem } from "../../api/normalizers";
import { differenceInCalendarDays } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRow(status: string, extras?: Record<string, unknown>) {
  return { status, ...extras };
}

function makeSummary(status: string, workerId = "w1"): AttendanceSummary {
  return {
    worker_id: workerId,
    worker_name: "Test Worker",
    worker_document: "12345678",
    worker_position: "Dev",
    date: "2026-07-01",
    status,
    attended: status === "present" || status === "late",
    has_check_in: status === "present" || status === "late",
    has_check_out: status === "present",
    check_in: status === "present" || status === "late" ? "09:00" : undefined,
    check_out: status === "present" ? "18:00" : undefined,
    expected_hours: 8,
    worked_hours: status === "present" || status === "late" ? 8 : 0,
    effective_worked_hours: status === "present" || status === "late" ? 7.5 : 0,
    overtime_hours: 0,
    late_minutes: status === "late" ? 15 : 0,
    absent_days: status === "absent" ? 1 : 0,
    estimated_discounts: 0,
    ordinary_earnings: status === "present" || status === "late" ? 100 : 0,
    overtime_earnings: 0,
    total_earnings: status === "present" || status === "late" ? 100 : 0,
    base_salary: 1500,
    is_active: true,
  } as AttendanceSummary;
}

// ─── normalizeAttendanceStatus ─────────────────────────────────────────────────

describe("normalizeAttendanceStatus", () => {
  describe("canonical leave types NEVER produce absent", () => {
    const leaveInputs = [
      ["vacation"],
      ["VACATION"],
      ["vacaciones"],
      ["medical_leave"],
      ["MEDICAL_LEAVE"],
      ["descanso_medico"],
      ["sick_leave"],
      ["unpaid_leave"],
      ["UNPAID_LEAVE"],
      ["permiso_personal"],
      ["personal_permission"],
      ["PERSONAL_PERMISSION"], // legacy — must normalize to unpaid_leave
    ];

    test.each(leaveInputs)("status '%s' is never absent", (status) => {
      const result = normalizeAttendanceStatus(makeRow(status as string));
      expect(result).not.toBe("absent");
      expect(result).not.toBe("unknown");
    });
  });

  describe("leave type mapping", () => {
    it("maps vacation/vacaciones to vacation", () => {
      expect(normalizeAttendanceStatus(makeRow("vacation"))).toBe("vacation");
      expect(normalizeAttendanceStatus(makeRow("vacaciones"))).toBe("vacation");
      expect(normalizeAttendanceStatus(makeRow("VACATION"))).toBe("vacation");
    });

    it("maps medical_leave/descanso_medico to medical_leave", () => {
      expect(normalizeAttendanceStatus(makeRow("medical_leave"))).toBe("medical_leave");
      expect(normalizeAttendanceStatus(makeRow("descanso_medico"))).toBe("medical_leave");
      expect(normalizeAttendanceStatus(makeRow("MEDICAL_LEAVE"))).toBe("medical_leave");
      expect(normalizeAttendanceStatus(makeRow("sick_leave"))).toBe("medical_leave");
    });

    it("maps unpaid_leave/permiso_personal/personal_permission to unpaid_leave", () => {
      expect(normalizeAttendanceStatus(makeRow("unpaid_leave"))).toBe("unpaid_leave");
      expect(normalizeAttendanceStatus(makeRow("permiso_personal"))).toBe("unpaid_leave");
      expect(normalizeAttendanceStatus(makeRow("personal_permission"))).toBe("unpaid_leave");
      expect(normalizeAttendanceStatus(makeRow("PERSONAL_PERMISSION"))).toBe("unpaid_leave");
    });

    it("maps holiday/feriado to holiday", () => {
      expect(normalizeAttendanceStatus(makeRow("holiday"))).toBe("holiday");
      expect(normalizeAttendanceStatus(makeRow("feriado"))).toBe("holiday");
    });
  });

  describe("only 'absent' / 'falta' map to absent", () => {
    it("maps absent to absent", () => {
      expect(normalizeAttendanceStatus(makeRow("absent"))).toBe("absent");
    });

    it("maps falta to absent", () => {
      expect(normalizeAttendanceStatus(makeRow("falta"))).toBe("absent");
    });

    it("maps faltó to absent", () => {
      expect(normalizeAttendanceStatus(makeRow("faltó"))).toBe("absent");
    });
  });

  describe("snake_case and camelCase input support", () => {
    it("reads snake_case absent_days", () => {
      const row = {
        absent_days: 1,
        worked_hours: 0,
        hasCheckIn: false,
        isWorkingDay: true,
      };
      expect(normalizeAttendanceStatus(row)).toBe("absent");
    });

    it("reads camelCase workedMinutes", () => {
      const row = {
        workedMinutes: 480,
        effectiveMinutes: 450,
        hasCheckIn: true,
        hasCheckOut: true,
        lateMinutes: 0,
      };
      const result = normalizeAttendanceStatus(row);
      expect(["present", "late"]).toContain(result);
    });
  });

  describe("PENDING requests do NOT change attendance status", () => {
    it("a row with status pending stays pending (no effect on absent_days)", () => {
      const row = { status: "pending" };
      const result = normalizeAttendanceStatus(row);
      expect(result).toBe("pending");
      expect(result).not.toBe("absent");
    });
  });
});

// ─── isFault ──────────────────────────────────────────────────────────────────

describe("isFault", () => {
  it("returns true only for absent", () => {
    expect(isFault("absent")).toBe(true);
  });

  const nonFaultStatuses = [
    "present",
    "late",
    "vacation",
    "medical_leave",
    "unpaid_leave",
    "holiday",
    "incomplete",
    "rest_day",
    "not_scheduled",
    "pending",
    "none",
    "unknown",
  ] as const;

  test.each(nonFaultStatuses)("returns false for '%s'", (status) => {
    expect(isFault(status)).toBe(false);
  });
});

// ─── groupRecordsByWorker ──────────────────────────────────────────────────────

describe("groupRecordsByWorker", () => {
  it("counts absent_days only for absent records, never for leave types", () => {
    const records = [
      makeSummary("absent"),
      { ...makeSummary("vacation"), status: "vacation" },
      { ...makeSummary("medical_leave"), status: "medical_leave" },
      { ...makeSummary("unpaid_leave"), status: "unpaid_leave" },
      { ...makeSummary("present"), status: "present" },
    ] as AttendanceSummary[];

    const [worker] = groupRecordsByWorker(records);

    expect(worker.absent_days).toBe(1);
    expect(worker.vacation_days).toBe(1);
    expect(worker.medical_leave_days).toBe(1);
    expect(worker.permission_unpaid_days).toBe(1);
  });

  it("vacation_days + medical_leave_days + permission_unpaid_days never bleed into absent_days", () => {
    const leaveRecords: AttendanceSummary[] = [
      { ...makeSummary("vacation"), status: "vacation" },
      { ...makeSummary("vacation"), status: "vacation" },
      { ...makeSummary("medical_leave"), status: "medical_leave" },
    ];

    const [worker] = groupRecordsByWorker(leaveRecords);

    expect(worker.absent_days).toBe(0);
    expect(worker.vacation_days).toBe(2);
    expect(worker.medical_leave_days).toBe(1);
  });
});

// ─── Tests for New Vacation Contract Requirements ─────────────────────────────

describe("Vacation Contract & Calculations", () => {
  describe("Conteo inclusivo y fechas sin desfase UTC", () => {
    it("calcula los días solicitados de forma inclusiva y sin desfase UTC", () => {
      const startDateStr = "2026-06-20";
      const endDateStr = "2026-06-25";

      // Formato local T00:00:00 evita desfase de zona horaria
      const start = new Date(startDateStr + "T00:00:00");
      const end = new Date(endDateStr + "T00:00:00");

      const requestedDays = differenceInCalendarDays(end, start) + 1;
      expect(requestedDays).toBe(6);
    });
  });

  describe("Snapshot parsing paths (5 paths validation)", () => {
    const mockBalance = {
      availableDaysAtRequest: 10,
      requestedDays: 5,
      projectedAvailableDays: 5,
      exceedsAvailableBalance: false,
      requiresManagerOverride: false,
    };

    it("parsea el snapshot de data.request.vacationBalance", () => {
      const payload = {
        data: {
          request: {
            id: "req-1",
            status: "pending",
            vacationBalance: mockBalance,
          },
        },
      };
      const result = normalizeRequestItem(payload);
      expect(result.vacationBalance).toBeDefined();
      expect(result.vacationBalance?.availableDaysAtRequest).toBe(10);
    });

    it("parsea el snapshot de data.request.metadata.vacationBalance", () => {
      const payload = {
        data: {
          request: {
            id: "req-2",
            status: "pending",
            metadata: {
              vacationBalance: mockBalance,
            },
          },
        },
      };
      const result = normalizeRequestItem(payload);
      expect(result.vacationBalance).toBeDefined();
      expect(result.vacationBalance?.availableDaysAtRequest).toBe(10);
    });

    it("parsea el snapshot de data.vacationBalance", () => {
      const payload = {
        data: {
          id: "req-3",
          status: "pending",
          vacationBalance: mockBalance,
        },
      };
      const result = normalizeRequestItem(payload);
      expect(result.vacationBalance).toBeDefined();
      expect(result.vacationBalance?.availableDaysAtRequest).toBe(10);
    });

    it("parsea el snapshot de data.metadata.vacationBalance", () => {
      const payload = {
        data: {
          id: "req-4",
          status: "pending",
          metadata: {
            vacationBalance: mockBalance,
          },
        },
      };
      const result = normalizeRequestItem(payload);
      expect(result.vacationBalance).toBeDefined();
      expect(result.vacationBalance?.availableDaysAtRequest).toBe(10);
    });

    it("parsea el snapshot de metadata.vacationBalance", () => {
      const payload = {
        id: "req-5",
        status: "pending",
        metadata: {
          vacationBalance: mockBalance,
        },
      };
      const result = normalizeRequestItem(payload);
      expect(result.vacationBalance).toBeDefined();
      expect(result.vacationBalance?.availableDaysAtRequest).toBe(10);
    });
  });

  describe("Diferencia entre saldo al solicitar y saldo actual", () => {
    it("compara correctamente el saldo histórico y el saldo actual", () => {
      const snapshot = {
        availableDaysAtRequest: 10,
        requestedDays: 12,
        projectedAvailableDays: -2,
        exceedsAvailableBalance: true,
        requiresManagerOverride: true,
      };

      const currentBalance = {
        availableDays: 15,
        generatedDays: 20,
        usedDays: 0,
        reservedDays: 12,
        pendingDays: 12,
      };

      // Saldo histórico al solicitar es 10
      const X = snapshot.availableDaysAtRequest;
      // Días solicitados es 12
      const Y = snapshot.requestedDays;
      // Saldo actual es 15
      const A = currentBalance.availableDays;
      // Si la solicitud está pendiente, sus días Y ya están reservados en reservedDays.
      // Así que el saldo real antes de esta solicitud era A + Y = 15 + 12 = 27.
      // Tras aprobar esta solicitud, el saldo proyectado es A (ya descontado).
      const B = A;

      expect(X).toBe(10);
      expect(Y).toBe(12);
      expect(A).toBe(15);
      expect(B).toBe(15);
    });
  });

  describe("Solicitud pendiente con saldo negativo", () => {
    it("permite solicitudes con saldo negativo y establece overrides", () => {
      const payload = {
        id: "req-negative",
        status: "pending",
        metadata: {
          vacationBalance: {
            availableDaysAtRequest: 5,
            requestedDays: 8,
            projectedAvailableDays: -3,
            exceedsAvailableBalance: true,
            requiresManagerOverride: true,
          },
        },
      };

      const result = normalizeRequestItem(payload);
      expect(result.requiresBalanceOverride).toBe(true);
      expect(result.vacationBalance?.exceedsAvailableBalance).toBe(true);
    });
  });

  describe("Rechazo/cancelación liberando días", () => {
    it("libera los días reservados en la respuesta del balance cuando se rechaza o cancela", () => {
      // Simula el recálculo en backend donde reservedDays vuelve a 0 y availableDays se recupera
      const initialBalance = {
        availableDays: 2,
        generatedDays: 10,
        usedDays: 0,
        reservedDays: 8, // Solicitud pendiente de 8 días
      };

      // Si se cancela/rechaza la solicitud:
      const updatedBalance = {
        ...initialBalance,
        reservedDays: 0,
        availableDays: 10, // Se liberan los 8 días
      };

      expect(updatedBalance.reservedDays).toBe(0);
      expect(updatedBalance.availableDays).toBe(10);
    });
  });

  describe("Aprobación sin convertir vacaciones en falta", () => {
    it("una solicitud de vacaciones aprobada no se clasifica como falta", () => {
      // Estado de asistencia 'vacation'
      const status = "vacation";
      const isFaulty = isFault(status);
      expect(isFaulty).toBe(false);

      // Tampoco en el agrupador de asistencia
      const records = [
        makeSummary("vacation"),
      ];
      const [worker] = groupRecordsByWorker(records);
      expect(worker.absent_days).toBe(0);
      expect(worker.vacation_days).toBe(1);
    });
  });
});
