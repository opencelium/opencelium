import type { MethodWithId } from '../../../../types/connection';

export type MethodConnectorChipProps = {
	method: MethodWithId;
	iconOnly?: boolean;
	iconSize?: number;
	tooltipZIndex?: number;
	disableTooltip?: boolean;
};
