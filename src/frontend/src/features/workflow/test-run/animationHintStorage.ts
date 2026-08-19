const STORAGE_KEY = 'oc_hide_test_run_animation_hint';

// A one-way "don't show this again" for TestRunAnimationHint — once
// dismissed via its checkbox, the hint stays gone for this browser across
// every future test run, not just this page session.
export const isAnimationHintDismissed = (): boolean => {
	try {
		return localStorage.getItem(STORAGE_KEY) === '1';
	} catch {
		return false;
	}
};

export const dismissAnimationHint = (): void => {
	try {
		localStorage.setItem(STORAGE_KEY, '1');
	} catch {
		// ignore quota / disabled storage
	}
};
