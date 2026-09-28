import type { Dispatch, SetStateAction } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { UseWorkflowPageOptions } from '../drag-drop/workflowPage.types';
import { deleteNodeGraph } from '../utils/graphUtils';
import { cleanBrokenWorkflowReferences } from '../utils/graph.brokenReferenceCleanup';
import { buildReferenceRemapTargets } from '../utils/graph.referenceRemapTargets';
import { isEmptyRemapPlan, remapWorkflowReferences } from '../utils/graph.referenceRemap';
import { workflowNodeLabel } from '../utils/workflowUndoMethodChange.utils';
import { notifyReferencesCleared } from '../components/feedback/notifyReferencesCleared';
import { useReferenceRemapConfirm } from './useReferenceRemapConfirm';

type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	options: UseWorkflowPageOptions;
	setNodes: Dispatch<SetStateAction<WorkflowNodeModel[]>>;
	setEdges: Dispatch<SetStateAction<WorkflowEdgeModel[]>>;
	onDeleted: () => void;
};

export const useDeleteWorkflowNodes = ({ nodes, edges, options, setNodes, setEdges,
	onDeleted }: Params) => {
	const { t } = useI18n('workflow');
	const askAboutReferences = useReferenceRemapConfirm();

	return async (nodeIds: string[]) => {
		const targetNodes = nodes.filter((node) => nodeIds.includes(node.id) && node.type !== 'start');
		if (targetNodes.length === 0) return;
		// An operator takes its scope with it, so a selected node inside a deleted
		// operator is already gone by the time its own turn comes.
		const result = targetNodes.reduce((graph, node) =>
			graph.nodes.some((item) => item.id === node.id)
				? deleteNodeGraph(node.id, graph.nodes, graph.edges)
				: graph, { nodes, edges });
		// What the deletion costs elsewhere, resolved before it is confirmed: every
		// reference to a deleted method, plus anything the smaller graph can no
		// longer reach — each one offered a method to be read from instead.
		const targets = buildReferenceRemapTargets({ nodes, edges }, result, options.fieldBindings);
		const { confirmed, plan } = await askAboutReferences(targets,
			{ before: { nodes, edges }, after: result }, targetNodes.length);
		if (!confirmed) return;
		// Re-pointed first, then cleaned: a reference the user gave a new provider
		// reads as satisfied by the time the cleanup pass looks at it.
		const remapped = remapWorkflowReferences(result.nodes, options.fieldBindings, plan);
		const cleanup = cleanBrokenWorkflowReferences(
			remapped.nodes, result.edges, remapped.fieldBindings, { nodes, edges });
		// Captured rather than left to the undo stack: that records on a 350ms quiet
		// period, so an undo pressed straight after the delete would land on
		// whatever came *before* it.
		const beforeDelete = { nodes, edges, fieldBindings: options.fieldBindings };
		setNodes(cleanup.nodes);
		setEdges(result.edges);
		if (!isEmptyRemapPlan(plan) && cleanup.brokenCount === 0) {
			options.onFieldBindingsChange?.(remapped.fieldBindings);
		}
		if (cleanup.brokenCount > 0) {
			options.onFieldBindingsChange?.(cleanup.fieldBindings);
			// A cleared reference leaves no mark on screen — the steps that read it
			// simply have one field fewer — so the confirm is repeated as a notice.
			const deletedName = targetNodes.length === 1 ? workflowNodeLabel(targetNodes[0]) : undefined;
			const descriptionKey = targetNodes.length > 1
				? 'confirmDelete.referencesClearedSeveral'
				: deletedName ? 'confirmDelete.referencesCleared' : 'confirmDelete.referencesClearedUnnamed';
			notifyReferencesCleared({
				title: t('confirmDelete.referencesClearedTitle'),
				description: t(descriptionKey,
					{ count: cleanup.affectedNodeIds.length, name: deletedName }),
				undoLabel: t('actions.undo'),
				onUndo: () => {
					setNodes(beforeDelete.nodes);
					setEdges(beforeDelete.edges);
					options.onFieldBindingsChange?.(beforeDelete.fieldBindings);
				},
			});
		}
		onDeleted();
	};
};
