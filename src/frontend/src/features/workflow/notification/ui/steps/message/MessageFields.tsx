import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { NotificationFieldValue, NotificationMessageValues } from '../../../model/notification.types';
import type { NotificationFieldLayout } from '../../../tools/notificationTool.types';
import { MessageFieldControl } from './MessageFieldControl';

type Props = {
	layout: NotificationFieldLayout[];
	values: NotificationMessageValues;
	isDisabled: boolean;
	onChange: (key: string, value: NotificationFieldValue) => void;
};

/** Renders a tool's field layout; the tool registry decides what exists, this only decides how it sits. */
export function MessageFields({ layout, values, isDisabled, onChange }: Props) {
	const { t } = useI18n('workflow');
	return (
		<div className='notificationFieldGrid'>
			{layout.map((item) => {
				switch (item.kind) {
					case 'row':
						return (
							<div key={item.id} className='notificationFieldRow'>
								{item.fields.map((field) => (
									<MessageFieldControl key={field.key} field={field} values={values} isDisabled={isDisabled} onChange={onChange} />
								))}
							</div>
						);
					case 'group':
						return (
							<fieldset key={item.id} className='notificationFieldGroup'>
								<legend>{t(item.titleKey)}</legend>
								<MessageFields layout={item.items} values={values} isDisabled={isDisabled} onChange={onChange} />
							</fieldset>
						);
					default:
						return <MessageFieldControl key={item.key} field={item} values={values} isDisabled={isDisabled} onChange={onChange} />;
				}
			})}
		</div>
	);
}
