import { createContext } from 'react';

// null-tested state is intentionally absent: a connector with no status is simply
// missing from the map (getStatus returns undefined) until checkConnectors is called.
export type ConnectorStatus = 'checking' | 'passed' | 'failed' | 'locked';

export type ConnectorStatusContextValue = {
  getStatus: (connectorId: number) => ConnectorStatus | undefined;
  checkConnectors: (connectorIds: number[]) => void;
};

export const ConnectorStatusContext = createContext<ConnectorStatusContextValue>({
  getStatus: () => undefined,
  checkConnectors: () => {},
});
