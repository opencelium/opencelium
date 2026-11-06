import { useStartNodeState } from '../nodes/StartNode/useStartNodeState';
import { useWorkflowAssistAction } from '../command/workflowAssistBridge';

/**
 * Lets a request ("Beebot, test the workflow", "run a live test", "stop the test") start and stop the test run as
 * the start node's button does, with the same checks. Mounted inside TestRunProvider, like TestRunEditLockSync.
 */
export function TestRunAssistBridge() {
	const start = useStartNodeState();

	useWorkflowAssistAction('startTest', (mode) => {
		if (start.isRunning) return 'running';
		if (start.isBusy || start.isStartUnavailable || !start.testRun) return 'unavailable';
		// A mode said in the request answers the question the start button would ask.
		if (mode) {
			start.testRun.setLiveAnimation(mode === 'live');
			void start.testRun.startTest();
		} else {
			start.toggleTestRun();
		}
		return 'started';
	});
	useWorkflowAssistAction('stopTest', () => {
		if (!start.isRunning || start.isBusy) return false;
		start.toggleTestRun();
		return true;
	});

	return null;
}
