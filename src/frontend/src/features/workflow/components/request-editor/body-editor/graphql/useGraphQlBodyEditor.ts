import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { Fetcher, FetcherParams } from '@graphiql/toolkit';
import { checkMasterPasswordExistsRaw, useMasterPasswordStore } from '@features/master-password';
import { apiExecutor } from '@shared/api/apiExecutor';
import type { Connector } from '@entities/connector/model/types';
import { useMethodContext } from '../../../../providers/MethodContext';
import { updatePayload } from '../../../../store/connection/connectionSlice';
import { resolveGraphQlAuthStrategy } from './strategies/resolveGraphQlAuthStrategy';
import type { GraphQlQueryResult } from './graphQlTypes';

export type GraphQlBodyEditorStatus = 'idle' | 'fetching-connector' | 'logging-in' | 'ready' | 'error';

const isAccessDenied = (result: GraphQlQueryResult | undefined) => {
  const causes = result?.errors?.[0]?.extensions?.causes;
  return !!causes?.length && causes[0].error === 'AccessDeniedException';
};

const isApiExecutorError = (response: unknown): boolean =>
  !!response && typeof response === 'object' && ('status' in response || 'error' in response);

// This hook runs inside the workflow editor's isolated legacy redux <Provider> (see
// MethodConfigDialog), which only mounts the `connection` reducer — not the real app's
// baseApi. RTK Query hooks (useGetConnectorMutation, etc.) bind to the nearest Provider via
// react-redux context, so they would silently dispatch against the wrong store here.
// apiExecutor dispatches against the real app store directly, sidestepping that entirely.
const fetchConnector = (id: string, masterPassword: string) =>
  apiExecutor({
    url: `/connector/${encodeURIComponent(id)}`,
    method: 'GET',
    options: {
      ...(masterPassword ? { headers: { 'x-master-password': masterPassword } } : {}),
      ignoreError: true,
    },
  }) as Promise<Connector | unknown>;

export function useGraphQlBodyEditor() {
  const { method } = useMethodContext();
  const dispatch = useDispatch();
  const { masterPassword } = useMasterPasswordStore();

  const [status, setStatus] = useState<GraphQlBodyEditorStatus>('idle');
  const [errorKey, setErrorKey] = useState<'connectorFailed' | 'loginFailed' | 'masterPasswordNotConfigured' | null>(null);
  const [connector, setConnector] = useState<Connector | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const hasRetriedRef = useRef(false);

  const connectorId = method.connector?.connectorId;
  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  const login = useCallback(async (target: Connector): Promise<string> => {
    setStatus('logging-in');
    const strategy = resolveGraphQlAuthStrategy(target);
    const result = await strategy.login(target);
    if (!result.ok) {
      setStatus('error');
      setErrorKey('loginFailed');
      return '';
    }
    setAccessToken(result.accessToken);
    setStatus('ready');
    return result.accessToken;
  }, []);

  useEffect(() => {
    // This hook only ever mounts as a child of <MasterPasswordGate>, which renders
    // children either once a password has been entered or once it has confirmed the
    // backend has no master password configured at all. A bare `!masterPassword` here
    // can therefore only mean the latter — re-verify locally (rather than assume) since
    // fetching the connector without it would return masked credentials the login/query
    // strategies can't actually use.
    if (connectorId == null) return;
    let cancelled = false;

    setStatus('fetching-connector');
    void (async () => {
      if (!masterPassword) {
        const exists = await checkMasterPasswordExistsRaw();
        if (cancelled) return;
        if (!exists) {
          setStatus('error');
          setErrorKey('masterPasswordNotConfigured');
          return;
        }
      }

      const response = await fetchConnector(String(connectorId), masterPassword);
      if (cancelled) return;
      if (isApiExecutorError(response)) {
        setStatus('error');
        setErrorKey('connectorFailed');
        return;
      }
      const fetchedConnector = response as Connector;
      setConnector(fetchedConnector);
      void login(fetchedConnector);
    })();

    return () => {
      cancelled = true;
    };
  }, [connectorId, login, masterPassword, retryCount]);

  const fetcher = useCallback<Fetcher>(
    async (graphQlParams: FetcherParams) => {
      if (!connector) return {};

      const runQuery = (token: string) =>
        resolveGraphQlAuthStrategy(connector).query({
          // `method.request.endpoint` is the workflow node's stored endpoint, which for a
          // GraphQL operation is the invoker's raw, unresolved template (e.g. literal "{url}") —
          // that placeholder is only substituted server-side at real execution time. A GraphQL
          // connector has a single endpoint anyway, so use the connector's own resolved url
          // (same source the login step already uses), matching the v4.8.3 reference behavior.
          url: connector.requestData?.url ?? '',
          accessToken: token,
          sslOn: connector.sslCert,
          query: graphQlParams.query,
          variables: graphQlParams.variables as Record<string, unknown> | undefined,
          operationName: graphQlParams.operationName,
        });

      const outcome = await runQuery(accessToken);
      if (!outcome.ok) return { errors: [{ message: 'Request failed' }] };

      if (isAccessDenied(outcome.result) && !hasRetriedRef.current) {
        hasRetriedRef.current = true;
        const freshToken = await login(connector);
        hasRetriedRef.current = false;
        if (!freshToken) return outcome.result as never;
        const retryOutcome = await runQuery(freshToken);
        return (retryOutcome.ok ? retryOutcome.result : { errors: [{ message: 'Request failed' }] }) as never;
      }

      return outcome.result as never;
    },
    [accessToken, connector, login],
  );

  const updateQuery = useCallback(
    (query: string) => {
      dispatch(updatePayload({ methodId: method.id, newFields: { query }, messageProperty: 'body' } as never));
    },
    [dispatch, method.id],
  );

  const initialQuery = (method.request.body?.fields as { query?: string } | undefined)?.query ?? '';

  return { status, errorKey, fetcher, updateQuery, initialQuery, retry };
}
