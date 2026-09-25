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
	validateEnhancementScripts: (fieldBindings?: readonly unknown[]) => string | null;
};

export const useBuildTestPayload = ({ connectionId, title, description, nodes,
	edges, fieldBindings, getViewport, clearNodeErrors,
	validateEnhancementScripts }: Params) => {
	const { t } = useI18n('entities');
	return useCallback(() => {
		clearNodeErrors();
		const hasMethod = nodes.some((node) => node.type === 'connector' ||
			node.type === 'system' || node.type === 'trigger-connection');
		if (!hasMethod) {
			notifyError(t('connection.test.noMethods'));
			return null;
		}
		// A script naming a variable that no longer exists fails the same way here
		// as on save, only mid-run and with the reason buried in the execution log —
		// so the run is refused for it too, flagging the same nodes.
		const brokenScriptMessage = validateEnhancementScripts(fieldBindings);
		if (brokenScriptMessage) {
			notifyError(brokenScriptMessage);
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
		getViewport, clearNodeErrors, validateEnhancementScripts, t]);
};
