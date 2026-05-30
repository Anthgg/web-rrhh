import { getSessionContext } from "@/lib/api/session-context";
import { backendRequest } from "@/lib/api/backend-client";
import { backendRoutes } from "@/lib/config/backend-routes";
import { normalizeRequestTemplates } from "@/lib/api/normalizers";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const context = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: backendRoutes.requests.templates,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    try {
      fs.writeFileSync(
        path.join(process.cwd(), "debug-requests-templates.json"),
        JSON.stringify(response.data, null, 2),
        "utf-8"
      );
    } catch {
      // Ignorar error al escribir
    }

    return jsonResponse(normalizeRequestTemplates(response.data));
  } catch (error) {
    return handleRouteError(error);
  }
}
