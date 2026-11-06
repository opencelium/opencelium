import { useStartNodeState } from '../nodes/StartNode/useStartNodeState';
import { useWorkflowAssistAction } from '../command/workflowAssistBridge';

/**
 * Lets a request ("Beebot, test the workflow", "stop the test") start and stop the test run exactly as the
 * start node's button does, with the same checks. Mounted inside TestRunProvider, like TestRunEditLockSync.
 */
export function TestRunAssistBridge() {
	const start = useStartNodeState();

	useWorkflowAssistAction('startTest', () => {
		if (start.isRunning) return 'running';
		if (start.isBusy || start.isStartUnavailable) return 'unavailable';
		start.toggleTestRun();
		return 'started';
	});
	useWorkflowAssistAction('stopTest', () => {
		if (!start.isRunning || start.isBusy) return false;
		start.toggleTestRun();
		return true;
	});

	return null;
}
