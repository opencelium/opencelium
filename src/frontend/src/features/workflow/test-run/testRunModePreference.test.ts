import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_TEST_RUN_MODE, isTestRunModePromptSuppressed, suppressTestRunModePrompt } from './testRunModePreference';

describe('testRunModePreference', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('shows the prompt until it is dismissed', () => {
		expect(isTestRunModePromptSuppressed()).toBe(false);
		suppressTestRunModePrompt();
		expect(isTestRunModePromptSuppressed()).toBe(true);
	});

	it('falls back to debug mode, never live, once the prompt is suppressed', () => {
		expect(DEFAULT_TEST_RUN_MODE).toBe('debug');
	});
});
