import { Radio } from '@shared/ui/primitives/Radio';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ResponseType } from '../../request-editor/body-editor/requestReferenceOptions';

const OPTIONS: { value: ResponseType; label: string; titleKey: string }[] = [
	{ value: 'body', label: 'B', titleKey: 'conditionBuilder.responseType.body' },
	{ value: 'header', label: 'H', titleKey: 'conditionBuilder.responseType.header' },
	{ value: 'status', label: 'S', titleKey: 'conditionBuilder.responseType.status' },
];

type Props = { value: ResponseType; onChange: (value: ResponseType) => void };

export function ResponseTypeSwitcher({ value, onChange }: Props) {
	const { t } = useI18n('workflow');
	return <div className="conditionResponseTypeSwitcher compactRadioGroup">
		{OPTIONS.map((option) => <Radio key={option.value}
			checked={value === option.value}
			onChange={() => onChange(option.value)}
			label={<span className="conditionRadioIcon conditionResponseTypeIcon"
				title={t(option.titleKey)}>{option.label}</span>} />)}
	</div>;
}
