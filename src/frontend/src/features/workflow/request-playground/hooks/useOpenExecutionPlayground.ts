import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '@features/auth/useAuth';
import { hasComponentPermission } from '@/engine/policy';
import { loadLoggedExecution, readExecutionPlaygroundSearch, registerEditorPlaygroundOpener, withoutExecutionPlaygroundSearch, type ExecutionPlaygroundLocation, type LoggedExecution } from '@features/logs';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notifyError } from '@shared/ui/feedback/notifyError';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { getConnectionById } from '../../api/connectionApi';
import { runWithoutUnsavedChangesGuard } from '../../hooks/unsavedChangesGuard';
import { findLoggedWorkflowMethod, readSavedMethodLocations } from '../model/findLoggedWorkflowMethod';

type Props = {
	connectionId: string | undefined;
	readOnly: boolean;
	isLoading: boolean;
	nodes: WorkflowNodeModel[];
	indexById: Map<string, string>;
	selectNode: (id: string) => void;
};

type OpenedDialog = { nodeId: string; execution: LoggedExecution };

export function useOpenExecutionPlayground({ connectionId, readOnly, isLoading, nodes, indexById, selectNode }: Props) {
	const route = useLocation();
	const navigate = useNavigate();
	const { t } = useI18n('workflow');
	const { normalizedUser } = useAuth();
	const canOpen = !readOnly && hasComponentPermission(normalizedUser?.permissions ?? [], 'CONNECTION', 'UPDATE');
	// `isLive`: a test run of the editor's current graph, which has no saved workflow to check against.
	const [request, setRequest] = useState<{ location: ExecutionPlaygroundLocation; isLive: boolean }>();
	const handledRequest = useRef<typeof request>(undefined);
	const [dialog, setDialog] = useState<{ nodeId: string; execution?: LoggedExecution } | null>(null);
	const requestId = useRef(0);
	const open = useCallback((nodeId: string | null) => {
		requestId.current += 1;
		setDialog(nodeId ? { nodeId } : null);
	}, []);
	const openFromLogs = useCallback((location: ExecutionPlaygroundLocation) => setRequest({ location, isLive: true }), []);
	const openRecorded = useCallback((location: ExecutionPlaygroundLocation) => setRequest({ location, isLive: false }), []);
	const savedConnectionId = Number(connectionId) || null;
	useEffect(() => {
		if (!canOpen || !savedConnectionId) return;
		return registerEditorPlaygroundOpener({ connectionId: savedConnectionId, open: openRecorded });
	}, [canOpen, savedConnectionId, openRecorded]);
	// A pending lookup belongs to the workflow it started on.
	useEffect(() => () => { requestId.current += 1; }, [connectionId]);

	// Resolves to the dialog to open, or null when there is none (stale, mismatched or failed).
	const resolve = useEffectEvent(async (location: ExecutionPlaygroundLocation, isLive: boolean): Promise<OpenedDialog | null> => {
		const id = ++requestId.current;
		try {
			const execution = await loadLoggedExecution(location, isLive ? null : savedConnectionId);
			if (execution?.hasTargetFlowchart && !isLive && connectionId && requestId.current === id) {
				const { data } = await getConnectionById(connectionId);
				execution.methodLocations = readSavedMethodLocations(data);
			}
			if (requestId.current !== id) return null;
			const node = execution && findLoggedWorkflowMethod(execution, nodes, indexById);
			if (!node || !execution) {
				message.warning(t('requestPlayground.execution.stepMismatch'));
				return null;
			}
			selectNode(node.id);
			return { nodeId: node.id, execution };
		} catch {
			if (requestId.current === id) notifyError(t('requestPlayground.execution.loadError'));
			return null;
		}
	});
	const show = useCallback((opened: OpenedDialog | null) => { if (opened) setDialog(opened); }, []);

	useEffect(() => {
		if (!canOpen || isLoading) return;
		const fromUrl = readExecutionPlaygroundSearch(new URLSearchParams(route.search));
		if (fromUrl) {
			// Read once: a reload or Back/Forward must not reopen the Playground. Only the
			// search changes, so there is nothing the unsaved-changes prompt would protect.
			runWithoutUnsavedChangesGuard(() => navigate(
				{ pathname: route.pathname, search: withoutExecutionPlaygroundSearch(route.search) }, { replace: true }));
			void resolve(fromUrl, false).then(show);
			return;
		}
		if (!request || handledRequest.current === request) return;
		handledRequest.current = request;
		void resolve(request.location, request.isLive).then(show);
	}, [canOpen, isLoading, request, route.pathname, route.search, navigate, show]);

	return { dialog, open, openFromLogs: canOpen ? openFromLogs : null };
}
