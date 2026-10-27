import { create } from 'zustand';
import type { AiConnectorPair } from '@features/ai-assistant/utils/aiConnectors.utils';
import type { WorkflowTemplate } from '../types/workflowTemplate.types';

/** How a new workflow should start when it was asked for from outside the editor (the command palette, by voice). */
export type WorkflowIntent =
	| { source: 'empty'; title: string }
	| { source: 'template'; template: WorkflowTemplate }
	/** A template was asked for but none matched the name: the editor opens the template picker. */
	| { source: 'template-picker' }
	| { source: 'ai'; title: string; prompt: string; connectors: AiConnectorPair };

type WorkflowIntentState = {
	pending: WorkflowIntent | null;
	request: (intent: WorkflowIntent) => void;
	/** Hands the request to the editor once; later mounts start empty as usual. */
	take: () => WorkflowIntent | null;
};

// Not persisted: a request belongs to the navigation that made it, not to a reload.
export const useWorkflowIntentStore = create<WorkflowIntentState>((set, get) => ({
	pending: null,
	request: (intent) => set({ pending: intent }),
	take: () => {
		const { pending } = get();
		if (pending) set({ pending: null });
		return pending;
	},
}));
