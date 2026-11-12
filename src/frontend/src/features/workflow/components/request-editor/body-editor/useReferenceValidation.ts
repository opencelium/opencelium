import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { validateReference } from '../../../api/referenceValidationApi';
import { PayloadFormat, type MethodWithId } from '../../../types/connection';
import type { ReferenceValidationRequest, ReferenceValidationResult } from '../../../types/referenceValidation.types';
import { buildReferenceValue, getDeclaredBodySample, type ResponseType } from './requestReferenceOptions';
import { toReferencePathFeedback, type ReferencePathFeedback } from './referenceValidation.utils';

const DEBOUNCE_MS = 300;

type Params = {
	method: MethodWithId | undefined;
	type: ResponseType;
	path: string;
	/** Omit when the loops in scope are unknown: iterators are then not checked. */
	iterators?: string[];
	/** While the user is still typing a half-written path is always invalid, so nothing is checked. */
	isPaused: boolean;
};

// The first value is taken at once, so a dialog opening on a saved path checks it without a delay.
const useDebouncedValue = <T,>(value: T, delayMs: number) => {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(timer);
	}, [value, delayMs]);
	return debounced;
};

// XML bodies are read with XPath, which the endpoint does not check.
const isCheckable = (method: MethodWithId, type: ResponseType) => type === 'header'
	|| (type === 'body' && method.response?.success?.body?.format !== PayloadFormat.Xml);

const buildRequest = ({ method, type, path, iterators, isPaused }: Params): ReferenceValidationRequest | null => {
	const trimmedPath = path.trim();
	if (isPaused || !method || !trimmedPath || !isCheckable(method, type)) return null;
	return {
		reference: buildReferenceValue(method.color, type, trimmedPath),
		iterators: iterators ?? null,
		...(type === 'body' ? { sample: getDeclaredBodySample(method, trimmedPath, iterators ?? []) } : {}),
	};
};

/** Checks a picker's reference with the backend, the same parser the run uses. */
export function useReferenceValidation(params: Params): ReferencePathFeedback | null {
	const { t } = useI18n('workflow');
	// Keyed by value: hosts pass fresh arrays and method objects on every render.
	const requestKey = JSON.stringify(buildRequest(params));
	const settledKey = useDebouncedValue(requestKey, DEBOUNCE_MS);
	const [answer, setAnswer] = useState<{ key: string; result: ReferenceValidationResult | null } | null>(null);

	useEffect(() => {
		const request = JSON.parse(settledKey) as ReferenceValidationRequest | null;
		if (!request) return;
		let isCurrent = true;
		void validateReference(request).then((result) => {
			if (isCurrent) setAnswer({ key: settledKey, result });
		});
		return () => {
			isCurrent = false;
		};
	}, [settledKey]);

	return useMemo(() => {
		if (!answer?.result || answer.key !== requestKey) return null;
		return toReferencePathFeedback(answer.result, t);
	}, [answer, requestKey, t]);
}
