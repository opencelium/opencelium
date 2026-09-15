import { baseApi } from '@shared/api/baseApi';
import { aiUrl } from './aiEndpoint';
import type {
	FieldBindingSuggestionRequest,
	FieldBindingSuggestionResponse,
} from './fieldBindingSuggestion.types';

/**
 * A query rather than a mutation despite the POST: the answer is a pure function of the
 * two schemas, so RTK Query's arg-keyed cache makes a re-opened dialog free. On the real
 * backend that also means a second look at the same method pair costs no model call.
 */
export const fieldBindingSuggestionApi = baseApi.injectEndpoints({
	endpoints: (b) => ({
		getFieldBindingSuggestions: b.query<FieldBindingSuggestionResponse, FieldBindingSuggestionRequest>({
			query: (body) => ({ url: aiUrl('/ai/field-binding-suggestions'), method: 'POST', body }),
		}),
	}),
});

export const { useLazyGetFieldBindingSuggestionsQuery } = fieldBindingSuggestionApi;
