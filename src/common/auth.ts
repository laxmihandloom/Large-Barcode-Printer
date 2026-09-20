// Zoho's implicit flow returns a token in the URL hash and gives no refresh
// token, so the only thing guarding against a mid-session expiry is checking
// the stored expiry ourselves before each call.

export const TOKEN_KEY = 'accessToken';
export const EXPIRY_KEY = 'expiresIn';

// Treat a token that is about to expire as already expired, so a long request
// started just before the boundary does not fail server-side.
export const EXPIRY_SKEW_MS = 60_000;

export class SessionExpiredError extends Error {
	constructor() {
		super('Zoho session expired');
		this.name = 'SessionExpiredError';
	}
}

export const isSessionExpiredError = (err: unknown): boolean =>
	err instanceof SessionExpiredError ||
	(typeof err === 'object' && err !== null && (err as { name?: string }).name === 'SessionExpiredError');

// Exported for testing: the expiry decision with no dependency on globals.
export const isExpiry = (
	expiresAt: string | null,
	now: number,
	skewMs: number = EXPIRY_SKEW_MS
): boolean => {
	if (!expiresAt) return true;
	const expiryTime = new Date(expiresAt).getTime();
	if (Number.isNaN(expiryTime)) return true;
	return expiryTime - skewMs <= now;
};

export const storeSession = (accessToken: string, expiresInSeconds: number): void => {
	localStorage.setItem(TOKEN_KEY, accessToken);
	localStorage.setItem(EXPIRY_KEY, new Date(Date.now() + expiresInSeconds * 1000).toString());
};

export const clearSession = (): void => {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(EXPIRY_KEY);
};

export const hasValidSession = (now: number = Date.now()): boolean => {
	const token = localStorage.getItem(TOKEN_KEY);
	if (!token) return false;
	return !isExpiry(localStorage.getItem(EXPIRY_KEY), now);
};

// Returns the token, or throws so callers surface a clear "log in again"
// message instead of an opaque 401 from Zoho.
export const requireAccessToken = (): string => {
	if (!hasValidSession()) {
		clearSession();
		throw new SessionExpiredError();
	}
	return localStorage.getItem(TOKEN_KEY) as string;
};
