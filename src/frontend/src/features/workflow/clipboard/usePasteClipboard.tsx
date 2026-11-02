import { useLayoutEffect, useRef, useState } from 'react';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowClipboard } from './workflowClipboard';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { Connector } from '@entities/connector/model/types';
import { findInvalidClipboardReferences, prepareClipboardPaste } from './clipboardGraph';
import { connectorsWithSameInvoker } from '../components/change-connector/connectorOptions';
import { PasteCheckContent, type ConnectorChoice } from './PasteCheckContent';
import { EMPTY_REMAP_PLAN, remapWorkflowReferences } from '../utils/graph.referenceRemap';
import { cleanInvalidWorkflowReferences } from '../utils/graph.invalidReferenceCleanup';

type Params = {
    nodes: WorkflowNodeModel[]; edges: WorkflowEdgeModel[]; fieldBindings: unknown[] | undefined;
    connectors: Connector[];
    disabled: boolean;
    onApply: (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[], bindings: unknown[]) => void;
};
export function usePasteClipboard({nodes, edges, fieldBindings, connectors, disabled, onApply}: Params) {
    const confirm = useConfirm();
    const {t} = useI18n('workflow');
    const [checking, setChecking] = useState(false);
    const busy = useRef(false);
    const current = useRef({nodes, edges, fieldBindings, disabled});
    useLayoutEffect(() => { current.current = {nodes, edges, fieldBindings, disabled}; }, [nodes, edges, fieldBindings, disabled]);
    const paste = async (snapshot: WorkflowClipboard, targetId: string, direction: 'right' | 'bottom') => {
        if (disabled || busy.current || !nodes.some((node) => node.id === targetId)) return false;
        busy.current = true; setChecking(true);
        try {
            const available = [...new Map(nodes.flatMap((node) => node.data.connector
                ? [[node.data.connector.connectorId, node.data.connector] as const] : [])).values()];
            const mapping = new Map<string, WorkflowNodeModel['data']['connector']>();
            const blocked: WorkflowNodeModel[] = [];
            const choices: ConnectorChoice[] = [];
            snapshot.nodes.filter((node) => node.type === 'connector').forEach((node) => {
                const invoker = node.data.connector?.invokerName ?? connectors.find((item) =>
                    item.connectorId === node.data.connector?.connectorId)?.invoker?.name;
                const options = connectorsWithSameInvoker(available.map((item) => ({...item,
                    invokerName: item.invokerName ?? connectors.find((connector) => connector.connectorId === item.connectorId)?.invoker?.name,
                })), invoker);
                if (options.length === 0) blocked.push(node);
                else {
                    mapping.set(node.id, options[0]);
                    if (options.length > 1) choices.push({node, options});
                }
            });
            const preview = prepareClipboardPaste(snapshot, nodes, edges, fieldBindings,
                {nodeId: targetId, direction}, mapping, new Set(blocked.map((node) => node.id)));
            if (!preview.nodes.some((node) => preview.insertedIds.has(node.id))) {
                await confirm({title: t('pasteCheck.title'), message: <PasteCheckContent
                    preview={preview} choices={[]} blocked={blocked} onConnector={() => {}} onRemap={() => {}} />,
                    confirmText: t('actions.confirm'), cancelText: t('actions.cancel'),
                    confirmTestId: 'workflow-paste-check-confirm', cancelTestId: 'workflow-paste-check-cancel'});
                return false;
            }
            let plan = EMPTY_REMAP_PLAN;
            if (blocked.length || choices.length || preview.invalidReferences.length) {
                const accepted = await confirm({title: t('pasteCheck.title'), width: 900,
                    message: <PasteCheckContent preview={preview} choices={choices} blocked={blocked}
                        onConnector={(id, connector) => mapping.set(id, connector)} onRemap={(next) => {plan = next;}} />,
                    confirmText: t(blocked.length ? 'pasteCheck.pasteRest' : 'pasteCheck.confirm'),
                    cancelText: t('actions.cancel'), confirmTestId: 'workflow-paste-check-confirm',
                    cancelTestId: 'workflow-paste-check-cancel'});
                if (!accepted) return false;
            }
            if (current.current.disabled || current.current.nodes !== nodes || current.current.edges !== edges ||
                current.current.fieldBindings !== fieldBindings) return false;
            const remapped = remapWorkflowReferences(preview.nodes, preview.fieldBindings, plan);
            const invalid = findInvalidClipboardReferences(remapped.nodes, preview.edges, preview.insertedIds, remapped.fieldBindings ?? []);
            const cleaned = cleanInvalidWorkflowReferences(remapped.nodes, invalid, remapped.fieldBindings);
            const originalByClone = new Map([...preview.idMap].map(([original, clone]) => [clone, original]));
            onApply(cleaned.nodes.map((node) => ({...node, data: {...node.data,
                connector: mapping.get(originalByClone.get(node.id) ?? '') ?? node.data.connector}})),
                preview.edges, cleaned.fieldBindings ?? []);
            return true;
        } finally { busy.current = false; setChecking(false); }
    };
    return {paste, checking};
}
