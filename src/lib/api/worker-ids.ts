const UUID_REGEX =
 /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
 return typeof value === "string" && UUID_REGEX.test(value.trim());
}

export function getSafeWorkerId(worker: unknown): string | null {
 if (worker && typeof worker === "object") {
 const record = worker as Record<string, unknown>;
 const candidate = record.worker_id ?? record.workerId ?? record.id ?? null;
 return isUuid(candidate) ? candidate : null;
 }
 return null;
}

export function getSafeUserId(worker: unknown): string | null {
 if (worker && typeof worker === "object") {
 const record = worker as Record<string, unknown>;
 const candidate = record.user_id ?? record.userId ?? null;
 return isUuid(candidate) ? candidate : null;
 }
 return null;
}

export function isWorkerProfileComplete(worker: unknown): boolean {
 return Boolean(getSafeWorkerId(worker));
}

export function isWorkerProfileIncomplete(worker: unknown): boolean {
 return !getSafeWorkerId(worker) && Boolean(getSafeUserId(worker));
}

export function getWorkerProfileStatus(worker: unknown): "complete" | "incomplete" {
 return getSafeWorkerId(worker) ? "complete" : "incomplete";
}
