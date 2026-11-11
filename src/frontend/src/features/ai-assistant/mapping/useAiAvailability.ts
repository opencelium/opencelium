import { useEffect, useState } from 'react';
import { store as appStore } from '@app/store/store';
import { aiApi, isAiConfigured } from '../api/aiApi';
import type { AiFeatureId, AiHealth } from '../model/aiGateway.types';
import { isAiFeatureOn } from '../api/useIsAiFeatureOn';

/**
 * Whether the AI gateway can answer, for components mounted inside the method dialog's legacy store, where the RTK
 * Query hooks would bind to a store without the API middleware. Asked once per mount, against the app store.
 */
export function useAiAvailability(feature: AiFeatureId): boolean {
	const [isAvailable, setIsAvailable] = useState(false);
	useEffect(() => {
		if (!isAiConfigured()) return;
		let isCurrent = true;
		const request = appStore.dispatch(aiApi.endpoints.getAiHealth.initiate(undefined, { subscribe: false }));
		void request.unwrap()
			.then((health: AiHealth) => { if (isCurrent) setIsAvailable(health.ollama.reachable && health.workflowModel.available && isAiFeatureOn(health, feature)); })
			.catch(() => undefined);
		return () => { isCurrent = false; };
	}, [feature]);
	return isAvailable;
}
