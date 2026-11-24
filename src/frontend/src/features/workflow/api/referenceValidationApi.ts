import { apiExecutor } from '@shared/api/apiExecutor';
import type { ReferenceValidationRequest, ReferenceValidationResult } from '../types/referenceValidation.types';

const CACHE_LIMIT = 200;
const cache = new Map<string, Promise<ReferenceValidationResult | null>>();

const isValidationResult = (value: unknown): value is ReferenceValidationResult =>
	!!value && typeof value === 'object' && 'reference' in value
	&& Array.isArray((value as ReferenceValidationResult).errors)
	&& Array.isArray((value as ReferenceValidationResult).warnings);

const request = async (body: ReferenceValidationRequest): Promise<ReferenceValidationResult | null> => {
	const response: unknown = await apiExecutor({ url: '/connection/reference/validate', method: 'POST', body,
		options: { ignoreError: true, skipEntityInvalidation: true } });
	return isValidationResult(response) ? response : null;
};

/**
 * Not an RTK Query hook: the pickers also render inside MethodConfigDialog's
 * nested legacy Redux store, which has no `api` slice. apiExecutor dispatches
 * against the app store directly. A failed check resolves to null (no feedback,
 * no toast) and is not cached, so the next edit retries.
 */
export const validateReference = (body: ReferenceValidationRequest): Promise<ReferenceValidationResult | null> => {
	const key = JSON.stringify(body);
	const cached = cache.get(key);
	if (cached) return cached;
	const pending = request(body).then((result) => {
		if (!result) cache.delete(key);
		return result;
	});
	if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
	cache.set(key, pending);
	return pending;
};
