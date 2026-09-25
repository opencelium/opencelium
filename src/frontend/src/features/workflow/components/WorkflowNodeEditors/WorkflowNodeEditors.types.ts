import type { ComponentProps } from 'react';
import type { ResponseDialog } from '../request-editor/ResponseDialog/ResponseDialog';
import type { MethodConfigDialog } from '../request-editor/MethodConfigDialog/MethodConfigDialog';
import type { ConditionBuilderDialog } from '../condition-builder/ConditionBuilder';
import type { AggregatorConfigDialog } from '../aggregator/AggregatorConfigDialog';

export type WorkflowNodeEditorsProps = {
	response: ComponentProps<typeof ResponseDialog>;
	method: ComponentProps<typeof MethodConfigDialog>;
	condition: ComponentProps<typeof ConditionBuilderDialog>;
	aggregator: ComponentProps<typeof AggregatorConfigDialog>;
};
