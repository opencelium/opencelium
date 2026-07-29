import type { TooltipPlacement } from '@shared/ui/primitives/Tooltip/Tooltip.types';
import type { ConnectorHealthStatus } from '@entities/connector/model/types';

export type ConnectorStatus = ConnectorHealthStatus;

export type ConnectorStatusAppearance = {
	color: string;
	tooltipKey: 'up' | 'authFailed' | 'down' | 'unknown';
};

export type ConnectorStatusDotProps = {
	status: ConnectorStatus;
	size?: number;
	className?: string;
	testId?: string;
	tooltipOverride?: string | null;
	suppressTooltip?: boolean;
	/** Epoch millis of the last backend health check — appends a "checked 2 min ago"
	 * clause to the tooltip when present. Advances on every check even when status
	 * doesn't change, so it's expected to go stale between snapshot refetches. */
	lastCheckedAt?: number | null;
	/** Defaults to 'top' (the canvas node dot's original placement). Pass 'topLeft'
	 * for the connector-picker sidebar, where the dot sits at the item's edge and a
	 * top-centered tooltip would spill outside the sidebar panel. */
	tooltipPlacement?: TooltipPlacement;
};
