import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type PdfFilters = Record<string, string | number | boolean | null | undefined>;

const cleanFilters = (filters: PdfFilters) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== "" && value !== null && value !== undefined),
  );

function getStoredAccessToken() {
  if (typeof window === "undefined") return null;

  return (
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("accessToken") ||
    window.sessionStorage.getItem("token") ||
    window.sessionStorage.getItem("accessToken")
  );
}

function resolveRequestUrl(endpointUrl: string) {
  if (endpointUrl.startsWith("/api/")) {
    return endpointUrl;
  }

  return `${API_URL}${endpointUrl}`;
}

export async function downloadCorporatePdf(
  endpointUrl: string,
  filename: string,
  filters: PdfFilters = {},
) {
  const token = getStoredAccessToken();
  const requestUrl = resolveRequestUrl(endpointUrl);
  const response = await axios.post(
    requestUrl,
    {
      filters: cleanFilters(filters),
    },
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      responseType: "blob",
      withCredentials: true,
      validateStatus: () => true,
    },
  );

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    throw new Error("NO_TOKEN");
  }

  if (response.status === 403) {
    throw new Error("FORBIDDEN");
  }

  if (response.status >= 400) {
    throw new Error(`HTTP_${response.status}`);
  }

  const contentType = response.headers["content-type"];
  if (contentType && !String(contentType).includes("application/pdf")) {
    throw new Error("INVALID_PDF_RESPONSE");
  }

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
