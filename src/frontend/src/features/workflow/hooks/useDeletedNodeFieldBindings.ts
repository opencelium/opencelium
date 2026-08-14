import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import { removeFieldBindingsByMethodColors } from '../utils/workflowPage.utils';

export const useDeletedNodeFieldBindings = (
	setFieldBindings: Dispatch<SetStateAction<any[] | undefined>>,
) => useCallback((deletedNodeIds: string[], previousNodes: WorkflowNodeModel[]) => {
	const deletedIds = new Set(deletedNodeIds);
	const methodColors = new Set(
		buildLegacyConnection(previousNodes).fromConnector.method
			.filter((method) => deletedIds.has(method.id))
			.map((method) => method.color.toLowerCase()),
	);
	previousNodes
		.filter((node) => deletedIds.has(node.id) && typeof node.data.color === 'string')
		.forEach((node) => methodColors.add(String(node.data.color).toLowerCase()));
	setFieldBindings((current) => removeFieldBindingsByMethodColors(current, methodColors));
}, [setFieldBindings]);
