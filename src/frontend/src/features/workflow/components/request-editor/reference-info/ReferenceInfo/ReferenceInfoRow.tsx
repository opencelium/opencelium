import type { FieldReference } from './ReferenceInfo.types';
import { buildReferenceToken, formatSourceField, formatTargetField } from './referenceInfo.utils';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
	field: string;
	refs: FieldReference[];
	messageProperty: string;
	paramKey: string;
	readOnly?: boolean;
	onClick?: (enhanceId: string) => void;
	onDeleteReference?: (fieldPath: string, pointer: string) => void;
	onDeleteEnhancement: (enhanceId: string) => void;
};

export function ReferenceInfoRow({ field, refs, messageProperty, paramKey, readOnly,
	onClick, onDeleteReference, onDeleteEnhancement }: Props) {
	const confirm = useConfirm();
	const { t } = useI18n('workflow');
	if (!refs.length) return null;
	const enhanceId = refs[0].enhanceId;
	const canDeleteEnhancement = refs.length <= 1;
	return (
		<div className='referenceInfoRow' onClick={() => enhanceId && onClick?.(enhanceId)}>
			<div className='referenceInfoTitle'>
				<span className='referenceInfoTarget'>
					{formatTargetField(messageProperty, field, paramKey)}
				</span>{' '}
				has {refs.length > 1 ? 'next references:' : 'one reference:'}
			</div>
			<div className='referenceInfoBindings'>
				{refs.map((reference, index) => {
					const canDelete = !!onDeleteReference || canDeleteEnhancement;
					const key = `${reference.enhanceId}-${index}`;
					return (
					<div key={`${reference.enhanceId}-${index}`} className='referenceInfoBinding'>
						<span className='referenceInfoMethod'
							style={{ backgroundColor: reference.method?.color || reference.color }}>
							{reference.method?.name || 'UnknownMethod'}
						</span>
						<span> bound with </span>
						<span className='referenceInfoSource' style={{ color: reference.color }}>
							{formatSourceField(reference.sourceMessageProperty, reference.target)}
						</span>
						<span>{index === refs.length - 1 ? ' field.' : ' field; '}</span>
						{!readOnly && <span className='referenceInfoDelete' onClick={async (event) => {
							event.stopPropagation();
							const ok = await confirm({ title: t('referenceInfo.confirmDelete.title'),
								message: t('referenceInfo.confirmDelete.message') });
							if (!ok) return;
							if (onDeleteReference) onDeleteReference(field, buildReferenceToken(reference));
							else onDeleteEnhancement(enhanceId);
						}}>
							<Tooltip content={t(canDelete ? 'actions.deleteReference'
								: 'enhancement.deleteDisabledMultipleReferences')}>
								<DeleteIconButton iconSize={13} disabled={!canDelete}
									testId={`workflow-reference-info-delete-${key}`} />
							</Tooltip>
						</span>}
					</div>
					);
				})}
			</div>
		</div>
	);
}
