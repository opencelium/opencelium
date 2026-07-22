import type { SuggestionOption } from '@shared/command/types';
import { workflowCommandBridgeStore } from './workflowCommandBridge';
import { matchNodesByMethodName, matchNodesByProperty } from './workflowSearch.utils';

const toSuggestions = (matches: ReturnType<typeof matchNodesByMethodName>): SuggestionOption[] =>
	matches.map((node) => ({ value: node.data.subtitle ?? node.data.title, label: node.data.subtitle ?? node.data.title }));

/** Live, per-keystroke search — the parser calls `resolve` on every parse
 * tick while an `entity` node is being typed into, so the match + highlight
 * side effect below runs continuously as the user types, no Enter needed. */
export const resolveMethodSearch = async (input?: unknown): Promise<SuggestionOption[]> => {
	const term = typeof input === 'string' ? input : '';
	const bridge = workflowCommandBridgeStore.getState();
	const matches = matchNodesByMethodName(bridge.getNodes(), term);
	bridge.setSearchHighlightedNodeIds(matches.map((node) => node.id));
	return toSuggestions(matches);
};

export const resolvePropertySearch = async (input?: unknown): Promise<SuggestionOption[]> => {
	const term = typeof input === 'string' ? input : '';
	const bridge = workflowCommandBridgeStore.getState();
	const matches = matchNodesByProperty(bridge.getNodes(), term);
	bridge.setSearchHighlightedNodeIds(matches.map((node) => node.id));
	return toSuggestions(matches);
};
