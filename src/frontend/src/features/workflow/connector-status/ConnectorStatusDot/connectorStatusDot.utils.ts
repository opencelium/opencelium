import type { ConnectorStatus, ConnectorStatusAppearance } from './ConnectorStatusDot.types';

export function extractConnectorErrorReason(rawError: string): string {
	const jsonStart = rawError.indexOf('{');
	const jsonEnd = rawError.lastIndexOf('}');
	if (jsonStart === -1 || jsonEnd <= jsonStart) return rawError;
	try {
		const parsed: unknown = JSON.parse(rawError.slice(jsonStart, jsonEnd + 1));
		if (parsed && typeof parsed === 'object'
			&& typeof (parsed as { error?: unknown }).error === 'string') {
			return (parsed as { error: string }).error;
		}
	} catch {
		// Preserve the raw backend message when the embedded value is not JSON.
	}
	return rawError;
}

export function getConnectorStatusAppearance(status: ConnectorStatus): ConnectorStatusAppearance {
	switch (status) {
		case 'UP': return { color: 'var(--color-status-success-fg)', tooltipKey: 'up' };
		case 'AUTH_FAILED':
			return { color: 'var(--color-status-warning-fg)', tooltipKey: 'authFailed' };
		case 'DOWN': return { color: 'var(--color-status-error-fg)', tooltipKey: 'down' };
		case 'UNKNOWN': return { color: 'var(--color-text-disabled)', tooltipKey: 'unknown' };
		default: {
			const exhaustive: never = status;
			return exhaustive;
		}
	}
}
