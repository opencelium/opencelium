import type { ReactNode } from 'react';
import { GenericCreateWizard } from '@/engine/entity/runtime/genererics/GenericCreateWizard';
import { useWorkflowIntentStore } from '@features/workflow/intent/workflowIntent.store';
import type { ResolvedIntent } from './resolveIntent';

type RunContext = {
	navigate: (url: string) => void;
	openModal: (node: ReactNode) => void;
};

// An unmatched value stays out of the override, so the field keeps its own default (e.g. the invoker from the URL).
const definedOnly = (values: Record<string, unknown>) =>
	Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== ''));

/**
 * Opens the flow the user asked for, filled in: the create wizard for a schedule or connector, a new workflow for the
 * rest. Nothing is saved here; the user reviews and saves (or builds) as usual.
 */
export function runIntent(resolved: ResolvedIntent, { navigate, openModal }: RunContext) {
	switch (resolved.kind) {
		case 'schedule':
		case 'connector':
			openModal(<GenericCreateWizard entityName={resolved.kind} defaultValuesOverride={definedOnly(resolved.values)} />);
			return;
		case 'workflow':
			useWorkflowIntentStore.getState().request(resolved.intent);
			navigate('/workflow/create');
			return;
		default: {
			const _exhaustive: never = resolved;
			return _exhaustive;
		}
	}
}
