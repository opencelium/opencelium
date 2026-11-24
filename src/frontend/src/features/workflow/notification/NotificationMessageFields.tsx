import { useI18n } from '@shared/i18n/hooks/useI18n';
import { NotificationReferenceField } from './NotificationReferenceField';
import { notificationMessage } from './notificationMessage';
import type { NotificationTool, NotificationToolDraft } from '../nodes/NotificationNode/notificationTools';

type Message = NotificationToolDraft['message'];
type Props = { tool: NotificationTool; value: Message; disabled: boolean; onChange: (value: Message) => void };

export function NotificationMessageFields({ tool, value, disabled, onChange }: Props) {
	const { t } = useI18n('workflow');
	const set = (key: string, next: Message[string]) => onChange({ ...value, [key]: next });
	const pairs = Array.isArray(value.facts) ? value.facts : [];
	return <fieldset disabled={disabled}>
		{notificationMessage[tool].fields.map(({ key, options, area, toggle }) => {
			const label = t(`notification.fields.${key}` as `notification.fields.${keyof typeof labels}`);
			const testId = `notification-field-${key}`;
			const text = typeof value[key] === 'string' ? value[key] : '';
			if (key === 'facts') return <div key={key}>
				<p>{label}</p>
				{pairs.map(([name, fieldValue], index) => <div key={index} className="notificationPair">
					<NotificationReferenceField label={t('notification.name')} testId="notification-fact-name" value={name} disabled={disabled}
						onChange={(next) => set(key, pairs.map((pair, row) => row === index ? [next, fieldValue] : pair))} />
					<NotificationReferenceField label={t('notification.value')} testId="notification-fact-value" value={fieldValue} disabled={disabled}
						onChange={(next) => set(key, pairs.map((pair, row) => row === index ? [name, next] : pair))} />
					<button type="button" data-testid="notification-remove-fact"
						onClick={() => set(key, pairs.filter((_, row) => row !== index))}>{t('notification.remove')}</button>
				</div>)}
				<button type="button" data-testid="notification-add-fact"
					onClick={() => set(key, [...pairs, ['', '']])}>{t('notification.add')}</button>
			</div>;
			if (!options && !toggle) return <div key={key}>
				<div>{label}</div>
				<NotificationReferenceField label={label} testId={testId} value={String(text)} area={area}
					disabled={disabled} onChange={(next) => set(key, next)} />
			</div>;
			return <label key={key}>
				{label}
				{options ? <select data-testid={testId} value={String(text || options[0])}
					onChange={(event) => set(key, event.target.value)}>
					{options.map((option) => <option key={option} value={option}>{option === '' ? t('notification.default') : option in translatedOptions
						? t(`notification.options.${option as keyof typeof translatedOptions}`) : option}</option>)}
				</select> : <input type="checkbox" data-testid={testId} checked={value[key] === true}
					onChange={(event) => set(key, event.target.checked)} />}
			</label>;
		})}
	</fieldset>;
}

const labels = {
	text: '', header: '', body: '', facts: '', btnText: '', btnUrl: '', unfurl: '', title: '', style: '',
	mention: '', full: '', subtitle: '', threadKey: '', content: '', username: '', avatar: '', color: '',
	desc: '', url: '', channel: '', priority: '', icon: '', attTitle: '', alias: '', emoji: '', attText: '',
	format: '', topic: '', message: '', tags: '', click: '', markdown: '',
};

const translatedOptions = { default: true, accent: true, good: true, warning: true, attention: true,
	important: true, urgent: true, markdown: true, text: true };
