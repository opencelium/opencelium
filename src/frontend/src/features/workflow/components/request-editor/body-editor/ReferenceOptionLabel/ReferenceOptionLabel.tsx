import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { isListReferencePath, type ReferencePathOption } from '../requestReferenceOptions';
import './referenceOptionLabel.css';

// The options render inside popups stacked up to the confirm dialog (20000+),
// so the tag tooltips must clear every one of them.
const TAG_TOOLTIP_Z_INDEX = 30000;

export function ReferenceOptionLabel({ option }: { option: ReferencePathOption }) {
  const { t } = useI18n('workflow');
  const isList = isListReferencePath(option.value);
  // The native title sits on the text alone, so hovering a tag shows only that tag's tooltip.
  const text = <span className='referenceOptionLabelText' title={option.label}>{option.label}</span>;
  if (option.kind === 'field' && !isList) return text;
  return (
    <span className='referenceOptionLabel'>
      {text}
      <span className='referenceOptionLabelTags'>
        {option.kind === 'operation' && (
          <Tooltip content={option.description} placement='right' zIndex={TAG_TOOLTIP_Z_INDEX} maxWidth={280}>
            <code className='referenceOptionSyntax'>{option.syntax}</code>
          </Tooltip>
        )}
        {isList && (
          <Tooltip content={t('references.listResultHint')} placement='right' zIndex={TAG_TOOLTIP_Z_INDEX} maxWidth={280}>
            <span className='referenceListBadge'>{t('references.listResult')}</span>
          </Tooltip>
        )}
      </span>
    </span>
  );
}
