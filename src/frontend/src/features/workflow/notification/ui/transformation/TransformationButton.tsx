import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { getTransformationAvailability } from '../../model/notificationTransformation';
import type { AnyTransformTarget } from '../../model/notificationTransformTargets';
import { useNotificationTransformations } from './notificationTransformationContextValue';

type Props = { target: AnyTransformTarget; value: string; testId: string; disabled?: boolean; onChange: (value: string) => void };

const useDisabledReason = (target: AnyTransformTarget, value: string): string | null => {
	const { locate } = useNotificationTransformations();
	const location = locate(target);
	if (!location) return 'unused';
	if (location.kind !== 'whole') return location.kind;
	const availability = getTransformationAvailability(value);
	return availability === 'ok' ? null : availability;
};

/** Turns the field into a script that computes its value from the references it holds. */
export function TransformationButton({ target, value, testId, disabled, onChange }: Props) {
	const { t } = useI18n('workflow');
	const { add } = useNotificationTransformations();
	const reason = useDisabledReason(target, value);
	return (
		<Tooltip content={t(reason ? `notification.transformation.unavailable.${reason}` : 'notification.transformation.add')}>
			<IconButton type='text' size='sm' iconProps={{ name: 'code', size: 14 }} testId={testId}
				disabled={disabled || !!reason}
				onClick={() => {
					const next = add(target, value);
					if (next !== null) onChange(next);
				}} />
		</Tooltip>
	);
}
