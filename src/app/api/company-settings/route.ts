import { handleRouteError } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

import {
 proxyCompanySettingsRequest,
 readCompanySettingsRequestBody,
} from "./company-settings-route-utils";

export async function GET() {
 try {
 return await proxyCompanySettingsRequest({
 pathCandidates: backendRoutes.companySettings.settings,
 method: "GET",
 });
 } catch (error) {
 return handleRouteError(error);
 }
}

export async function PUT(request: Request) {
 try {
 const body = await readCompanySettingsRequestBody(request);

 return await proxyCompanySettingsRequest({
 pathCandidates: backendRoutes.companySettings.settings,
 method: "PUT",
 body,
 });
 } catch (error) {
 return handleRouteError(error);
 }
}

