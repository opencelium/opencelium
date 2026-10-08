import { describe, expect, it } from 'vitest';
import en from '@shared/i18n/locales/en/error.json';
import de from '@shared/i18n/locales/de/error.json';
import { toInstallInvokersError } from './installInvokersFromRepository';

describe('toInstallInvokersError', () => {
	it('maps the backend 502 (repository unreachable from the server) to a NETWORK error', () => {
		expect(toInstallInvokersError({
			status: 502, data: { error: 'INVOKER_REPOSITORY_UNAVAILABLE' },
		})).toEqual({ type: 'NETWORK', messageKey: 'invokerRepository.unavailable' });
	});

	it('maps a browser that cannot reach the backend to a NETWORK error', () => {
		expect(toInstallInvokersError({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }))
			.toEqual({ type: 'NETWORK', messageKey: 'invokerRepository.serverUnreachable' });
	});

	it('falls back to the generic mapping for other failures', () => {
		expect(toInstallInvokersError({ status: 401 })).toMatchObject({
			type: 'UNAUTHORIZED', request: { url: '/invoker/remote', method: 'POST' },
		});
	});

	it('ships every invokerRepository message in en and de', () => {
		const keys = ['offline', 'syncDisabled', 'unavailable', 'serverUnreachable'];
		for (const locale of [en, de]) {
			const messages = locale.api.invokerRepository as Record<string, string>;
			keys.forEach((key) => expect(messages[key]).toBeTruthy());
		}
	});
});
