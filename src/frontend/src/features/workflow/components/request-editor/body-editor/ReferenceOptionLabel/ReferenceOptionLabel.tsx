import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { isListReferencePath, type ReferencePathOption } from '../requestReferenceOptions';
import './referenceOptionLabel.css';

// The options render inside popups stacked up to the confirm dialog (20000+),
// so the description must clear every one of them.
const DESCRIPTION_Z_INDEX = 30000;

export function ReferenceOptionLabel({ option }: { option: ReferencePathOption }) {
  const { t } = useI18n('workflow');
  const isList = isListReferencePath(option.value);
  if (option.kind === 'field' && !isList) return <>{option.label}</>;
  return (
    <span className='referenceOptionLabel'>
      <span className='referenceOptionLabelText'>{option.label}</span>
      <span className='referenceOptionLabelTags'>
        {option.kind === 'operation' && (
          <Tooltip content={option.description} placement='right' zIndex={DESCRIPTION_Z_INDEX} maxWidth={280}>
            <code className='referenceOptionSyntax'>{option.syntax}</code>
          </Tooltip>
        )}
        {isList && (
          <span className='referenceListBadge' title={t('references.listResultHint')}>
            {t('references.listResult')}
          </span>
        )}
      </span>
    </span>
  );
}
