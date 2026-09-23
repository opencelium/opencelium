import { useMemo } from 'react';
import type { AiAvailability } from './aiAvailability.types';
import { useGetAiAvailabilityQuery } from './aiAvailabilityApi';

/**
 * Resolves the AI routes' state into the two capabilities the panels actually gate on.
 *
 * Both are false while the probe is in flight: a request fired at a route that turns out
 * not to exist is the 404 toast this hook was added to prevent.
 */
export function useAiAvailability() {
	const { data, isError, isLoading } = useGetAiAvailabilityQuery();

	const availability = useMemo<AiAvailability>(() => {
		if (isLoading) return { status: 'checking' };
		if (isError || !data) return { status: 'unreachable' };
		return data.available
			? { status: 'available', provider: data.provider }
			: { status: 'no-model' };
	}, [data, isError, isLoading]);

	return {
		availability,
		/** The route can answer from its local tiers even with no model behind it. */
		canSuggestMappings: availability.status === 'available' || availability.status === 'no-model',
		canWriteScript: availability.status === 'available',
		/**
		 * Settled on a negative answer — distinct from `!canWriteScript`, which is also true
		 * while the probe is in flight. Gate a *message* on this and a *control* on the
		 * capability: a warning that shows for one render and withdraws itself reads as a bug,
		 * whereas a button that is briefly inert does not.
		 */
		isUnavailable: availability.status === 'no-model' || availability.status === 'unreachable',
	};
}
