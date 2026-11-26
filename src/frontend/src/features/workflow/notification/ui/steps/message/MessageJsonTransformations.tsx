import { useI18n } from '@shared/i18n/hooks/useI18n';
import { listJsonReferenceFields, toBindingPath, writeJsonPath } from '../../../model/notificationBodyPath';
import { NotificationValueField } from '../../transformation/NotificationValueField';

type Props = { bodyText: string; onChange: (bodyText: string) => void; isReadOnly?: boolean };

/**
 * The text values of hand-edited JSON that hold references, each with the transformation button
 * the editor fields have. A transformation is bound to the value's path in the JSON.
 */
export function MessageJsonTransformations({ bodyText, onChange, isReadOnly }: Props) {
	const { t } = useI18n('workflow');
	const fields = listJsonReferenceFields(bodyText);
	const hint = fields === null ? t('notification.transformation.json.invalid')
		: fields.length === 0 ? t('notification.transformation.json.empty') : t('notification.transformation.json.hint');

	return (
		<div className='notificationJsonTransforms' data-testid='notification-json-transformations'>
			<span className='notificationFieldLabel'>{t('notification.transformation.json.title')}</span>
			<span className='notificationMuted'>{hint}</span>
			{fields?.map(({ path, value }, index) => {
				const id = `notification-json-field-${index}`;
				const label = toBindingPath(path);
				return (
					<div key={label} className='notificationField'>
						<label className='notificationJsonTransformPath' htmlFor={id}>{label}</label>
						<NotificationValueField target={{ kind: 'json', path }} id={id} value={value} ariaLabel={label}
							disabled={isReadOnly} testId={id} onChange={(next) => {
								const nextText = writeJsonPath(bodyText, path, next);
								if (nextText !== null) onChange(nextText);
							}} />
					</div>
				);
			})}
		</div>
	);
}
