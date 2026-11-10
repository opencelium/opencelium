import { useState } from 'react';
import { usePendingMappingStore } from '@features/ai-assistant/mapping/pendingMapping.store';

const AI_MAPPING_KEY = 'aiMapping';

/**
 * The open sections of the body editor. A mapping requested for this method ("suggest AI mapping", also while the
 * dialog is already open) opens the AI mapping section: its suggestions show there, and it only runs once mounted.
 */
export function useAiMappingSectionKeys(methodId: string) {
	const requestedAt = usePendingMappingStore((store) => (store.pending?.methodId === methodId ? store.pending.requestedAt : null));
	const [activeKeys, setActiveKeys] = useState(() => (requestedAt === null ? ['requestData'] : ['requestData', AI_MAPPING_KEY]));
	const [seenRequest, setSeenRequest] = useState(requestedAt);
	if (requestedAt !== seenRequest) {
		setSeenRequest(requestedAt);
		if (requestedAt !== null && !activeKeys.includes(AI_MAPPING_KEY)) setActiveKeys([...activeKeys, AI_MAPPING_KEY]);
	}
	return { activeKeys, setActiveKeys };
}
