import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Icon } from '@shared/ui/primitives/Icon';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { ReferenceChip } from '@shared/ui/reference-chip/ReferenceChip';
import {
	getTransformationAvailability, splitTransformationParts, toTransformedValue,
} from '../../model/notificationTransformation';
import type { AnyTransformTarget } from '../../model/notificationTransformTargets';
import { useNotificationReferences } from '../references/notificationReferenceContextValue';
import { NotificationReferencePicker } from '../references/NotificationReferencePicker';
import { ReferenceInsertButton } from '../references/ReferenceInsertButton';
import { useNotificationTransformations } from './notificationTransformationContextValue';
import { TransformationEditor } from './TransformationEditor';

type Props = {
	id: string;
	target: AnyTransformTarget;
	enhanceId: string;
	value: string;
	label: string;
	disabled?: boolean;
	testId: string;
	onChange: (value: string) => void;
};

/** A field filled by a script: its references are the script's inputs, the script result is the value. */
export function TransformationField({ id, target, enhanceId, value, label, disabled, testId, onChange }: Props) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const { describe } = useNotificationReferences();
	const { remove, syncInputs, openEditorId, setOpenEditorId } = useNotificationTransformations();
	const isEditorOpen = openEditorId === enhanceId;
	const inputs = splitTransformationParts(value).filter((part) => part.kind === 'step' || part.kind === 'global');

	const change = (next: string) => {
		const transformed = toTransformedValue(next);
		onChange(transformed);
		syncInputs(target, transformed);
	};
	const removeTransformation = async () => {
		const isConfirmed = await confirm({
			title: t('enhancement.confirmDelete.title'),
			message: t('enhancement.confirmDelete.message'),
		});
		if (isConfirmed) remove(target);
	};

	return (
		<div className='notificationRefFieldWrap'>
			<div className={`notificationRefField notificationTransformField ${disabled ? 'notificationRefField--disabled' : ''}`}
				data-testid={testId}>
				<div className='notificationTransformInputs'>
					<span className='notificationTransformBadge'>
						<Icon name='code' size={12} />
						{t('notification.transformation.label')}
					</span>
					{inputs.map((part, index) => {
						const info = describe(part.token);
						return (
							<ReferenceChip key={`${part.token}-${index}`} color={info.color} source={info.source} path={info.path}
								title={`VAR_${index} · ${info.token}`} testId={`${testId}-input-${index}`}>
								{!disabled && (
									<button type='button' className='wfReferenceChipRemove' aria-label={t('actions.deleteReference')}
										onClick={() => change(inputs.filter((_, position) => position !== index).map((item) => item.token).join(' '))}>
										×
									</button>
								)}
							</ReferenceChip>
						);
					})}
				</div>
				<ReferenceInsertButton pickerId={id} testId={`${testId}-insert-reference`} disabled={disabled} />
				<Tooltip content={t('notification.transformation.editScript')}>
					<IconButton type='text' size='sm' iconProps={{ name: 'edit', size: 14 }}
						testId={`${testId}-edit-script`} onClick={() => setOpenEditorId(enhanceId)} />
				</Tooltip>
				{!disabled && (
					<Tooltip content={t('notification.transformation.remove')}>
						<IconButton type='text' size='sm' iconProps={{ name: 'unlink', size: 14 }} testId={`${testId}-remove-transformation`}
							onClick={() => void removeTransformation()} />
					</Tooltip>
				)}
			</div>
			<NotificationReferencePicker pickerId={id} onApply={(token) => change(`${value} ${token}`)} />
			{getTransformationAvailability(value) !== 'ok' && (
				<Alert type='warning' showIcon
					message={t('notification.transformation.needsStepReference')} />
			)}
			{isEditorOpen && <TransformationEditor enhanceId={enhanceId} fieldLabel={label}
				onDelete={() => remove(target)} onClose={() => setOpenEditorId(null)} />}
		</div>
	);
}
