import type { ComponentProps } from 'react';
import type { TransformTarget } from '../../model/notificationTransformTargets';
import { ReferenceTextField } from '../references/ReferenceTextField';
import { useNotificationTransformations } from './notificationTransformationContextValue';
import { TransformationButton } from './TransformationButton';
import { TransformationField } from './TransformationField';

type Props = Omit<ComponentProps<typeof ReferenceTextField>, 'actions'> & { target: TransformTarget };

/** A message value: references inline in text, or — once turned into one — a transformation. */
export function NotificationValueField({ target, ...field }: Props) {
	const { getEnhanceId, isReadOnly } = useNotificationTransformations();
	const enhanceId = getEnhanceId(target);
	if (enhanceId) {
		return <TransformationField id={field.id} target={target} enhanceId={enhanceId} value={field.value}
			label={field.ariaLabel} disabled={field.disabled || isReadOnly} testId={field.testId} onChange={field.onChange} />;
	}
	return (
		<ReferenceTextField {...field} actions={!isReadOnly && (
			<TransformationButton target={target} value={field.value} disabled={field.disabled}
				testId={`${field.testId}-add-transformation`} onChange={field.onChange} />
		)} />
	);
}
