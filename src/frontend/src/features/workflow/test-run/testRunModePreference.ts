export type TestRunMode = 'debug' | 'live';

const SUPPRESS_KEY = 'oc_hide_test_run_mode_prompt';

// Debug mode is what the dialog explains and what a suppressed prompt falls
// back to, whichever button the user happened to dismiss it with: live mode
// silently skipping the paced playback for every future run is not something a
// "don't show this again" checkbox should be able to arrange. Switching to live
// stays a per-run decision — the logs header's Live toggle, mid-run.
export const DEFAULT_TEST_RUN_MODE: TestRunMode = 'debug';

export const isTestRunModePromptSuppressed = (): boolean => {
	try {
		return localStorage.getItem(SUPPRESS_KEY) === '1';
	} catch {
		return false;
	}
};

export const suppressTestRunModePrompt = (): void => {
	try {
		localStorage.setItem(SUPPRESS_KEY, '1');
	} catch {
		// ignore quota / disabled storage
	}
};
