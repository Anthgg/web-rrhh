import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { appConfig } from "@/lib/config/app-config";

async function handleProxy(
  request: Request,
  params: Promise<{ proxy: string[] }> | { proxy: string[] },
  method: "GET" | "POST" | "PUT" | "DELETE"
) {
  const resolvedParams = await Promise.resolve(params);
  const joinedProxy = resolvedParams.proxy.join("/");

  if (joinedProxy === "analytics/export") {
    try {
      const context = await getSessionContext();
      const url = new URL(request.url);
      const query = Object.fromEntries(url.searchParams.entries());
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.set(key, value);
        }
      }
      
      const backendUrl = `${appConfig.backendBaseUrl}/api/attendance/analytics/export?${queryParams.toString()}`;
      
      let body: any = undefined;
      if (method === "POST") {
        try {
          body = await request.clone().json();
        } catch {
          // No body or not JSON
        }
      }

      const fetchResponse = await fetch(backendUrl, {
        method,
        headers: {
          Accept: "*/*",
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(context.accessToken ? { Authorization: `Bearer ${context.accessToken}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!fetchResponse.ok) {
        return new Response(await fetchResponse.text(), {
          status: fetchResponse.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      const headers = new Headers();
      const contentDisposition = fetchResponse.headers.get("content-disposition");
      const contentType = fetchResponse.headers.get("content-type");
      
      if (contentDisposition) headers.set("Content-Disposition", contentDisposition);
      if (contentType) headers.set("Content-Type", contentType);

      return new Response(fetchResponse.body, {
        status: 200,
        headers,
      });
    } catch (error) {
      console.error("[PROXY ERROR ATTENDANCE EXPORT]:", error);
      return handleRouteError(error);
    }
  }

  try {
    const context = await getSessionContext();
    const pathWithApi = `/api/attendance/${joinedProxy}`;
    const pathWithoutApi = `/attendance/${joinedProxy}`;
    const pathCandidates = [pathWithApi, pathWithoutApi];

    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());

    let body: unknown = undefined;
    if (method === "POST" || method === "PUT") {
      try {
        body = await request.json();
      } catch {
        // Body is either not JSON or empty
      }
    }

    const response = await backendRequest({
      pathCandidates,
      method,
      body,
      query,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(response.data);
  } catch (error) {
    console.error("[PROXY ERROR ATTENDANCE]:", error);
    return handleRouteError(error);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ proxy: string[] }> | { proxy: string[] } }
) {
  return handleProxy(request, params, "GET");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ proxy: string[] }> | { proxy: string[] } }
) {
  return handleProxy(request, params, "POST");
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ proxy: string[] }> | { proxy: string[] } }
) {
  return handleProxy(request, params, "PUT");
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ proxy: string[] }> | { proxy: string[] } }
) {
  return handleProxy(request, params, "DELETE");
}
