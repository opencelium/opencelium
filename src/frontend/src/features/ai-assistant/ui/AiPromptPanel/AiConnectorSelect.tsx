import { useMemo } from 'react';
import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Select } from '@shared/ui/primitives/Select';
import type { AiConnectorChoice } from '../../utils/aiConnectors.utils';

type Props = {
	label: string;
	value: number | null;
	choices: AiConnectorChoice[];
	disabled: boolean;
	testId: string;
	onChange: (connectorId: number) => void;
};

export function AiConnectorSelect({ label, value, choices, disabled, testId, onChange }: Props) {
	const { t } = useI18n('workflow');
	const options = useMemo(() => choices.map((choice) => ({
		value: choice.connectorId,
		searchLabel: choice.title,
		label: (
			<span className="aiConnectorOption">
				<ConnectorIcon icon={choice.icon} size={18} isCircled />
				<span className="aiConnectorOptionTitle">{choice.title}</span>
			</span>
		),
	})), [choices]);

	return (
		<label className="aiConnectorField">
			<span className="aiConnectorLabel">{label}</span>
			<Select<number> value={value ?? undefined} options={options} disabled={disabled}
				placeholder={t('ai.connectors.placeholder')} testId={testId} onChange={onChange} />
		</label>
	);
}
