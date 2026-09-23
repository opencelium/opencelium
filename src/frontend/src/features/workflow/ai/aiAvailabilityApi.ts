import { baseApi } from '@shared/api/baseApi';
import { aiUrl } from './aiEndpoint';
import type { AiAvailabilityResponse } from './aiAvailability.types';

/**
 * A query with a `void` arg, so every panel in every dialog shares one cache entry and the
 * probe is made once per session rather than once per opened method.
 */
export const aiAvailabilityApi = baseApi.injectEndpoints({
	endpoints: (b) => ({
		getAiAvailability: b.query<AiAvailabilityResponse, void>({
			// ignoreError: a 404 here is the answer, not a failure — it means this backend
			// serves no AI routes. Letting it reach errorBus would put a "resource not found"
			// toast in front of the user every time a body editor is opened.
			query: () => ({
				url: aiUrl('/ai/availability'),
				method: 'GET',
				customOptions: { ignoreError: true },
			}),
		}),
	}),
});

export const { useGetAiAvailabilityQuery } = aiAvailabilityApi;
