import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ReferenceChip } from '@shared/ui/reference-chip/ReferenceChip';
import { splitReferences } from '../../bodyReference';
import { describeWorkflowReference } from '../../../../reference-chip/describeWorkflowReference';
import { useReferenceSourceLabels } from '../../../../reference-chip/ReferenceSourceContext';
import type { XmlReferenceTokensProps } from './XmlReferenceTokens.types';

export function XmlReferenceTokens({ value, onChange, onClick, readOnly }: XmlReferenceTokensProps) {
  const confirm = useConfirm();
  const { t } = useI18n('workflow');
  const labels = useReferenceSourceLabels();
  const references = splitReferences(value);
  if (!references.length) return null;

  const remove = async (index: number) => {
    const confirmed = await confirm({
      title: t('references.confirmDelete.title'),
      message: t('references.confirmDelete.message'),
    });
    if (confirmed) onChange(references.filter((_, current) => current !== index).join('; '));
  };

  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} onClick={onClick}>
    {references.map((reference, index) => <ReferenceChip key={`${reference}-${index}`}
      {...describeWorkflowReference(reference, labels)} title={reference} isClickable={!!onClick}
      testId='xml-reference-chip'>
      {!readOnly && <button type='button' className='wfReferenceChipRemove' aria-label={t('actions.deleteReference')}
        onClick={(event) => {
          event.stopPropagation();
          void remove(index);
        }}>×</button>}
    </ReferenceChip>)}
  </div>;
}
