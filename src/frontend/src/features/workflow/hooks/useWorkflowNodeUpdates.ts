import type { Dispatch, SetStateAction } from 'react';
import type { Connector } from '@entities/connector/model/types';
import type { ConditionConfig } from '../components/condition-builder/conditionBuilder.types';
import type { WorkflowNodeModel, WorkflowRunConflictPolicy, WorkflowSetGlobalConfig } from '../types/workflow.types';
import { withRunConflictPolicy } from '../utils/runConflictPolicy';
import type { WorkflowMethodConfig } from '../types/request-config.types';
import { assignConnectorToNode } from '../components/template/templateConnectorMapping.utils';

export const useWorkflowNodeUpdates = (
	setNodes: Dispatch<SetStateAction<WorkflowNodeModel[]>>,
	closeMethodEditor: () => void,
	closeConditionEditor: () => void,
	closeAggregatorEditor: () => void,
	closeConnectorEditor: () => void,
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
			// Mirrors the expression like connectionMapper.entries does on load,
			// unless the user gave the node its own label: without this, an edit
			// that moves the condition off a colour leaves that colour quoted in
			// data.subtitle, which collectNodeReferenceColors reads as a live
			// reference and flags as broken the moment that method is deleted.
			...(node.data.labelEdited ? {} : { subtitle: conditionConfig.expression }),
		} } : node));
		closeConditionEditor();
	},
	onSaveSetGlobal: (nodeId: string, setGlobal: WorkflowSetGlobalConfig) => {
		setNodes((nodes) => nodes.map((node) => node.id === nodeId ? { ...node, data: {
			...node.data, setGlobal, hasError: false, errorMessage: undefined,
		} } : node));
		closeConditionEditor();
	},
	onSetRunConflictPolicy: (policy: WorkflowRunConflictPolicy) => setNodes((nodes) => withRunConflictPolicy(nodes, policy)),
	onSaveDataAggregator: (nodeId: string, dataAggregator: number | null) => {
		setNodes((nodes) => nodes.map((node) => node.id === nodeId ? { ...node, data: {
			...node.data, dataAggregator, hasError: false, errorMessage: undefined,
			// A mapping names the outputs of one aggregator; another one has other outputs.
			...(node.data.dataAggregator !== dataAggregator ? { dataAggregatorPublish: undefined } : {}),
		} } : node));
		closeAggregatorEditor();
	},
	onSaveAggregatorPublish: (nodeId: string, dataAggregatorPublish: Record<string, string>) => {
		setNodes((nodes) => nodes.map((node) => node.id === nodeId ? { ...node, data: {
			...node.data, dataAggregatorPublish: Object.keys(dataAggregatorPublish).length ? dataAggregatorPublish : undefined,
		} } : node));
		closeAggregatorEditor();
	},
	onChangeNodeConnector: (nodeId: string, connector: Connector) => {
		setNodes((nodes) => nodes.map((node) => node.id === nodeId ? assignConnectorToNode(node, connector) : node));
		closeConnectorEditor();
	},
	onChangeCommentText: (nodeId: string, text: string) => setNodes((nodes) =>
		nodes.map((node) => node.id === nodeId ? { ...node, data: {
			...node.data, comment: { ...node.data.comment, text },
		} } : node)),
	/** Minimize/restore the note. The selection is cleared on the way out so a
	 * hidden note cannot be the target of the Delete shortcut. */
	onToggleComment: (commentNodeId: string) => setNodes((nodes) =>
		nodes.map((node) => node.id === commentNodeId && node.data.comment ? {
			...node,
			selected: false,
			data: { ...node.data, comment: { ...node.data.comment, collapsed: !node.data.comment.collapsed } },
		} : node)),
	onSetNodeError: (nodeId: string, errorMessage: string) => setNodes((nodes) =>
		nodes.map((node) => node.id === nodeId ? { ...node, data: {
			...node.data, hasError: true, errorMessage,
		} } : node)),
	onClearNodeErrors: () => setNodes((nodes) => nodes.map((node) =>
		node.data.hasError ? { ...node, data: {
			...node.data, hasError: false, errorMessage: undefined,
		} } : node)),
});
