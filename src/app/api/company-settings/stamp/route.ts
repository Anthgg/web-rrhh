import { handleRouteError } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

import {
  proxyCompanySettingsRequest,
  readCompanySettingsRequestBody,
} from "../company-settings-route-utils";

export async function POST(request: Request) {
  try {
    const body = await readCompanySettingsRequestBody(request);

    return await proxyCompanySettingsRequest({
      pathCandidates: backendRoutes.companySettings.stamp,
      method: "POST",
      body,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE() {
  try {
    return await proxyCompanySettingsRequest({
      pathCandidates: backendRoutes.companySettings.stamp,
      method: "DELETE",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

