import { ResponseDialog } from '../request-editor/ResponseDialog/ResponseDialog';
import { MethodConfigDialog } from '../request-editor/MethodConfigDialog/MethodConfigDialog';
import { ConditionBuilderDialog } from '../condition-builder/ConditionBuilder';
import { AggregatorConfigDialog } from '../aggregator/AggregatorConfigDialog';
import { ChangeConnectorDialog } from '../change-connector/ChangeConnectorDialog';
import { ConnectorImageDialog } from '../connector-image/ConnectorImageDialog';
import { RequestPlaygroundDialog } from '../../request-playground/ui/RequestPlaygroundDialog';
import { SetGlobalDialog } from '../set-global/SetGlobalDialog';
import type { WorkflowNodeEditorsProps } from './WorkflowNodeEditors.types';

export const WorkflowNodeEditors = ({ response, method, condition, setGlobal,
	aggregator, connector, connectorImage, requestPlayground }: WorkflowNodeEditorsProps) => <>
	<ResponseDialog {...response} />
	<MethodConfigDialog {...method} />
	<ConditionBuilderDialog {...condition} open={condition.open && condition.node?.type !== 'setglobal'} />
	<SetGlobalDialog open={condition.open} node={condition.node ?? null} nodes={condition.nodes}
		edges={condition.edges} connection={condition.connection} onClose={condition.onClose} onSave={setGlobal.onSave} />
	<AggregatorConfigDialog {...aggregator} />
	<ChangeConnectorDialog {...connector} />
	<ConnectorImageDialog {...connectorImage} />
	<RequestPlaygroundDialog {...requestPlayground} />
</>;
