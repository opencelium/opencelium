import type { Dispatch, SetStateAction } from 'react';
import type { Connector } from '@entities/connector/model/types';
import type { Invoker } from '@entities/invoker/model/types';
import type { HistoryVersionItem } from '../types/history.types';
import type { WorkflowChangeSource } from './useWorkflowChangeTracking';
import {
	loadConnectionVersions,
	loadWorkflowConnectionVersion,
	removeConnectionVersion,
	saveConnectionVersionComment,
} from '../api/connectionService';
import { hydrateNodesWithOperationResponses } from '../utils/workflowNodeHydration';
import { buildWorkflowChangeSnapshot, toDisplayDescription,
	toPayloadDescription } from '../utils/workflowPage.utils';

type Params = {
	connectionId?: string;
	baselineSnapshot: string | null;
	connectors: Connector[];
	invokers: Invoker[];
	setHistoryVersions: Dispatch<SetStateAction<HistoryVersionItem[]>>;
	setSelectedId: Dispatch<SetStateAction<string | null>>;
	setHeaderState: Dispatch<SetStateAction<{ title: string; description: string }>>;
	setFieldBindings: (bindings: any[] | undefined) => void;
	setHistoryPreviewSnapshot: (snapshot: string | null) => void;
	setChangeSource: (source: WorkflowChangeSource) => void;
	applyGraph: (state: Awaited<ReturnType<typeof loadWorkflowConnectionVersion>>) => void;
	closeEditors: () => void;
};

const selectAvailableVersion = (versions: HistoryVersionItem[], selectedId: string | null) =>
	selectedId && versions.some((version) => version.id === selectedId)
		? selectedId
		: versions.find((version) => version.current)?.id ?? versions[0]?.id ?? null;

export const useWorkflowHistoryActions = ({ connectionId, baselineSnapshot,
	connectors, invokers, setHistoryVersions, setSelectedId, setHeaderState,
	setFieldBindings, setHistoryPreviewSnapshot, setChangeSource, applyGraph,
	closeEditors }: Params) => {
	const refreshVersions = async () => {
		if (!connectionId) return [];
		const versions = await loadConnectionVersions(connectionId);
		setHistoryVersions(versions);
		setSelectedId((selectedId) => selectAvailableVersion(versions, selectedId));
		return versions;
	};

	const selectVersion = async (snapshotId: string) => {
		if (!connectionId) return;
		setSelectedId(snapshotId);
		const state = await loadWorkflowConnectionVersion(connectionId, snapshotId);
		const nodes = hydrateNodesWithOperationResponses(state.nodes, connectors, invokers);
		const snapshot = buildWorkflowChangeSnapshot({
			connectionId,
			title: state.title,
			description: toPayloadDescription(state.description),
			nodes,
			edges: state.edges,
			fieldBindings: state.fieldBindings,
		});
		applyGraph(state);
		setHeaderState({ title: state.title,
			description: toDisplayDescription(state.description) });
		setFieldBindings(state.fieldBindings);
		setHistoryPreviewSnapshot(snapshot);
		setChangeSource(snapshot === baselineSnapshot ? 'clean' : 'history');
		closeEditors();
	};

	const saveComment = async (snapshotId: string, comment: string) => {
		if (!connectionId) return;
		await saveConnectionVersionComment(connectionId, snapshotId, comment);
		await refreshVersions();
	};

	const deleteVersion = async (snapshotId: string) => {
		if (!connectionId) return;
		await removeConnectionVersion(connectionId, snapshotId);
		await refreshVersions();
	};

	return { refreshVersions, selectVersion, saveComment, deleteVersion };
};
