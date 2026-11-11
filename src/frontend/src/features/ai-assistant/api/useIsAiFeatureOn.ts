import type { AiFeatureId, AiHealth } from '../model/aiGateway.types';
import { isAiConfigured, useGetAiHealthQuery } from './aiApi';

/** False only when an admin switched the feature off on the AI settings page; reachability is checked separately. */
export const isAiFeatureOn = (health: AiHealth | undefined, feature: AiFeatureId): boolean =>
	!(health?.disabledFeatures ?? []).includes(feature);

export function useIsAiFeatureOn(feature: AiFeatureId): boolean {
	const isConfigured = isAiConfigured();
	const health = useGetAiHealthQuery(undefined, { skip: !isConfigured });
	return isAiFeatureOn(health.data, feature);
}
