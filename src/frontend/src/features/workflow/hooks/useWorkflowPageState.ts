import { useEffect, useLayoutEffect, useState } from 'react';
import { selectAuthUser } from '@entities/auth/model/authSelectors';
import { useGetConnectorsQuery } from '@entities/connector/api/connectorApi';
import { useGetInvokersQuery } from '@entities/invoker/api/invokerApi';
import { useAppSelector } from '@shared/lib/storeHooks';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useWorkflowPage } from './useWorkflowPage';
import { useWorkflowConnectionState } from './useWorkflowConnectionState';
import { useWorkflowViewData } from './useWorkflowViewData';
import { useWorkflowChangeTracking } from './useWorkflowChangeTracking';
import { useWorkflowDerivedData } from './useWorkflowDerivedData';
import { useSimulatedWorkflowGraph } from './simulatedWorkflowGraph';

type Params = {
	connectionId?: string;
	readOnly: boolean;
	leaveConfirmMessage: string;
};

export const useWorkflowPageState = ({ connectionId, readOnly,
	leaveConfirmMessage }: Params) => {
	const confirm = useConfirm();
	const { t } = useI18n('workflow');
	const authUser = useAppSelector(selectAuthUser);
	const { data: connectorData, isLoading: isConnectorsLoading, isFetching: isConnectorsFetching, isError: connectorsLoadFailed, refetch: refetchConnectors } =
		useGetConnectorsQuery({ page: 0, limit: 1000 }, { refetchOnMountOrArgChange: true });
	const { data: invokers = [] } = useGetInvokersQuery();
	const connectors = connectorData ?? [];
	const connection = useWorkflowConnectionState(connectionId, connectorData, connectorsLoadFailed, isConnectorsFetching);
	const workflow = useWorkflowPage({
		fieldBindings: connection.fieldBindings,
		onFieldBindingsChange: connection.setFieldBindings,
		confirmDependencyDrop: (invalidReferences) => confirm({
			title: t('confirmDependencyDrop.title'),
			message: t('confirmDependencyDrop.message',
				{ count: new Set(invalidReferences.map((ref) => ref.consumerNodeId)).size }),
			confirmText: t('actions.confirm'),
			cancelText: t('actions.cancel'),
			confirmVariant: 'danger',
		}),
	});
	const { applyConnectionRef, repairAppliedRef } = connection;
	const { setWorkflowGraph } = workflow;
	useLayoutEffect(() => {
		applyConnectionRef.current = (state) => setWorkflowGraph(
			state.nodes, state.edges, state.viewport, { centerStart: true },
		);
	}, [applyConnectionRef, setWorkflowGraph]);
	useSimulatedWorkflowGraph(!connectionId, (graph) => {
		workflow.setWorkflowGraph(graph.nodes, graph.edges, undefined, { centerStart: true });
		connection.setFieldBindings(graph.fieldBindings);
	});
	const view = useWorkflowViewData({ connectionId,
		createdConnectionId: connection.createdConnectionId,
		title: connection.headerState.title,
		description: connection.headerState.description,
		nodes: workflow.nodes,
		edges: workflow.edges,
		fieldBindings: connection.fieldBindings,
		connectors,
		invokers,
		historyVersions: connection.historyVersions,
		authUser,
	});
	// The connector list must be fresh before the first graph is shown (deleted-connector
	// detection), but later refetches — e.g. the sidebar mounting its own subscription
	// under the global refetchOnMountOrArgChange — must not blank the open editor.
	const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
	const isConnectorsBlocking = isConnectorsLoading || (isConnectorsFetching && !hasInitiallyLoaded);
	const isLoading = connection.isLoading || isConnectorsBlocking || connection.loadFailed;
	if (!isLoading && !hasInitiallyLoaded) setHasInitiallyLoaded(true);
	const retryLoad = () => {
		connection.retryLoad();
		void refetchConnectors();
	};
	const changes = useWorkflowChangeTracking({
		currentSnapshot: view.currentSnapshot,
		isLoading,
		readOnly,
		leaveConfirmMessage,
	});
	const { markDirty } = changes;
	useLayoutEffect(() => {
		repairAppliedRef.current = markDirty;
	}, [repairAppliedRef, markDirty]);
	const derived = useWorkflowDerivedData({
		nodes: view.hydratedNodes,
		edges: workflow.edges,
		fieldBindings: connection.fieldBindings,
		sidebarNodeId: workflow.sidebarAction?.sourceNodeId,
		contextMenuNodeId: workflow.contextMenu?.nodeId,
		editorNodeId: workflow.methodEditor?.nodeId,
		conditionNodeId: workflow.conditionEditor?.nodeId,
		aggregatorNodeId: workflow.aggregatorEditor?.nodeId,
	});

	const { setBaselineSnapshot, setChangeSource, setHistoryPreviewSnapshot } = changes;
	useEffect(() => {
		setBaselineSnapshot(null);
		setChangeSource('clean');
		setHistoryPreviewSnapshot(null);
	}, [connectionId, setBaselineSnapshot, setChangeSource, setHistoryPreviewSnapshot]);

	return { connection, workflow, connectors, invokers, view, changes, derived,
		isLoading, retryLoad };
};
