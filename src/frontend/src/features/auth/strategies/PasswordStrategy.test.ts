import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@shared/api/apiFetch', () => ({
	apiFetchWithHeaders: vi.fn(),
}));
vi.mock('@shared/api/apiExecutor', () => ({
	apiExecutor: vi.fn(),
}));

import { apiFetchWithHeaders } from '@shared/api/apiFetch';
import { PasswordStrategy, SessionHydrationError } from './PasswordStrategy';

// Regression coverage for a bug where /login succeeded but the UI stayed on
// the login page showing "invalid credentials" — caused by the follow-up
// GET /user/{id} call (which hydrates the session) failing transiently right
// after the token was issued. See PasswordStrategy.completeLogin/fetchUser.

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.mock-signature'; // decodes to {"userId":1}
const mockUser = {
	userId: 1,
	email: 'a@b.com',
	userGroup: { groupId: 1, name: 'Admin', components: [] },
	userDetail: { name: 'A', surname: 'B' },
};

const loginResponse = { data: {}, headers: new Headers({ Authorization: `Bearer ${TOKEN}` }), status: 200 };
const userResponse = { data: mockUser, headers: new Headers(), status: 200 };

const fetchMock = apiFetchWithHeaders as unknown as ReturnType<typeof vi.fn>;

describe('PasswordStrategy login/user-hydration', () => {
	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
		fetchMock.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('logs in normally when the user fetch succeeds on the first try', async () => {
		fetchMock.mockImplementation(async (path: string) =>
			path === '/login' ? loginResponse : userResponse);

		const result = await new PasswordStrategy().login({ email: 'a@b.com', password: 'x' });

		expect(result.status).toBe('authenticated');
		expect(localStorage.getItem('oc_auth_token')).toBe(TOKEN);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('retries the user fetch once and still completes login if the retry succeeds', async () => {
		vi.useFakeTimers();
		let userFetchAttempts = 0;
		fetchMock.mockImplementation(async (path: string) => {
			if (path === '/login') return loginResponse;
			userFetchAttempts += 1;
			if (userFetchAttempts === 1) throw new Error('transient user-fetch failure');
			return userResponse;
		});

		const pending = new PasswordStrategy().login({ email: 'a@b.com', password: 'x' });
		await vi.runAllTimersAsync();
		const result = await pending;

		expect(result.status).toBe('authenticated');
		expect(userFetchAttempts).toBe(2);
		expect(localStorage.getItem('oc_auth_token')).toBe(TOKEN);
	});

	it('throws SessionHydrationError (not a login failure) and clears the token when the user fetch keeps failing', async () => {
		vi.useFakeTimers();
		fetchMock.mockImplementation(async (path: string) => {
			if (path === '/login') return loginResponse;
			throw new Error('persistent user-fetch failure');
		});

		const pending = new PasswordStrategy().login({ email: 'a@b.com', password: 'x' });
		// Attach the rejection handler before advancing timers so the rejection
		// is never briefly "unhandled" between the throw and this assertion.
		const expectation = expect(pending).rejects.toBeInstanceOf(SessionHydrationError);
		await vi.runAllTimersAsync();
		await expectation;
		expect(localStorage.getItem('oc_auth_token')).toBeNull();
	});
});
