import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { getTransformationAvailability } from '../../model/notificationTransformation';
import { locateTransformTarget, type TransformTarget } from '../../model/notificationTransformTargets';
import { useNotificationTransformations } from './notificationTransformationContextValue';

type Props = { target: TransformTarget; value: string; testId: string; disabled?: boolean; onChange: (value: string) => void };

const useDisabledReason = (target: TransformTarget, value: string): string | null => {
	const { toolId, message } = useNotificationTransformations();
	if (!toolId) return 'unused';
	const location = locateTransformTarget(toolId, message, target);
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
