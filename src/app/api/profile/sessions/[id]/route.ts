import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const context = await getSessionContext();
    const response = await backendRequest({
      method: "DELETE",
      pathCandidates: backendRoutes.profile.sessionRevoke(id),
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });
    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}
