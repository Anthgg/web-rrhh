import type { CatalogItem } from "../types/onboarding.types";

type LooseRecord = Record<string, unknown>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const asRecord = (value: unknown): LooseRecord | null =>
  value && typeof value === "object" ? (value as LooseRecord) : null;

const readPath = (source: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((current, segment) => asRecord(current)?.[segment], source);

const firstString = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = readPath(source, path);
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return "";
};

const firstUuid = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = firstString(source, [path]);
    if (isUuid(value)) return value;
  }

  return "";
};

const extractCollection = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const source =
    readPath(payload, "data.data.items") ??
    readPath(payload, "data.data.results") ??
    readPath(payload, "data.data.rows") ??
    readPath(payload, "data.data.catalog") ??
    readPath(payload, "data.data.catalogs") ??
    readPath(payload, "data.data") ??
    readPath(payload, "data.items") ??
    readPath(payload, "data.results") ??
    readPath(payload, "data.rows") ??
    readPath(payload, "data.catalog") ??
    readPath(payload, "data.catalogs") ??
    readPath(payload, "data") ??
    readPath(payload, "items") ??
    readPath(payload, "results") ??
    readPath(payload, "rows") ??
    readPath(payload, "catalog") ??
    readPath(payload, "catalogs");

  return Array.isArray(source) ? source : [];
};

const ID_PATHS = [
  "id",
  "uuid",
  "_id",
  "value",
  "companyId",
  "company_id",
  "branchId",
  "branch_id",
  "departmentId",
  "department_id",
  "areaId",
  "area_id",
  "positionId",
  "position_id",
  "workerTypeId",
  "worker_type_id",
  "typeId",
  "type_id",
  "shiftId",
  "shift_id",
  "supervisorId",
  "supervisor_id",
  "costCenterId",
  "cost_center_id",
  "costCenterUuid",
  "cost_center_uuid",
  "user.id",
  "user.uuid",
  "worker.id",
  "worker.uuid",
];

const NAME_PATHS = [
  "label",
  "name",
  "fullName",
  "full_name",
  "displayName",
  "display_name",
  "razon_social",
  "nombre_comercial",
  "nombre",
  "description",
  "descripcion",
  "title",
  "code",
  "codigo",
];

export const isUuid = (value?: string | null) => Boolean(value && UUID_PATTERN.test(value));

export function normalizeCatalogItems(payload: unknown): CatalogItem[] {
  return extractCollection(payload).reduce<CatalogItem[]>((items, entry) => {
    const record = asRecord(entry);
    if (!record) return items;

    const id = firstUuid(record, ID_PATHS);
    if (!id) return items;

    const code = firstString(record, ["code", "codigo", "costCenterCode", "cost_center_code"]);
    const name = firstString(record, NAME_PATHS) || id;
    const label = code && name && code !== name ? `${code} - ${name}` : name;
    const schedule = firstString(record, ["schedule", "horario", "workSchedule", "work_schedule"]);
    const departmentId = firstUuid(record, ["departmentId", "department_id"]);
    const areaId = firstUuid(record, ["areaId", "area_id"]);

    items.push({
      id,
      name: label,
      code: code || undefined,
      schedule: schedule || undefined,
      departmentId: departmentId || undefined,
      areaId: areaId || undefined,
    });

    return items;
  }, []);
}
