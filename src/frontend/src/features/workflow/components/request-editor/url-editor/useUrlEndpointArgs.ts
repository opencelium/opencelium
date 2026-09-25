import { useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { EndpointArg } from '../../../types/connection';
import { upsertEndpointArg } from '../../../store/connection/connectionSlice';
import { createId, normalizeReference } from './urlEditor.utils';

type Params = {
	methodId: string;
	initialArgs: Record<string, EndpointArg>;
	readOnly?: boolean;
};

export function useUrlEndpointArgs({ methodId, initialArgs, readOnly }: Params) {
	const dispatch = useDispatch();
	const [endpointArgs, setEndpointArgs] = useState<Record<string, EndpointArg>>(initialArgs);
	const endpointArgsRef = useRef<Record<string, EndpointArg>>(initialArgs);

	const resetEndpointArgs = useCallback((nextArgs: Record<string, EndpointArg>) => {
		endpointArgsRef.current = nextArgs;
		setEndpointArgs(nextArgs);
	}, []);

	const createArgToken = useCallback((sourceRaw: string, existingTokenIds: string[]) => {
		const source = normalizeReference(sourceRaw);
		const argId = createId();
		const token = `#{%${argId}%}`;
		const nextArgs = { ...endpointArgsRef.current, [argId]: { id: argId, source } };
		resetEndpointArgs(nextArgs);

		if (!readOnly) {
			const ids = existingTokenIds.length ? [...existingTokenIds, argId] : [argId];
			ids.forEach((id) => {
				const patch = nextArgs[id];
				if (patch) dispatch(upsertEndpointArg({ methodId, argId: id, patch } as any));
			});
		}
		return { token, tokenLabel: source, endpointArgsNext: nextArgs };
	}, [dispatch, methodId, readOnly, resetEndpointArgs]);

	return { endpointArgs, endpointArgsRef, resetEndpointArgs, createArgToken };
}
