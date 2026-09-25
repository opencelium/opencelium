import { useCallback } from 'react';
import { useDialog } from '@shared/ui/dialog/useDialog';
import { TestRunModeDialogContent } from '../components/TestRunModeDialog/TestRunModeDialogContent';
import { useTestRun } from './useTestRun';
import type { TestRunMode } from './testRunModePreference';
import { DEFAULT_TEST_RUN_MODE, isTestRunModePromptSuppressed, suppressTestRunModePrompt } from './testRunModePreference';

// Starting a test run is a two-mode decision (paced "debug" playback vs. the
// unpaced live stream), so the start button asks for the mode instead of
// silently reusing whatever the logs panel's Live toggle was left on. Once the
// user has dismissed the dialog every run starts in debug mode — see
// testRunModePreference.ts.
export function useTestRunStartPrompt() {
	const dialog = useDialog();
	const testRun = useTestRun();

	const startInMode = useCallback((mode: TestRunMode) => {
		if (!testRun) return;
		testRun.setLiveAnimation(mode === 'live');
		void testRun.startTest();
	}, [testRun]);

	return useCallback(() => {
		if (!testRun) return;
		if (isTestRunModePromptSuppressed()) {
			startInMode(DEFAULT_TEST_RUN_MODE);
			return;
		}
		const id = dialog.open({
			width: 560,
			top: 18,
			testId: 'workflow-test-run-mode-dialog',
			content: (
				<TestRunModeDialogContent
					onStart={(mode, suppressPrompt) => {
						if (suppressPrompt) suppressTestRunModePrompt();
						dialog.closeById(id);
						startInMode(mode);
					}}
				/>
			),
		});
	}, [dialog, startInMode, testRun]);
}
