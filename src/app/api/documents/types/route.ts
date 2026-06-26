import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

export async function GET() {
  const defaultTypes = [
    "DNI",
    "CV",
    "MEDICAL_CERTIFICATE",
    "BACKGROUND_CHECK",
    "STUDIES_CERTIFICATE"
  ];

  try {
    const context = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: [
        "/api/documents/types",
        "/api/documents/categories",
        "/api/document-types"
      ],
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    if (response?.data && Array.isArray(response.data)) {
      return jsonResponse(response.data);
    }
    
    return jsonResponse(defaultTypes);
  } catch (error) {
    // If backend doesn't support the endpoint, fallback gracefully to standard types
    return jsonResponse(defaultTypes);
  }
}
