let clientAccessToken: string | null = null;

export function setClientAccessToken(token?: string | null) {
 const normalized = token?.trim();
 clientAccessToken = normalized ? normalized : null;
}

export function getClientAccessToken() {
 return clientAccessToken;
}

export function clearClientAccessToken() {
 clientAccessToken = null;
}
