export function withPdfCacheBust(url?: string | null, timestamp = Date.now()) {
 if (!url) return "";

 try {
 const parsedUrl = new URL(url, window.location.origin);
 parsedUrl.searchParams.set("t", String(timestamp));
 return parsedUrl.toString();
 } catch {
 const separator = url.includes("?") ? "&" : "?";
 return `${url}${separator}t=${timestamp}`;
 }
}
