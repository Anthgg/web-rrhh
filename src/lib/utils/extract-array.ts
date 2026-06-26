/* eslint-disable @typescript-eslint/no-explicit-any */
export function unwrapData<T = unknown>(response: unknown): T | null {
  if (!response || typeof response !== "object") return null;

  const obj = response as any;

  if ("data" in obj) return obj.data as T;

  return response as T;
}

export function extractArray<T = any>(
  response: unknown,
  possibleKeys: string[] = ["items", "results", "data", "assignments", "shifts", "activities"]
): T[] {
  if (Array.isArray(response)) return response as T[];

  const data = unwrapData<any>(response);

  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    for (const key of possibleKeys) {
      if (Array.isArray(data[key])) return data[key] as T[];
    }
  }

  if (response && typeof response === "object") {
    const obj = response as any;

    for (const key of possibleKeys) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }

  return [];
}
