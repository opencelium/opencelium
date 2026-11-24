import { useI18n } from '@shared/i18n/hooks/useI18n';
import { splitReferences } from '../../body-editor/bodyReference';
import { ReferenceChip } from '@shared/ui/reference-chip/ReferenceChip';
import { describeWorkflowReference } from '../../../reference-chip/describeWorkflowReference';
import { useReferenceSourceLabels } from '../../../reference-chip/ReferenceSourceContext';
import type { RequestReferenceTokensProps } from './RequestReferenceTokens.types';

export function RequestReferenceTokens({ value, readOnly, onChange }: RequestReferenceTokensProps) {
  const { t } = useI18n('workflow');
  const labels = useReferenceSourceLabels();
  const references = splitReferences(value);
  if (!references.length) return null;

  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
    {references.map((reference, index) => {
      return <ReferenceChip key={`${reference}-${index}`} {...describeWorkflowReference(reference, labels)} title={reference}>
        {!readOnly && <button type='button' className='wfReferenceChipRemove' aria-label={t('actions.deleteReference')}
          onClick={(event) => {
            event.stopPropagation();
            onChange(references.filter((_, current) => current !== index).join('; '));
          }}>×</button>}
      </ReferenceChip>;
    })}
  </div>;
}
