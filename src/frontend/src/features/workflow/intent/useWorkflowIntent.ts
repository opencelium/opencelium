import { useEffect, useEffectEvent } from 'react';
import type { AiConnectorPair } from '@features/ai-assistant/utils/aiConnectors.utils';
import type { WorkflowTemplate } from '../types/workflowTemplate.types';
import { useWorkflowIntentStore } from './workflowIntent.store';

type Options = {
	/** `/workflow/create`: a request only ever starts a new workflow. */
	isNewWorkflow: boolean;
	/** Connectors and invokers are loaded: a template's mapping and the AI panel need them. */
	isReady: boolean;
	onTitle: (title: string) => void;
	onTemplate: (template: WorkflowTemplate) => void;
	onPickTemplate: () => void;
	onAi: (request: { prompt: string; connectors: AiConnectorPair }) => void;
};

/** Carries out a "create workflow" request from the command palette once the new editor is ready. */
export function useWorkflowIntent({ isNewWorkflow, isReady, onTitle, onTemplate, onPickTemplate, onAi }: Options) {
	const carryOut = useEffectEvent(() => {
		const intent = useWorkflowIntentStore.getState().take();
		if (!intent) return;
		switch (intent.source) {
			case 'empty':
				if (intent.title) onTitle(intent.title);
				return;
			case 'template':
				// The template brings its own title; the user can rename it.
				onTemplate(intent.template);
				return;
			case 'template-picker':
				onPickTemplate();
				return;
			case 'ai':
				if (intent.title) onTitle(intent.title);
				onAi({ prompt: intent.prompt, connectors: intent.connectors });
				return;
			default: {
				const _exhaustive: never = intent;
				return _exhaustive;
			}
		}
	});

	useEffect(() => {
		if (!isNewWorkflow || !isReady) return;
		// A tick later: carrying out the request sets state in the editor's own hooks.
		const timer = setTimeout(carryOut, 0);
		return () => clearTimeout(timer);
	}, [isNewWorkflow, isReady]);
}
