import { useState } from 'react';
import { errorBus } from '@shared/errors/api/errorBus';
import { normalizeError } from '@shared/errors/api/normalizeError';
import { buildStaticValues, findInvalidJsonInputKeys, listStaticInputKeys } from '../model/methodTestRefs';
import type { ConnectorError, MethodCurlRequest } from '../model/playground.types';
import { useGetMethodCurlMutation } from '../model/playgroundApi';
import type { PlaygroundSession } from './usePlaygroundSession';
import type { PlaygroundValues } from './usePlaygroundValues';

type Args = {
	session: PlaygroundSession;
	values: PlaygroundValues;
};

export type PlaygroundCurlState =
	| { kind: 'idle' }
	| { kind: 'ready'; command: string; requestKey: string }
	| { kind: 'connectorErrors'; errors: ConnectorError[]; requestKey: string }
	| { kind: 'failed'; message: string | null; requestKey: string };

// The command comes from the backend, built exactly as /method/test would send the
// request. Each call runs connector authentication (a real token request), so it is
// generated when the panel opens and on demand — never per keystroke.
export function usePlaygroundCurl({ session, values }: Args) {
	const [trigger, { isLoading }] = useGetMethodCurlMutation();
	const [state, setState] = useState<PlaygroundCurlState>({ kind: 'idle' });
	const { draft, refs } = session;

	const buildRequest = (): MethodCurlRequest | null => refs.refs ? {
		method: draft,
		staticValues: buildStaticValues({ refs: refs.refs, values: values.values, connectorOverrides: values.requestData }),
	} : null;
	const request = buildRequest();
	const requestKey = request ? JSON.stringify(request) : null;

	const invalidCount = refs.refs ? findInvalidJsonInputKeys(listStaticInputKeys(refs.refs), values.values).length : 0;
	const canGenerate = !!request && !refs.isLoading && invalidCount === 0;

	const generate = async () => {
		if (!canGenerate || !request || !requestKey) return;
		const response = await trigger(request);
		if ('data' in response && response.data) {
			const { curl, connectorErrors } = response.data;
			setState(curl
				? { kind: 'ready', command: curl, requestKey }
				: { kind: 'connectorErrors', errors: connectorErrors, requestKey });
			return;
		}
		const appError = normalizeError(response.error);
		if (appError.type === 'UNAUTHORIZED' || appError.type === 'FORBIDDEN') {
			errorBus.emit(appError);
			setState({ kind: 'idle' });
			return;
		}
		setState({ kind: 'failed', message: appError.serverMessage ?? null, requestKey });
		refs.refetch();
	};


	return {
		state,
		invalidCount,
		isGenerating: isLoading,
		canGenerate,
		// The request changed since the command was generated.
		isOutdated: 'requestKey' in state && state.requestKey !== requestKey,
		generate: () => void generate(),
		// Opening the panel generates the first command; later ones are on demand.
		generateIfIdle: () => { if (state.kind === 'idle') void generate(); },
	};
}

export type PlaygroundCurlModel = ReturnType<typeof usePlaygroundCurl>;
