import { useState } from 'react';
import type { ConditionGroup } from '@features/workflow/components/condition-builder/conditionBuilder.types';
import type { Connection, MethodWithId } from '@features/workflow/types/connection';
import { store as appStore } from '@app/store/store';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { aiApi } from '../api/aiApi';
import type { ConditionSuggestion } from '../model/aiGateway.types';
import { collectConditionSources } from '../mapping/mappingCandidates';
import { loopSuggestionToTree, suggestionToTree } from './conditionSuggestion.utils';
import { collectLoopSources } from './loopSources';

export type AiConditionState =
	| { status: 'idle' }
	| { status: 'building' }
	| { status: 'built'; explanation: string }
	| { status: 'nothingToCompare' }
	| { status: 'error' };

type Params = {
	/** An if's rules, or what a loop repeats over. */
	operatorType: 'if' | 'loop';
	connection: Connection;
	/** The steps the dialog lets this condition read. */
	methods: MethodWithId[];
	operatorIndex: string;
	onApply: (tree: ConditionGroup) => void;
};

/**
 * "Describe the condition" for an if step, or what a loop repeats over: the sentence becomes the dialog's rules, which
 * the user then checks and saves.
 * The request goes to the app store explicitly: the condition dialog also opens inside other dialogs, and must not depend
 * on which Redux store happens to surround it.
 */
export function useAiCondition({ operatorType, connection, methods, operatorIndex, onApply }: Params) {
	const { lang } = useI18n('workflow');
	const [instruction, setInstruction] = useState('');
	const [state, setState] = useState<AiConditionState>({ status: 'idle' });

	const language = lang.startsWith('de') ? 'de' : 'en';

	const buildLoop = async (text: string) => {
		const sources = collectLoopSources(connection, methods, operatorIndex);
		if (sources.length === 0) {
			setState({ status: 'nothingToCompare' });
			return;
		}
		setState({ status: 'building' });
		try {
			const suggestion = await appStore.dispatch(aiApi.endpoints.suggestLoop.initiate({
				language, instruction: text, sources: sources.map(({ id, step, system, path, kind }) => ({ id, step, system, path, kind })),
			})).unwrap();
			const tree = loopSuggestionToTree(suggestion, sources);
			if (!tree) throw new Error('The suggestion names a value that was not offered');
			onApply(tree);
			setState({ status: 'built', explanation: suggestion.explanation });
		} catch {
			setState({ status: 'error' });
		}
	};

	const build = async (text = instruction) => {
		if (!text.trim()) return;
		if (operatorType === 'loop') return buildLoop(text.trim());
		const sources = collectConditionSources(connection, methods, operatorIndex);
		if (sources.length === 0) {
			setState({ status: 'nothingToCompare' });
			return;
		}
		setState({ status: 'building' });
		try {
			const suggestion: ConditionSuggestion = await appStore.dispatch(aiApi.endpoints.suggestCondition.initiate({
				language, instruction: text.trim(),
				sources: sources.map(({ id, step, system, path }) => ({ id, step, system, path })),
			})).unwrap();
			const tree = suggestionToTree(suggestion, sources);
			if (!tree) throw new Error('The suggestion names a value that was not offered');
			onApply(tree);
			setState({ status: 'built', explanation: suggestion.explanation });
		} catch {
			setState({ status: 'error' });
		}
	};

	/** Fills in a sentence asked for elsewhere and builds it at once. */
	const buildFrom = (text: string) => {
		setInstruction(text);
		void build(text);
	};

	return { instruction, setInstruction, state, build, buildFrom };
}
