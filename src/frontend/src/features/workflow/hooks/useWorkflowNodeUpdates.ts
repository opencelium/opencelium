import type { Dispatch, SetStateAction } from 'react';
import type { ConditionConfig } from '../components/condition-builder/conditionBuilder.types';
import type { WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowMethodConfig } from '../types/request-config.types';

export const useWorkflowNodeUpdates = (
	setNodes: Dispatch<SetStateAction<WorkflowNodeModel[]>>,
	closeMethodEditor: () => void,
	closeConditionEditor: () => void,
	closeAggregatorEditor: () => void,
) => ({
	onChangeNodeLabel: (nodeId: string, label: string) => setNodes((nodes) =>
		nodes.map((node) => node.id === nodeId ? { ...node, data: {
			...node.data, subtitle: label, labelEdited: true,
			hasError: false, errorMessage: undefined,
		} } : node)),
	onSaveMethodConfig: (nodeId: string, methodConfig: WorkflowMethodConfig) => {
		setNodes((nodes) => nodes.map((node) => node.id === nodeId ? { ...node, data: {
			...node.data,
			methodConfig: { ...methodConfig,
				name: methodConfig.name ?? node.data.methodConfig?.name },
			hasError: false, errorMessage: undefined,
		} } : node));
		closeMethodEditor();
	},
	onSaveConditionConfig: (nodeId: string, conditionConfig: ConditionConfig) => {
		setNodes((nodes) => nodes.map((node) => node.id === nodeId ? { ...node, data: {
			...node.data, conditionConfig, hasError: false, errorMessage: undefined,
		} } : node));
		closeConditionEditor();
	},
	onSaveDataAggregator: (nodeId: string, dataAggregator: number | null) => {
		setNodes((nodes) => nodes.map((node) => node.id === nodeId ? { ...node, data: {
			...node.data, dataAggregator, hasError: false, errorMessage: undefined,
		} } : node));
		closeAggregatorEditor();
	},
	onChangeCommentText: (nodeId: string, text: string) => setNodes((nodes) =>
		nodes.map((node) => node.id === nodeId ? { ...node, data: {
			...node.data, comment: { ...node.data.comment, text },
		} } : node)),
	onSetNodeError: (nodeId: string, errorMessage: string) => setNodes((nodes) =>
		nodes.map((node) => node.id === nodeId ? { ...node, data: {
			...node.data, hasError: true, errorMessage,
		} } : node)),
	onClearNodeErrors: () => setNodes((nodes) => nodes.map((node) =>
		node.data.hasError ? { ...node, data: {
			...node.data, hasError: false, errorMessage: undefined,
		} } : node)),
});
