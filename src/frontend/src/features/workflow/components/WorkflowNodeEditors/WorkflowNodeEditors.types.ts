import type { ComponentProps } from 'react';
import type { ResponseDialog } from '../request-editor/ResponseDialog/ResponseDialog';
import type { MethodConfigDialog } from '../request-editor/MethodConfigDialog/MethodConfigDialog';
import type { ConditionBuilderDialog } from '../condition-builder/ConditionBuilder';
import type { AggregatorConfigDialog } from '../aggregator/AggregatorConfigDialog';
import type { ChangeConnectorDialog } from '../change-connector/ChangeConnectorDialog';
import type { ConnectorImageDialog } from '../connector-image/ConnectorImageDialog';
import type { RequestPlaygroundDialogProps } from '../../request-playground/ui/RequestPlaygroundDialog';
import type { SetGlobalDialog } from '../set-global/SetGlobalDialog';

export type WorkflowNodeEditorsProps = {
	response: ComponentProps<typeof ResponseDialog>;
	method: ComponentProps<typeof MethodConfigDialog>;
	condition: ComponentProps<typeof ConditionBuilderDialog>;
	setGlobal: Pick<ComponentProps<typeof SetGlobalDialog>, 'onSave'>;
	aggregator: ComponentProps<typeof AggregatorConfigDialog>;
	connector: ComponentProps<typeof ChangeConnectorDialog>;
	connectorImage: ComponentProps<typeof ConnectorImageDialog>;
	requestPlayground: RequestPlaygroundDialogProps;
};
