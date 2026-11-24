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
					default:
						return <MessageFieldControl key={item.key} field={item} values={values} isDisabled={isDisabled} onChange={onChange} />;
				}
			})}
		</div>
	);
}
