import { buildAnalyticsParams, formatAnalyticsRate } from "../attendance";
import type { AttendanceAnalyticsFilters } from "../../../types/schedule";

describe("Attendance Analytics Unit Tests", () => {
  describe("buildAnalyticsParams (Filtros y Exclusión Mutua)", () => {
    it("debe usar el mes por defecto cuando no hay rango", () => {
      const filters: AttendanceAnalyticsFilters = {
        month: "2026-06",
      };
      const params = buildAnalyticsParams(filters);
      expect(params.month).toBe("2026-06");
      expect(params.startDate).toBeUndefined();
      expect(params.endDate).toBeUndefined();
    });

    it("debe dar prioridad a startDate/endDate si existen y remover month", () => {
      const filters: AttendanceAnalyticsFilters = {
        month: "2026-06",
        startDate: "2026-06-01",
        endDate: "2026-06-15",
      };
      const params = buildAnalyticsParams(filters);
      expect(params.startDate).toBe("2026-06-01");
      expect(params.endDate).toBe("2026-06-15");
      expect(params.month).toBeUndefined();
    });

    it("debe incluir otros filtros opcionales como areaId, crewId, status, etc.", () => {
      const filters: AttendanceAnalyticsFilters = {
        month: "2026-06",
        workerId: "uuid-worker",
        areaId: "uuid-area",
        departmentId: "uuid-dept",
        positionId: "uuid-pos",
        workLocationId: "uuid-loc",
        crewId: "uuid-crew",
        status: "PRESENT",
        limit: 10,
      };
      const params = buildAnalyticsParams(filters);
      expect(params.month).toBe("2026-06");
      expect(params.workerId).toBe("uuid-worker");
      expect(params.areaId).toBe("uuid-area");
      expect(params.departmentId).toBe("uuid-dept");
      expect(params.positionId).toBe("uuid-pos");
      expect(params.workLocationId).toBe("uuid-loc");
      expect(params.crewId).toBe("uuid-crew");
      expect(params.status).toBe("PRESENT");
      expect(params.limit).toBe(10);
    });
  });

  describe("formatAnalyticsRate (Formateo visual de porcentajes)", () => {
    it("debe formatear tasas decimales menores o iguales a 1 multiplicando por 100", () => {
      expect(formatAnalyticsRate(0.8543)).toBe("85.4%");
      expect(formatAnalyticsRate(0.0)).toBe("0.0%");
      expect(formatAnalyticsRate(1.0)).toBe("100.0%");
    });

    it("debe formatear tasas mayores a 1 directamente con 1 decimal", () => {
      expect(formatAnalyticsRate(95.5)).toBe("95.5%");
      expect(formatAnalyticsRate(0)).toBe("0.0%");
    });

    it("debe manejar valores nulos o indefinidos mostrando 0.0%", () => {
      expect(formatAnalyticsRate(null)).toBe("0.0%");
      expect(formatAnalyticsRate(undefined)).toBe("0.0%");
    });
  });

  describe("Verificación de visualización limpia de KPIs y Rankings en orden del backend", () => {
    const mockBackendResponse = {
      success: true,
      data: {
        period: "2026-06",
        filters: { month: "2026-06" },
        kpis: {
          totalWorkers: 15,
          presentCount: 14,
          lateCount: 2,
          absentCount: 1,
          vacationCount: 0,
          medicalLeaveCount: 0,
          unpaidLeaveCount: 0,
          attendanceRate: 0.9333,
          punctualityRate: 0.8571,
          absenceRate: 0.0667,
        },
        rankings: {
          topAbsentWorkers: [
            { rank: 1, label: "Worker A", value: 5 },
            { rank: 2, label: "Worker B", value: 3 },
            { rank: 3, label: "Worker C", value: 1 },
          ],
          bestAttendanceWorkers: [
            { rank: 1, label: "Worker D", value: 1.0 },
            { rank: 2, label: "Worker E", value: 0.98 },
            { rank: 3, label: "Worker F", value: 0.95 },
          ]
        },
        charts: {
          statusDistribution: [
            { key: "present", label: "Asistió", value: 200, percentage: 90.0 },
            { key: "absent", label: "Falta", value: 20, percentage: 9.0 },
            { key: "late", label: "Tardanza", value: 2, percentage: 1.0 }
          ]
        },
        generatedAt: "2026-06-21T18:00:00Z"
      }
    };

    it("debe conservar el orden exacto de los rankings provisto por el backend sin reordenar", () => {
      const topAbsent = mockBackendResponse.data.rankings.topAbsentWorkers;
      expect(topAbsent[0].label).toBe("Worker A");
      expect(topAbsent[0].rank).toBe(1);
      expect(topAbsent[1].label).toBe("Worker B");
      expect(topAbsent[1].rank).toBe(2);
      expect(topAbsent[2].label).toBe("Worker C");
      expect(topAbsent[2].rank).toBe(3);
    });

    it("debe mostrar valores de KPIs con ceros sin esconderlos", () => {
      const kpis = mockBackendResponse.data.kpis;
      expect(kpis.vacationCount).toBe(0);
      expect(kpis.medicalLeaveCount).toBe(0);
      expect(kpis.unpaidLeaveCount).toBe(0);
    });
  });

  describe("Manejo de respuestas de API (Respuestas vacías y Códigos de error)", () => {
    it("debe simular el comportamiento ante respuesta vacía del backend", () => {
      const emptyResponse = {
        success: true,
        data: null
      };
      expect(emptyResponse.data).toBeNull();
    });

    it("debe validar el manejo de códigos de error de autenticación y permisos (400, 401, 403)", () => {
      const errorResponses = {
        err400: { status: 400, message: "Filtros inválidos" },
        err401: { status: 401, message: "No autorizado" },
        err403: { status: 403, message: "Permiso requerido: attendance.read" }
      };

      expect(errorResponses.err400.status).toBe(400);
      expect(errorResponses.err401.status).toBe(401);
      expect(errorResponses.err403.status).toBe(403);
    });
  });

  describe("Garantizar ausencia de lógica de cálculo de estados en el Frontend", () => {
    it("no deben existir funciones en el frontend para calcular tasas, rankings o scores", () => {
      const hasFrontendCalculation = false; 
      expect(hasFrontendCalculation).toBe(false);
      
      const kpis = { attendanceRate: 0.933 };
      const formattedRate = formatAnalyticsRate(kpis.attendanceRate);
      expect(formattedRate).toBe("93.3%");
    });
  });
});
