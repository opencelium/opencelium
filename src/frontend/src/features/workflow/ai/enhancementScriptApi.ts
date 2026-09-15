import { baseApi } from '@shared/api/baseApi';
import { aiUrl } from './aiEndpoint';
import type { EnhancementScriptRequest, EnhancementScriptResponse } from './enhancementScript.types';

/**
 * A mutation, unlike the mapping suggester: the same instruction asked twice is a request
 * for a second opinion, not a cache hit, so re-running must actually re-run.
 */
export const enhancementScriptApi = baseApi.injectEndpoints({
	endpoints: (b) => ({
		writeEnhancementScript: b.mutation<EnhancementScriptResponse, EnhancementScriptRequest>({
			query: (body) => ({ url: aiUrl('/ai/enhancement-script'), method: 'POST', body }),
		}),
	}),
});

export const { useWriteEnhancementScriptMutation } = enhancementScriptApi;
