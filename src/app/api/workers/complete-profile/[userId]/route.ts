import { backendRequest } from "@/lib/api/backend-client";
import { appConfig } from "@/lib/config/app-config";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

const completeProfilePathCandidates = (userId: string) => [
  `/api/workers/complete-profile/${userId}`,
  `/api/admin/workers/complete-profile/${userId}`,
  `/api/workers/${userId}/complete-profile`,
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  try {
    const context = await getSessionContext();
    if (process.env.NODE_ENV !== "production") {
      console.info("[workers/complete-profile] GET backend", {
        baseUrl: appConfig.backendBaseUrl,
        userId,
      });
    }

    const response = await backendRequest({
      pathCandidates: completeProfilePathCandidates(userId),
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  try {
    const payload = await request.json();
    const context = await getSessionContext();
    if (process.env.NODE_ENV !== "production") {
      console.info("[workers/complete-profile] PUT backend", {
        baseUrl: appConfig.backendBaseUrl,
        userId,
      });
    }

    const response = await backendRequest({
      pathCandidates: completeProfilePathCandidates(userId),
      method: "PUT",
      body: payload,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}
