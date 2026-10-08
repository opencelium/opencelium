import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { ConnectorStatusDotProps } from './ConnectorStatusDot.types';
import { getConnectorStatusAppearance } from './connectorStatusDot.utils';
import { useConnectorStatusPulse } from './useConnectorStatusPulse';
import { useConnectorStatusTooltip } from './useConnectorStatusTooltip';

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
	const { color } = getConnectorStatusAppearance(status);
	const tooltipContent = useConnectorStatusTooltip({ status, tooltipOverride, lastCheckedAt });

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
