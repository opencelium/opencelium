import { useContext } from 'react';
import { ConnectorStatusContext } from './ConnectorStatusContext';

export function useConnectorStatus() {
  return useContext(ConnectorStatusContext);
}
