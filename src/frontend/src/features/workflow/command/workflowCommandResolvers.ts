import type { SuggestionOption } from '@shared/command/types';
import { workflowCommandBridgeStore } from './workflowCommandBridge';
import { searchWorkflowNodes } from './workflowSearch.utils';

/** Live, per-keystroke fuzzy search — the parser calls `resolve` on every
 * parse tick while an `entity` node is being typed into, so the match +
 * highlight side effect below runs continuously as the user types, no Enter
 * needed. Matches method name/url/headers/query params/request+response
 * bodies and if/loop condition expressions. Results are ordered best-match-
 * first (see `searchWorkflowNodes`), so the viewport recenters on `matches[0]`
 * as the query narrows. */
export const resolveWorkflowSearch = async (input?: unknown): Promise<SuggestionOption[]> => {
	const term = typeof input === 'string' ? input : '';
	const bridge = workflowCommandBridgeStore.getState();
	const matches = searchWorkflowNodes(bridge.getNodes(), term);
	bridge.setSearchHighlightedNodeIds(matches.map((match) => match.node.id));
	if (matches.length > 0) bridge.centerOnNode(matches[0].node.id);
	return matches.map((match) => ({ value: match.label, label: match.label }));
};
