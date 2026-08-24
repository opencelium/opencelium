import { useEffect } from 'react';
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
	const { data: connectors = [], isLoading: isConnectorsLoading } =
		useGetConnectorsQuery({ page: 0, limit: 1000 });
	const { data: invokers = [] } = useGetInvokersQuery();
	const connection = useWorkflowConnectionState(connectionId);
	const workflow = useWorkflowPage({
		fieldBindings: connection.fieldBindings,
		onFieldBindingsChange: connection.setFieldBindings,
		confirmDependencyDrop: (invalidReferences) => confirm({
			title: t('confirmDependencyDrop.title'),
			message: t('confirmDependencyDrop.message', { count: invalidReferences.length }),
			confirmText: t('actions.confirm'),
			cancelText: t('actions.cancel'),
			confirmVariant: 'danger',
		}),
	});
	connection.applyConnectionRef.current = (state) => workflow.setWorkflowGraph(
		state.nodes, state.edges, state.viewport, { centerStart: true },
	);
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
	const isLoading = connection.isLoading || isConnectorsLoading;
	const changes = useWorkflowChangeTracking({
		currentSnapshot: view.currentSnapshot,
		isLoading,
		readOnly,
		leaveConfirmMessage,
	});
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

	useEffect(() => {
		changes.setBaselineSnapshot(null);
		changes.setChangeSource('clean');
		changes.setHistoryPreviewSnapshot(null);
	}, [connectionId]);

	return { connection, workflow, connectors, invokers, view, changes, derived,
		isLoading };
};
