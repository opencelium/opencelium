import { useLayoutEffect, useRef, useState } from 'react';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { Connector } from '@entities/connector/model/types';
import type { WorkflowClipboard } from './workflowClipboard';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { findInvalidClipboardReferences, prepareClipboardPaste } from './clipboardGraph';
import { connectorsWithSameInvoker } from '../components/change-connector/connectorOptions';
import { PasteCheckContent, type ConnectorChoice } from './PasteCheckContent';
import { EMPTY_REMAP_PLAN, remapWorkflowReferences } from '../utils/graph.referenceRemap';
import { cleanInvalidWorkflowReferences } from '../utils/graph.invalidReferenceCleanup';

type WorkflowConnectorRef = WorkflowNodeModel['data']['connector'];
type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings: unknown[] | undefined;
	connectors: Connector[];
	disabled: boolean;
	onApply: (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[], bindings: unknown[]) => void;
};

const TEST_IDS = { confirmTestId: 'workflow-paste-check-confirm', cancelTestId: 'workflow-paste-check-cancel' };

const CONNECTOR_STEP_TYPES = new Set(['connector', 'system']);

// A copied step moves to a connector of the same system that the target
// workflow already uses (a choice if several). If the target uses none, the
// step keeps its own connector; it is blocked only once that one is deleted.
const planConnectors = (snapshot: WorkflowClipboard, nodes: WorkflowNodeModel[], connectors: Connector[]) => {
	const invokerOf = (connector: WorkflowConnectorRef) => connector?.invokerName ??
		connectors.find((item) => item.connectorId === connector?.connectorId)?.invoker?.name;
	const available = [...new Map(nodes.flatMap((node) => node.data.connector
		? [[node.data.connector.connectorId, node.data.connector] as const] : [])).values()]
		.map((connector) => ({ ...connector, invokerName: invokerOf(connector) }));
	const mapping = new Map<string, WorkflowConnectorRef>();
	const blocked: WorkflowNodeModel[] = [];
	const choices: ConnectorChoice[] = [];
	snapshot.nodes.filter((node) => CONNECTOR_STEP_TYPES.has(node.type) && node.data.connector).forEach((node) => {
		const options = connectorsWithSameInvoker(available, invokerOf(node.data.connector));
		if (options.length > 0) {
			mapping.set(node.id, options[0]);
			if (options.length > 1) choices.push({ node, options });
			return;
		}
		const isOwnConnectorPresent = connectors.some((item) => item.connectorId === node.data.connector?.connectorId);
		if (!isOwnConnectorPresent) blocked.push(node);
	});
	return { mapping, blocked, choices };
};

export function usePasteClipboard({ nodes, edges, fieldBindings, connectors, disabled, onApply }: Params) {
	const confirm = useConfirm();
	const { t } = useI18n('workflow');
	const [checking, setChecking] = useState(false);
	const busy = useRef(false);
	const current = useRef({ nodes, edges, fieldBindings, disabled });
	useLayoutEffect(() => { current.current = { nodes, edges, fieldBindings, disabled }; },
		[nodes, edges, fieldBindings, disabled]);

	const paste = async (snapshot: WorkflowClipboard, targetId: string, direction: 'right' | 'bottom') => {
		if (disabled || busy.current || !nodes.some((node) => node.id === targetId)) return false;
		busy.current = true;
		setChecking(true);
		try {
			const { mapping, blocked, choices } = planConnectors(snapshot, nodes, connectors);
			const preview = prepareClipboardPaste(snapshot, nodes, edges, fieldBindings,
				{ nodeId: targetId, direction }, mapping, new Set(blocked.map((node) => node.id)));
			if (!preview.nodes.some((node) => preview.insertedIds.has(node.id))) {
				await confirm({ title: t('pasteCheck.title'), isConfirmHidden: true, cancelText: t('actions.close'),
					message: <PasteCheckContent preview={preview} choices={[]} blocked={blocked}
						onConnector={() => {}} onRemap={() => {}} />, ...TEST_IDS });
				return false;
			}
			let plan = EMPTY_REMAP_PLAN;
			if (blocked.length || choices.length || preview.invalidReferences.length) {
				const accepted = await confirm({ title: t('pasteCheck.title'), width: 900,
					message: <PasteCheckContent preview={preview} choices={choices} blocked={blocked}
						onConnector={(id, connector) => mapping.set(id, connector)}
						onRemap={(next) => { plan = next; }} />,
					confirmText: t(blocked.length ? 'pasteCheck.pasteRest' : 'pasteCheck.confirm'),
					cancelText: t('actions.cancel'), ...TEST_IDS });
				if (!accepted) return false;
			}
			// The graph may have changed or been locked while the dialog was open.
			const latest = current.current;
			if (latest.disabled || latest.nodes !== nodes || latest.edges !== edges ||
				latest.fieldBindings !== fieldBindings) return false;
			const remapped = remapWorkflowReferences(preview.nodes, preview.fieldBindings, plan);
			const invalid = findInvalidClipboardReferences(remapped.nodes, preview.edges, preview.insertedIds,
				remapped.fieldBindings ?? []);
			const cleaned = cleanInvalidWorkflowReferences(remapped.nodes, invalid, remapped.fieldBindings);
			const originalByClone = new Map([...preview.idMap].map(([original, clone]) => [clone, original]));
			onApply(cleaned.nodes.map((node) => ({ ...node, data: { ...node.data,
				connector: mapping.get(originalByClone.get(node.id) ?? '') ?? node.data.connector } })),
			preview.edges, cleaned.fieldBindings ?? []);
			return true;
		} finally {
			busy.current = false;
			setChecking(false);
		}
	};
	return { paste, checking };
}
