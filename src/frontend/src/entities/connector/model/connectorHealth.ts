import type { ConnectorHealthStatus } from './types'

/**
 * The connector could not be reached or was refused — the two states where the
 * backend's `lastTestError` is worth surfacing and where the fix is to edit the
 * connector (usually its credentials). 'UNKNOWN' is not one: it means no health
 * check has run yet, not that anything is wrong.
 */
export const isConnectorConnectionError = (status?: ConnectorHealthStatus | null): boolean =>
    status === 'AUTH_FAILED' || status === 'DOWN'
