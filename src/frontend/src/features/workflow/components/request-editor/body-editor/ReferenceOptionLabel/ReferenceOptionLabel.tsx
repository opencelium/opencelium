import { useI18n } from '@shared/i18n/hooks/useI18n';
import { isListReferencePath, type ReferencePathOption } from '../requestReferenceOptions';
import './referenceOptionLabel.css';

export function ReferenceOptionLabel({ option }: { option: ReferencePathOption }) {
  const { t } = useI18n('workflow');
  const isList = isListReferencePath(option.value);
  if (option.kind === 'field' && !isList) return <>{option.label}</>;
  return (
    <span className='referenceOptionLabel'>
      <span className='referenceOptionLabelText'>{option.label}</span>
      <span className='referenceOptionLabelTags'>
        {option.kind === 'operation' && <code className='referenceOptionSyntax'>{option.syntax}</code>}
        {isList && (
          <span className='referenceListBadge' title={t('references.listResultHint')}>
            {t('references.listResult')}
          </span>
        )}
      </span>
    </span>
  );
}
