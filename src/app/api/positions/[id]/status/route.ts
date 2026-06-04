import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const context = await getSessionContext();
    const body = await request.json();
    const normalizedBody =
      typeof body?.is_active === "boolean"
        ? { is_active: body.is_active }
        : { is_active: body?.status === "active" || body?.status === true };

    const response = await backendRequest({
      method: "PATCH",
      pathCandidates: [`/api/positions/${id}/status`],
      body: normalizedBody,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}
