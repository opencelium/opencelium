import { useMemo, useRef } from 'react';
import type { AuthUser } from '@entities/auth/model/types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { Connector } from '@entities/connector/model/types';
import type { Invoker } from '@entities/invoker/model/types';
import type { HistoryVersionItem } from '../types/history.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { applyProfileAuthor, buildWorkflowChangeSnapshot,
	toPayloadDescription } from '../utils/workflowPage.utils';
import { hydrateNodesWithOperationResponses,
	type HydrateCacheEntry } from '../utils/workflowNodeHydration';
import { useSimulatedHistoryVersions } from '../components/header/HistoryPanel/simulatedHistoryVersions';

type Params = {
	connectionId?: string;
	createdConnectionId?: string;
	title: string;
	description: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: any[];
	connectors: Connector[];
	invokers: Invoker[];
	historyVersions: HistoryVersionItem[];
	authUser: AuthUser | null;
};

export const useWorkflowViewData = ({ connectionId, createdConnectionId, title,
	description, nodes, edges, fieldBindings, connectors, invokers,
	historyVersions, authUser }: Params) => {
	const cacheRef = useRef<Map<string, HydrateCacheEntry>>(new Map());
	const hydratedNodes = useMemo(() => hydrateNodesWithOperationResponses(
		nodes, connectors, invokers, cacheRef.current,
	), [nodes, connectors, invokers]);
	const activeConnectionId = createdConnectionId ?? connectionId;
	const { lang } = useI18n('workflow');
	const simulatedHistoryVersions = useSimulatedHistoryVersions(lang);
	// A saved connection always shows its own versions; the tutorial's samples only
	// fill the panel where there is nothing real to list.
	const isSimulatedHistory = !activeConnectionId && simulatedHistoryVersions !== null;
	const realHistoryVersions = useMemo(
		() => applyProfileAuthor(historyVersions, authUser),
		[historyVersions, authUser],
	);
	const displayedHistoryVersions = isSimulatedHistory && simulatedHistoryVersions
		? simulatedHistoryVersions : realHistoryVersions;
	const currentSnapshot = useMemo(() => buildWorkflowChangeSnapshot({
		connectionId: activeConnectionId,
		title,
		description: toPayloadDescription(description),
		nodes: hydratedNodes,
		edges,
		fieldBindings,
	}), [activeConnectionId, title, description, hydratedNodes, edges, fieldBindings]);

	return { hydratedNodes, activeConnectionId, displayedHistoryVersions,
		isSimulatedHistory, currentSnapshot };
};
