import { backendRequest } from "@/lib/api/backend-client";

interface CatalogItem {
  id: string;
  name: string;
}

let cachedCatalogs: {
  positions: CatalogItem[];
  departments: CatalogItem[];
  areas: CatalogItem[];
  branches: CatalogItem[];
  expiresAt: number;
} | null = null;

export async function getCatalogs(context: { accessToken: string | null; refreshToken: string | null }) {
  const now = Date.now();
  if (cachedCatalogs && cachedCatalogs.expiresAt > now) {
    return cachedCatalogs;
  }

  try {
    const [positionsRes, departmentsRes, areasRes, branchesRes] = await Promise.all([
      backendRequest<CatalogItem[]>({
        pathCandidates: ["/api/positions", "/api/workers/positions"],
        accessToken: context.accessToken,
        refreshToken: context.refreshToken,
      }).catch(() => ({ data: [] })),
      backendRequest<CatalogItem[]>({
        pathCandidates: ["/api/departments"],
        accessToken: context.accessToken,
        refreshToken: context.refreshToken,
      }).catch(() => ({ data: [] })),
      backendRequest<CatalogItem[]>({
        pathCandidates: ["/api/areas"],
        accessToken: context.accessToken,
        refreshToken: context.refreshToken,
      }).catch(() => ({ data: [] })),
      backendRequest<CatalogItem[]>({
        pathCandidates: ["/api/branches", "/api/workers/branches"],
        accessToken: context.accessToken,
        refreshToken: context.refreshToken,
      }).catch(() => ({ data: [] })),
    ]);

    cachedCatalogs = {
      positions: Array.isArray(positionsRes.data) ? positionsRes.data : [],
      departments: Array.isArray(departmentsRes.data) ? departmentsRes.data : [],
      areas: Array.isArray(areasRes.data) ? areasRes.data : [],
      branches: Array.isArray(branchesRes.data) ? branchesRes.data : [],
      expiresAt: now + 5 * 60 * 1000, // 5 minutes cache
    };
  } catch (error) {
    console.error("Error fetching catalogs for populating workers:", error);
    return {
      positions: [],
      departments: [],
      areas: [],
      branches: [],
    };
  }

  return cachedCatalogs;
}

export function populateWorkerData(
  worker: any,
  catalogs: {
    positions: CatalogItem[];
    departments: CatalogItem[];
    areas: CatalogItem[];
    branches: CatalogItem[];
  }
) {
  if (!worker || typeof worker !== "object") return worker;

  const positionId = worker.position_id || worker.job_position_id;
  const areaId = worker.area_id;
  const departmentId = worker.department_id;
  const branchId = worker.branch_id;

  const positionName = catalogs.positions.find((p) => p.id === positionId)?.name;
  const areaName = catalogs.areas.find((a) => a.id === areaId)?.name;
  const departmentName = catalogs.departments.find((d) => d.id === departmentId)?.name;
  const branchName = catalogs.branches.find((b) => b.id === branchId)?.name;

  return {
    ...worker,
    position: positionName || worker.position || undefined,
    department: areaName || departmentName || worker.department || undefined,
    project: branchName || worker.project || undefined,
  };
}
