import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	isExpiry,
	storeSession,
	clearSession,
	hasValidSession,
	requireAccessToken,
	isSessionExpiredError,
	SessionExpiredError,
	TOKEN_KEY,
	EXPIRY_KEY,
	EXPIRY_SKEW_MS
} from './auth';

const NOW = new Date('2026-09-21T12:00:00Z').getTime();
const inMinutes = (m: number) => new Date(NOW + m * 60_000).toString();

describe('isExpiry', () => {
	it('treats a missing expiry as expired', () => {
		expect(isExpiry(null, NOW)).toBe(true);
	});

	it('treats an unparseable expiry as expired', () => {
		expect(isExpiry('not a date', NOW)).toBe(true);
	});

	it('is valid well before the expiry', () => {
		expect(isExpiry(inMinutes(30), NOW)).toBe(false);
	});

	it('is expired after the expiry', () => {
		expect(isExpiry(inMinutes(-1), NOW)).toBe(true);
	});

	it('expires early by the skew window, so in-flight calls do not 401', () => {
		// 30s left is inside the 60s skew, so it counts as expired.
		expect(isExpiry(inMinutes(0.5), NOW)).toBe(true);
		expect(EXPIRY_SKEW_MS).toBe(60_000);
	});
});

describe('session storage', () => {
	// These exercise hasValidSession/requireAccessToken, which read the real
	// clock, so pin it - otherwise the fixtures drift in and out of validity
	// depending on when the suite runs.
	beforeEach(() => {
		localStorage.clear();
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('round-trips a stored session', () => {
		storeSession('tok-123', 3600);
		expect(localStorage.getItem(TOKEN_KEY)).toBe('tok-123');
		expect(hasValidSession()).toBe(true);
		expect(requireAccessToken()).toBe('tok-123');
	});

	it('is invalid with no token even if the expiry is in the future', () => {
		localStorage.setItem(EXPIRY_KEY, inMinutes(30));
		expect(hasValidSession()).toBe(false);
	});

	it('clears both keys', () => {
		storeSession('tok-123', 3600);
		clearSession();
		expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
		expect(localStorage.getItem(EXPIRY_KEY)).toBeNull();
	});

	it('throws and clears the session once the token has expired', () => {
		localStorage.setItem(TOKEN_KEY, 'stale');
		localStorage.setItem(EXPIRY_KEY, inMinutes(-5));
		expect(() => requireAccessToken()).toThrow(SessionExpiredError);
		expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
	});

	it('recognises its own error type', () => {
		expect(isSessionExpiredError(new SessionExpiredError())).toBe(true);
		expect(isSessionExpiredError(new Error('network'))).toBe(false);
	});
});
