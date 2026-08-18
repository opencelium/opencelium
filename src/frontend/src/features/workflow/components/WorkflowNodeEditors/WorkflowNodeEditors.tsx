import { ResponseDialog } from '../request-editor/ResponseDialog/ResponseDialog';
import { MethodConfigDialog } from '../request-editor/MethodConfigDialog/MethodConfigDialog';
import { ConditionBuilderDialog } from '../condition-builder/ConditionBuilder';
import { AggregatorConfigDialog } from '../aggregator/AggregatorConfigDialog';
import type { WorkflowNodeEditorsProps } from './WorkflowNodeEditors.types';

export const WorkflowNodeEditors = ({ response, method, condition,
	aggregator }: WorkflowNodeEditorsProps) => <>
	<ResponseDialog {...response} />
	<MethodConfigDialog {...method} />
	<ConditionBuilderDialog {...condition} />
	<AggregatorConfigDialog {...aggregator} />
</>;
