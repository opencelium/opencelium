import { useEffect, useRef } from 'react';
import { create } from 'zustand';

export type StartTestOutcome = 'started' | 'running' | 'unavailable';

/**
 * What a spoken or typed request can ask the workflow editor to do besides editing the graph. Each is
 * the same action as a button on the page; the component owning that button registers it while it
 * can be used, so an unregistered action means "not possible right now".
 */
export type WorkflowAssistHandlers = {
	startTest: () => StartTestOutcome;
	/** False when no run is going. */
	stopTest: () => boolean;
	showLogs: () => void;
	showProblems: () => void;
	explainWorkflow: () => void;
	explainFailure: () => void;
	/** False when the failure is not a method call, so there is no request to change. */
	fixFailure: () => boolean;
	/** False when no fix is proposed, or a test run holds the editor. */
	applyFix: () => boolean;
};

export type WorkflowAssistAction = keyof WorkflowAssistHandlers;

type WorkflowAssistBridge = {
	handlers: Partial<WorkflowAssistHandlers>;
	register: <A extends WorkflowAssistAction>(action: A, handler: WorkflowAssistHandlers[A]) => () => void;
};

export const workflowAssistBridgeStore = create<WorkflowAssistBridge>((set, get) => ({
	handlers: {},
	register: (action, handler) => {
		set({ handlers: { ...get().handlers, [action]: handler } });
		// A newer registration is not removed by an older one's unmount.
		return () => {
			if (get().handlers[action] !== handler) return;
			const handlers = { ...get().handlers };
			delete handlers[action];
			set({ handlers });
		};
	},
}));

/** Registers `handler` for `action` while it is given; the latest one is always called. */
export function useWorkflowAssistAction<A extends WorkflowAssistAction>(action: A, handler: WorkflowAssistHandlers[A] | null) {
	const handlerRef = useRef(handler);
	useEffect(() => { handlerRef.current = handler; }, [handler]);
	const isAvailable = handler !== null;
	useEffect(() => {
		if (!isAvailable) return undefined;
		const callLatest = (() => handlerRef.current?.()) as WorkflowAssistHandlers[A];
		return workflowAssistBridgeStore.getState().register(action, callLatest);
	}, [action, isAvailable]);
}
