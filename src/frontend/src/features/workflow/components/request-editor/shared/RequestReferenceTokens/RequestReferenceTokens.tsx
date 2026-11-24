import { useI18n } from '@shared/i18n/hooks/useI18n';
import { splitReferences } from '../../body-editor/bodyReference';
import { ReferenceChip } from '../../../reference-chip/ReferenceChip';
import { formatStepReferencePath, readStepReferenceColor } from '../../../reference-chip/referenceChip.utils';
import { useReferenceSourceLabels } from '../../../reference-chip/ReferenceSourceContext';
import type { RequestReferenceTokensProps } from './RequestReferenceTokens.types';

export function RequestReferenceTokens({ value, readOnly, onChange }: RequestReferenceTokensProps) {
  const { t } = useI18n('workflow');
  const { methodLabel } = useReferenceSourceLabels();
  const references = splitReferences(value);
  if (!references.length) return null;

  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
    {references.map((reference, index) => {
      const color = readStepReferenceColor(reference);
      return <ReferenceChip key={`${reference}-${index}`} color={color ?? 'var(--color-action-primary)'}
        source={color ? methodLabel(color) : undefined} path={formatStepReferencePath(reference)} title={reference}>
        {!readOnly && <button type='button' className='wfReferenceChipRemove' aria-label={t('actions.deleteReference')}
          onClick={(event) => {
            event.stopPropagation();
            onChange(references.filter((_, current) => current !== index).join('; '));
          }}>×</button>}
      </ReferenceChip>;
    })}
  </div>;
}
