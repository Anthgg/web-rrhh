import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

async function trustSession(
  method: "PATCH" | "POST",
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const context = await getSessionContext();
    const response = await backendRequest({
      method,
      pathCandidates: backendRoutes.profile.sessionTrust(id),
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });
    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  return trustSession("PATCH", props);
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  return trustSession("POST", props);
}
