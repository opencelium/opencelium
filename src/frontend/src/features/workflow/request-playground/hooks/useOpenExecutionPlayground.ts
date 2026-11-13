import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '@features/auth/useAuth';
import { hasComponentPermission } from '@/engine/policy';
import { loadLoggedExecution, readExecutionPlaygroundSearch, type ExecutionPlaygroundLocation, type LoggedExecution } from '@features/logs';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { getConnectionById } from '../../api/connectionApi';
import { findLoggedWorkflowMethod, readSavedMethodLocations } from '../model/findLoggedWorkflowMethod';

type Props = {
	connectionId: string | undefined;
	readOnly: boolean;
	isLoading: boolean;
	nodes: WorkflowNodeModel[];
	indexById: Map<string, string>;
	selectNode: (id: string) => void;
};

export function useOpenExecutionPlayground({ connectionId, readOnly, isLoading, nodes, indexById, selectNode }: Props) {
	const route = useLocation();
	const { t } = useI18n('workflow');
	const { normalizedUser } = useAuth();
	const canOpen = !readOnly && hasComponentPermission(normalizedUser?.permissions ?? [], 'CONNECTION', 'UPDATE');
	const [request, setRequest] = useState<{ location: ExecutionPlaygroundLocation; routeKey: string }>();
	const [dialog, setDialog] = useState<{ nodeId: string; execution?: LoggedExecution } | null>(null);
	const requestId = useRef(0);
	const open = useCallback((nodeId: string | null) => {
		requestId.current += 1;
		setDialog(nodeId ? { nodeId } : null);
	}, []);
	const openFromLogs = useCallback((location: ExecutionPlaygroundLocation) => {
		setRequest({ location, routeKey: route.key });
	}, [route.key]);
	const resolve = useEffectEvent(async (location: ExecutionPlaygroundLocation, isLive: boolean) => {
		const id = ++requestId.current;
		setDialog(null);
		try {
			const execution = await loadLoggedExecution(location, isLive ? null : Number(connectionId) || null);
			if (execution?.hasTargetFlowchart && !isLive && connectionId && requestId.current === id) {
				const { data } = await getConnectionById(connectionId);
				execution.methodLocations = readSavedMethodLocations(data);
			}
			if (requestId.current !== id) return;
			const node = execution && findLoggedWorkflowMethod(execution, nodes, indexById);
			if (!node || !execution) {
				message.warning(t('requestPlayground.execution.stepMismatch'));
				return;
			}
			selectNode(node.id);
			setDialog({ nodeId: node.id, execution });
		} catch {
			if (requestId.current === id) message.error(t('requestPlayground.execution.loadError'));
		}
	});
	useEffect(() => {
		if (!canOpen || isLoading) return;
		const liveLocation = request?.routeKey === route.key ? request?.location : undefined;
		const location = liveLocation
			? liveLocation : readExecutionPlaygroundSearch(new URLSearchParams(route.search));
		if (!location) return;
		void resolve(location, !!liveLocation);
		return () => { requestId.current += 1; };
	}, [canOpen, connectionId, isLoading, request, route.key, route.search]);

	return { dialog, open, openFromLogs: canOpen ? openFromLogs : null };
}
