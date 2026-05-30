export function extractArray<T = any>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.items && Array.isArray(data.items)) return data.items;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.data?.items && Array.isArray(data.data.items)) return data.data.items;
  if (data.data?.data && Array.isArray(data.data.data)) return data.data.data;
  return [];
}
