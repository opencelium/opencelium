import { ApiOutlined, LinkOutlined, NumberOutlined } from '@ant-design/icons';
import { Radio } from '@shared/ui/primitives/Radio';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ConditionValueSource } from '../conditionBuilder.types';

const OPTIONS = [
	{ value: 'constant', titleKey: 'conditionBuilder.source.constant', icon: <NumberOutlined /> },
	{ value: 'direct', titleKey: 'conditionBuilder.source.method', icon: <ApiOutlined /> },
	{ value: 'webhook', titleKey: 'conditionBuilder.source.webhook', icon: <LinkOutlined /> },
] satisfies { value: ConditionValueSource; titleKey: string; icon: React.ReactNode }[];

type Props = {
	value: ConditionValueSource;
	onChange: (value: ConditionValueSource) => void;
};

export function SourceSwitcher({ value, onChange }: Props) {
	const { t } = useI18n('workflow');
	return <div className="conditionSourceSwitcher compactRadioGroup">
		{OPTIONS.map((option) => <Radio key={option.value}
			checked={value === option.value}
			onChange={() => onChange(option.value)}
			label={<span className="conditionRadioIcon" title={t(option.titleKey)}>
				{option.icon}
			</span>} />)}
	</div>;
}
