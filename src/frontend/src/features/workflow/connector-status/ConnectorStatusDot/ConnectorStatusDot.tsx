import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type {
	ConnectorStatus,
	ConnectorStatusAppearance,
	ConnectorStatusDotProps,
} from './ConnectorStatusDot.types';

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
	tooltipPlacement = 'top',
}: ConnectorStatusDotProps) {
	const { t } = useI18n('workflow');
	const { color, tooltipKey } = statusToAppearance(status);
	const tooltipContent = tooltipOverride
		? t('sidebar.connectorStatus.failedWithReason', { reason: tooltipOverride })
		: t(`sidebar.connectorStatus.${tooltipKey}`);
	const dot = (
		<span
			className={className}
			data-testid={testId}
			style={{
				display: 'inline-block',
				width: size,
				height: size,
				minWidth: size,
				borderRadius: size,
				background: color,
				flexShrink: 0,
			}}
		/>
	);

	if (suppressTooltip) return dot;
	return <Tooltip content={tooltipContent} placement={tooltipPlacement}>{dot}</Tooltip>;
}
