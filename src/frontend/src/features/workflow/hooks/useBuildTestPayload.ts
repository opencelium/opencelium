import { useCallback } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildConnectionPayload, buildFromConnectorPayload } from '../api/connectionPayload';
import { toPayloadDescription } from '../utils/workflowPage.utils';
import { notifyError } from '@shared/ui/feedback/notifyError';

type Params = {
	connectionId?: string;
	title: string;
	description: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: any[];
	getViewport: () => { x: number; y: number; zoom: number } | undefined;
	clearNodeErrors: () => void;
};

export const useBuildTestPayload = ({ connectionId, title, description, nodes,
	edges, fieldBindings, getViewport, clearNodeErrors }: Params) => {
	const { t } = useI18n('entities');
	return useCallback(() => {
		clearNodeErrors();
		const hasMethod = nodes.some((node) => node.type === 'connector' ||
			node.type === 'system' || node.type === 'trigger-connection');
		if (!hasMethod) {
			notifyError(t('connection.test.noMethods'));
			return null;
		}
		return {
			...buildConnectionPayload({ connectionId, title,
				description: toPayloadDescription(description), nodes, edges,
				viewport: getViewport(), fieldBindings }),
			fromConnector: buildFromConnectorPayload(nodes, edges),
			toConnector: null,
		};
	}, [connectionId, title, description, nodes, edges, fieldBindings,
		getViewport, clearNodeErrors, t]);
};
