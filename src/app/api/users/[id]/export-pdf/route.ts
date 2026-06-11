import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError } from "@/lib/api/server-utils";
import { appConfig } from "@/lib/config/app-config";

const buildBackendUrl = (id: string) =>
 new URL(`/api/users/${encodeURIComponent(id)}/export-pdf`, appConfig.backendBaseUrl).toString();

export async function GET(_: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
 try {
 const { id } = await context.params;
 const sessionContext = await getSessionContext();
 const response = await fetch(buildBackendUrl(id), {
 method: "GET",
 headers: {
 Authorization: `Bearer ${sessionContext.accessToken}`,
 Accept: "application/pdf",
 },
 cache: "no-store",
 redirect: "follow",
 });

 if (!response.ok) {
 return new Response(await response.text().catch(() => "No se pudo exportar el PDF."), {
 status: response.status,
 });
 }

 const headers = new Headers({
 "Cache-Control": "no-store",
 "Content-Type": response.headers.get("content-type") ?? "application/pdf",
 });

 const contentDisposition = response.headers.get("content-disposition");
 if (contentDisposition) {
 headers.set("Content-Disposition", contentDisposition);
 }

 return new Response(response.body, {
 status: response.status,
 headers,
 });
 } catch (error) {
 return handleRouteError(error);
 }
}
