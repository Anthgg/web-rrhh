import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

async function handleProxy(
  request: Request,
  params: Promise<{ proxy: string[] }> | { proxy: string[] },
  method: "GET" | "POST" | "PUT" | "DELETE"
) {
  const resolvedParams = await Promise.resolve(params);
  const joinedProxy = resolvedParams.proxy.join("/");

  try {
    const context = await getSessionContext();
    const pathWithApi = `/api/admin/${joinedProxy}`;
    const pathWithoutApi = `/admin/${joinedProxy}`;
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
