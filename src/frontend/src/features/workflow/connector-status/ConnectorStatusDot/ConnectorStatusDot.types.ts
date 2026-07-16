export type ConnectorStatus = 'passed' | 'failed';

export type ConnectorStatusAppearance = {
	color: string;
	tooltipKey: ConnectorStatus;
};

export type ConnectorStatusDotProps = {
	status: ConnectorStatus;
	size?: number;
	className?: string;
	testId?: string;
	tooltipOverride?: string | null;
	suppressTooltip?: boolean;
};
