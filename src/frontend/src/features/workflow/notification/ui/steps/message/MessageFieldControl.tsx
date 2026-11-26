import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Checkbox } from '@shared/ui/primitives/Checkbox';
import { Input } from '@shared/ui/primitives/Input';
import { Select } from '@shared/ui/primitives/Select';
import type { NotificationFieldValue, NotificationMessageValues } from '../../../model/notification.types';
import type { NotificationField } from '../../../tools/notificationTool.types';
import { factsValue, flagValue, textValue } from '../../../tools/toolValues';
import { NotificationValueField } from '../../transformation/NotificationValueField';
import { FactsEditor } from './FactsEditor';

type Props = {
	field: NotificationField;
	values: NotificationMessageValues;
	isDisabled: boolean;
	onChange: (key: string, value: NotificationFieldValue) => void;
};

export function MessageFieldControl({ field, values, isDisabled, onChange }: Props) {
	const { t } = useI18n('workflow');
	const id = `notification-field-${field.key}`;
	const label = t(field.labelKey);
	const caption = <label className='notificationFieldLabel' htmlFor={id}>{label}</label>;

	switch (field.kind) {
		case 'line':
		case 'area':
			return (
				<div className='notificationField'>
					{caption}
					<NotificationValueField target={{ kind: 'field', key: field.key }} id={id} value={textValue(values, field.key)} isMultiline={field.kind === 'area'}
						placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined} ariaLabel={label}
						disabled={isDisabled} testId={id} onChange={(value) => onChange(field.key, value)} />
					{field.helpKey && <span className='notificationFieldHelp'>{t(field.helpKey)}</span>}
				</div>
			);
		case 'text':
			return (
				<div className='notificationField'>
					{caption}
					<Input value={textValue(values, field.key)} disabled={isDisabled} testId={id}
						placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
						onChange={(event) => onChange(field.key, event.target.value)} />
				</div>
			);
		case 'select':
			return (
				<div className='notificationField'>
					{caption}
					<Select value={textValue(values, field.key)} disabled={isDisabled} testId={id} sortOptions={false}
						options={field.options.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
						onChange={(value) => onChange(field.key, value)} />
				</div>
			);
		case 'toggle':
			return (
				<Checkbox checked={flagValue(values, field.key)} disabled={isDisabled} label={label} testId={id}
					onChange={(checked) => onChange(field.key, checked)} />
			);
		case 'facts':
			return (
				<div className='notificationField'>
					<span className='notificationFieldLabel'>{label}</span>
					<FactsEditor fieldKey={field.key} facts={factsValue(values, field.key)} isDisabled={isDisabled}
						onChange={(facts) => onChange(field.key, facts)} />
				</div>
			);
		default: {
			const _exhaustive: never = field;
			return _exhaustive;
		}
	}
}
