import { useEffect, useRef, useState } from 'react';
import type { HistoryVersionItem } from '../types/history.types';
import type { WorkflowConnectionState } from '../api/connectionMapper';
import { loadWorkflowConnection } from '../api/connectionService';
import { EMPTY_DESCRIPTION_LABEL, EMPTY_NAME_LABEL,
	toDisplayDescription } from '../utils/workflowPage.utils';

export const useWorkflowConnectionState = (connectionId?: string) => {
	const [createdConnectionId, setCreatedConnectionId] = useState<string>();
	const [headerState, setHeaderState] = useState({
		title: EMPTY_NAME_LABEL,
		description: EMPTY_DESCRIPTION_LABEL,
	});
	const [persistedTitle, setPersistedTitle] = useState('');
	const [fieldBindings, setFieldBindings] = useState<any[] | undefined>();
	const [historyVersions, setHistoryVersions] = useState<HistoryVersionItem[]>([]);
	const [selectedHistoryVersionId, setSelectedHistoryVersionId] = useState<string | null>(null);
	const [categoryId, setCategoryId] = useState<number | null>(null);
	const applyConnectionRef = useRef<((state: WorkflowConnectionState) => void) | null>(null);
	const [isLoading, setIsLoading] = useState(Boolean(connectionId));

	useEffect(() => {
		setCreatedConnectionId(undefined);
		setCategoryId(null);
		if (!connectionId) {
			setIsLoading(false);
			return;
		}
		let cancelled = false;
		setIsLoading(true);
		loadWorkflowConnection(connectionId).then((state) => {
			if (cancelled) return;
			applyConnectionRef.current?.(state);
			setHeaderState({ title: state.title,
				description: toDisplayDescription(state.description) });
			setPersistedTitle(state.title);
			setFieldBindings(state.fieldBindings);
			setCategoryId(state.categoryId);
			setHistoryVersions(state.versions);
			setSelectedHistoryVersionId((selectedId) =>
				selectedId && state.versions.some((version) => version.id === selectedId)
					? selectedId
					: state.versions.find((version) => version.current)?.id ??
						state.versions[0]?.id ?? null);
		}).finally(() => {
			if (!cancelled) setIsLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [connectionId]);

	return { createdConnectionId, setCreatedConnectionId, headerState, setHeaderState,
		persistedTitle, setPersistedTitle, fieldBindings, setFieldBindings,
		historyVersions, setHistoryVersions, selectedHistoryVersionId,
		setSelectedHistoryVersionId, categoryId, setCategoryId,
		applyConnectionRef, isLoading };
};
