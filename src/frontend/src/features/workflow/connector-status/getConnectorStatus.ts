import type { ConnectorStatus } from './ConnectorStatusDot/ConnectorStatusDot.types';

export function getConnectorStatus(lastTestPassed: boolean | null | undefined): ConnectorStatus | undefined {
  if (lastTestPassed === true) return 'passed';
  if (lastTestPassed === false) return 'failed';
  return undefined;
}
