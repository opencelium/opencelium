import { ResponseDialog } from '../request-editor/ResponseDialog/ResponseDialog';
import { MethodConfigDialog } from '../request-editor/MethodConfigDialog/MethodConfigDialog';
import { ConditionBuilderDialog } from '../condition-builder/ConditionBuilder';
import { AggregatorConfigDialog } from '../aggregator/AggregatorConfigDialog';
import { ChangeConnectorDialog } from '../change-connector/ChangeConnectorDialog';
import { ConnectorImageDialog } from '../connector-image/ConnectorImageDialog';
import { RequestPlaygroundDialog } from '../../request-playground/ui/RequestPlaygroundDialog';
import type { WorkflowNodeEditorsProps } from './WorkflowNodeEditors.types';

export const WorkflowNodeEditors = ({ response, method, condition,
	aggregator, connector, connectorImage, requestPlayground }: WorkflowNodeEditorsProps) => <>
	<ResponseDialog {...response} />
	<MethodConfigDialog {...method} />
	<ConditionBuilderDialog {...condition} />
	<AggregatorConfigDialog {...aggregator} />
	<ChangeConnectorDialog {...connector} />
	<ConnectorImageDialog {...connectorImage} />
	<RequestPlaygroundDialog {...requestPlayground} />
</>;
