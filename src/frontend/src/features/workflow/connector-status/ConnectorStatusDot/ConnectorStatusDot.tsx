import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { formatRelativeTime } from '@shared/utils/formatRelativeTime';
import type {
	ConnectorStatus,
	ConnectorStatusAppearance,
	ConnectorStatusDotProps,
} from './ConnectorStatusDot.types';

const PULSE_MS = 1000;

// lastTestError often carries a raw HTTP client exception message with a Spring error
// JSON body embedded in it, e.g. `404 : "{"timestamp":...,"status":404,"error":"Not
// Found","path":...}"` — not valid JSON on its own, so JSON.parse on the whole string
// fails. Extract the {...} substring first, then parse that, and surface just the
// human-readable `error` field when present.
const extractErrorReason = (rawError: string): string => {
	const jsonStart = rawError.indexOf('{');
	const jsonEnd = rawError.lastIndexOf('}');
	if (jsonStart === -1 || jsonEnd <= jsonStart) return rawError;

	try {
		const parsed: unknown = JSON.parse(rawError.slice(jsonStart, jsonEnd + 1));
		if (parsed && typeof parsed === 'object' && typeof (parsed as { error?: unknown }).error === 'string') {
			return (parsed as { error: string }).error;
		}
	} catch {
		// Not JSON — use the raw string as-is.
	}
	return rawError;
};

const statusToAppearance = (status: ConnectorStatus): ConnectorStatusAppearance => {
	switch (status) {
		case 'UP':
			return { color: 'var(--color-status-success-fg)', tooltipKey: 'up' };
		case 'AUTH_FAILED':
			return { color: 'var(--color-status-warning-fg)', tooltipKey: 'authFailed' };
		case 'DOWN':
			return { color: 'var(--color-status-error-fg)', tooltipKey: 'down' };
		case 'UNKNOWN':
			return { color: 'var(--color-text-disabled)', tooltipKey: 'unknown' };
		default: {
			const exhaustive: never = status;
			return exhaustive;
		}
	}
};

export function ConnectorStatusDot({
	status,
	size = 9,
	className,
	testId,
	tooltipOverride,
	suppressTooltip,
	lastCheckedAt,
	tooltipPlacement = 'top',
}: ConnectorStatusDotProps) {
	const { t, lang } = useI18n('workflow');
	const { color, tooltipKey } = statusToAppearance(status);
	const statusMessage = tooltipOverride
		? t('sidebar.connectorStatus.failedWithReason', { reason: extractErrorReason(tooltipOverride) })
		: t(`sidebar.connectorStatus.${tooltipKey}`);
	const tooltipContent = lastCheckedAt != null
		? t('sidebar.connectorStatus.checkedAt', { time: formatRelativeTime(lastCheckedAt, lang), message: statusMessage })
		: statusMessage;

	// Flash a pulse ring whenever the status actually changes (e.g. a live
	// /connector/status update) — not on first mount, and not on unrelated re-renders.
	const previousStatusRef = useRef(status);
	const [isChanged, setIsChanged] = useState(false);
	useEffect(() => {
		if (previousStatusRef.current === status) return;
		previousStatusRef.current = status;
		setIsChanged(true);
		const timeout = setTimeout(() => setIsChanged(false), PULSE_MS);
		return () => clearTimeout(timeout);
	}, [status]);

	const dotClassName = ['connectorStatusDot', isChanged && 'connectorStatusDot--changed', className]
		.filter(Boolean)
		.join(' ');
	const dot = (
		<span
			className={dotClassName}
			data-testid={testId}
			style={{
				display: 'inline-block',
				width: size,
				height: size,
				minWidth: size,
				borderRadius: size,
				background: color,
				color,
				flexShrink: 0,
			}}
		/>
	);

	if (suppressTooltip) return dot;
	return <Tooltip content={tooltipContent} placement={tooltipPlacement}>{dot}</Tooltip>;
}
