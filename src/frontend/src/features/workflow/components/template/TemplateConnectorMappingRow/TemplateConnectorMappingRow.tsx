import { IconButton } from '@shared/ui/primitives/IconButton';
import { Select } from '@shared/ui/primitives/Select';
import type { SelectOption } from '@shared/ui/primitives/Select/Select.types';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { Connector } from '@entities/connector/model/types';
import type { ConnectorMappingGroup } from '../templateConnectorMapping.utils';

type Props = {
	group: ConnectorMappingGroup;
	value?: number;
	connectors: Connector[];
	unknownLabel: string;
	noInvokerHint: string;
	usedByLabel: string;
	selectPlaceholder: string;
	createTooltip: string;
	onChange: (value: number) => void;
	onCreate: () => void;
};

const toConnectorOption = (connector: Connector): SelectOption<number> => ({
	value: connector.connectorId,
	label: connector.title,
});

export const TemplateConnectorMappingRow = ({ group, value, connectors,
	unknownLabel, noInvokerHint, usedByLabel, selectPlaceholder, createTooltip,
	onChange, onCreate }: Props) => {
	const fallbackTitle = group.templateTitle && group.templateTitle !== 'DEFAULT'
		? group.templateTitle : null;
	return (
		<div className="templateConnectorMappingRow">
			<div className="templateConnectorMappingRowInfo">
				<span className="templateConnectorMappingRowTitle">
					{group.invokerName ?? fallbackTitle ?? unknownLabel}
				</span>
				<span className="templateConnectorMappingRowMeta">
					{!group.invokerName && <>{noInvokerHint}{' · '}</>}
					{usedByLabel}
				</span>
			</div>
			<div className="templateConnectorMappingRowSelect">
				<Select value={value} options={connectors.map(toConnectorOption)}
					placeholder={selectPlaceholder} onChange={onChange}
					testId={`workflow-template-connector-mapping-select-${group.oldConnectorId}`} />
			</div>
			<Tooltip content={createTooltip}>
				<IconButton iconProps={{ name: 'plus' }} onClick={onCreate}
					testId={`workflow-template-connector-mapping-create-${group.oldConnectorId}`} />
			</Tooltip>
		</div>
	);
};
