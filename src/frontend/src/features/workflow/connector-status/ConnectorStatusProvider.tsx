import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { store } from '@app/store/store';
import { connectorApi } from '@entities/connector/api/connectorApi';
import { useMasterPasswordStore } from '@features/master-password';
import {
  ConnectorStatusContext,
  type ConnectorStatus,
  type ConnectorStatusContextValue,
} from './ConnectorStatusContext';

/**
 * Caches the result of a live POST /connector/check per connector for the lifetime of the
 * workflow editor session, so the same connector is never re-checked once resolved (only
 * `locked` — no master password unlocked yet — is retried on a later call, since it isn't a
 * real result).
 */
export function ConnectorStatusProvider({ children }: { children: ReactNode }) {
  const [statusMap, setStatusMap] = useState<Map<number, ConnectorStatus>>(new Map());
  const checkedIds = useRef<Set<number>>(new Set());

  const applyStatus = useCallback((connectorId: number, status: ConnectorStatus) => {
    setStatusMap((prev) => {
      if (prev.get(connectorId) === status) return prev;
      const next = new Map(prev);
      next.set(connectorId, status);
      return next;
    });
  }, []);

  const runCheck = useCallback(async (connectorId: number, masterPassword: string) => {
    try {
      const connector = await store
        .dispatch(connectorApi.endpoints.getConnector.initiate({ id: String(connectorId), masterPassword }))
        .unwrap();
      const result = await store
        .dispatch(
          connectorApi.endpoints.checkConnector.initiate({
            connectorId: connector.connectorId,
            title: connector.title,
            description: connector.description,
            sslCert: connector.sslCert,
            timeout: connector.timeout,
            requestData: connector.requestData,
            invoker: { name: connector.invoker?.name },
          }),
        )
        .unwrap();
      applyStatus(connectorId, result?.status === '200' ? 'passed' : 'failed');
    } catch {
      applyStatus(connectorId, 'failed');
    }
  }, [applyStatus]);

  const checkConnectors = useCallback((connectorIds: number[]) => {
    const masterPassword = useMasterPasswordStore.getState().masterPassword;

    if (!masterPassword) {
      connectorIds
        .filter((connectorId) => !checkedIds.current.has(connectorId))
        .forEach((connectorId) => applyStatus(connectorId, 'locked'));
      return;
    }

    const idsToCheck = connectorIds.filter((connectorId) => !checkedIds.current.has(connectorId));
    if (idsToCheck.length === 0) return;
    idsToCheck.forEach((connectorId) => {
      checkedIds.current.add(connectorId);
      applyStatus(connectorId, 'checking');
      void runCheck(connectorId, masterPassword);
    });
  }, [applyStatus, runCheck]);

  const getStatus = useCallback(
    (connectorId: number) => statusMap.get(connectorId),
    [statusMap],
  );

  const value = useMemo<ConnectorStatusContextValue>(
    () => ({ getStatus, checkConnectors }),
    [getStatus, checkConnectors],
  );

  return (
    <ConnectorStatusContext.Provider value={value}>
      {children}
    </ConnectorStatusContext.Provider>
  );
}
