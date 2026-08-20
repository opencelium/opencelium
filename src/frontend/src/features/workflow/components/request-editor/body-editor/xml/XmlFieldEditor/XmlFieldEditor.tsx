import { hasOnlyReferences } from '../../bodyReference';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { XmlReferenceTokens } from '../XmlReferenceTokens/XmlReferenceTokens';
import type { XmlFieldEditorProps } from './XmlFieldEditor.types';
import { XmlFieldActions } from './XmlFieldActions';
import '../xmlField.css';

export function XmlFieldEditor({ label, value, selection, selected, readOnly, placeholder,
  variant = 'text', onSelect, onChange, onRemove, onReferenceClick,
  onInsertReference, onEdit }: XmlFieldEditorProps) {
  const { t } = useI18n('workflow');
  const stringValue = typeof value === 'string' ? value : value == null ? '' : String(value);
  const referenceOnly = hasOnlyReferences(stringValue);
  const isEmptyValue = !stringValue.trim();
  const preview = isEmptyValue ? placeholder || t('xmlNode.empty') : stringValue;

  return <div className={`xmlField xmlFieldRow ${variant === 'attribute'
    ? 'xmlFieldRowAttr' : 'xmlFieldRowText'} ${selected ? 'xmlFieldRowSelected' : ''}`}>
    <span className="xmlFieldLabel">{label}</span>
    <div className="xmlFieldValue">
      {referenceOnly ? <XmlReferenceTokens value={stringValue} readOnly={readOnly}
        onChange={onChange} onClick={() => {
          onSelect(selection);
          onReferenceClick?.(selection);
        }} /> : <button type="button"
          className={`xmlFieldPreview ${isEmptyValue ? 'xmlFieldPreviewEmpty' : ''}`}
          onClick={() => { onSelect(selection); onEdit?.(); }} disabled={readOnly && !onEdit}>
          {preview}
        </button>}
    </div>
    {!readOnly && <XmlFieldActions selection={selection} onSelect={onSelect}
      onInsertReference={onInsertReference} onEdit={onEdit} onRemove={onRemove} />}
  </div>;
}
