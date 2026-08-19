import { useCallback, useEffect, useState } from 'react';
import { checkMasterPasswordExistsRaw, useMasterPasswordStore } from '@features/master-password';
import type { Connector } from '@entities/connector/model/types';
import { resolveGraphQlAuthStrategy } from './strategies/resolveGraphQlAuthStrategy';
import type { GraphQlBodyEditorError,
	GraphQlBodyEditorStatus } from './graphQlBodyEditor.types';
import { fetchGraphQlConnector, isApiExecutorError } from './graphQlBodyEditor.utils';

export function useGraphQlConnectorAuth(connectorId?: number | string) {
	const { masterPassword } = useMasterPasswordStore();
	const [status, setStatus] = useState<GraphQlBodyEditorStatus>('idle');
	const [errorKey, setErrorKey] = useState<GraphQlBodyEditorError>(null);
	const [connector, setConnector] = useState<Connector | null>(null);
	const [accessToken, setAccessToken] = useState('');
	const [retryCount, setRetryCount] = useState(0);
	const retry = useCallback(() => setRetryCount((count) => count + 1), []);
	const login = useCallback(async (target: Connector) => {
		setStatus('logging-in');
		const result = await resolveGraphQlAuthStrategy(target).login(target);
		if (!result.ok) {
			setStatus('error'); setErrorKey('loginFailed'); return '';
		}
		setAccessToken(result.accessToken); setStatus('ready');
		return result.accessToken;
	}, []);

	useEffect(() => {
		if (connectorId == null) return;
		let cancelled = false;
		setStatus('fetching-connector');
		void (async () => {
			if (!masterPassword) {
				const exists = await checkMasterPasswordExistsRaw();
				if (cancelled) return;
				if (!exists) {
					setStatus('error'); setErrorKey('masterPasswordNotConfigured'); return;
				}
			}
			const response = await fetchGraphQlConnector(String(connectorId), masterPassword);
			if (cancelled) return;
			if (isApiExecutorError(response)) {
				setStatus('error'); setErrorKey('connectorFailed'); return;
			}
			const nextConnector = response as Connector;
			setConnector(nextConnector);
			void login(nextConnector);
		})();
		return () => { cancelled = true; };
	}, [connectorId, login, masterPassword, retryCount]);

	return { status, errorKey, connector, accessToken, login, retry };
}
