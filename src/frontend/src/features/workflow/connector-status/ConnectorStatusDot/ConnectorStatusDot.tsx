import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { formatRelativeTime } from '@shared/utils/formatRelativeTime';
import type { ConnectorStatusDotProps } from './ConnectorStatusDot.types';
import { extractConnectorErrorReason, getConnectorStatusAppearance } from './connectorStatusDot.utils';
import { useConnectorStatusPulse } from './useConnectorStatusPulse';

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
	const { color, tooltipKey } = getConnectorStatusAppearance(status);
	const statusMessage = tooltipOverride
		? t('sidebar.connectorStatus.failedWithReason', { reason: extractConnectorErrorReason(tooltipOverride) })
		: t(`sidebar.connectorStatus.${tooltipKey}`);
	const tooltipContent = lastCheckedAt != null
		? t('sidebar.connectorStatus.checkedAt', { time: formatRelativeTime(lastCheckedAt, lang), message: statusMessage })
		: statusMessage;

	const isChanged = useConnectorStatusPulse(status);

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
