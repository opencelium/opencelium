import type { ReactNode } from 'react';
import { Button, Space } from 'antd';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { hasOnlyReferences } from '../bodyReference';
import { setLastBodyReferenceTriggerRect } from '../InlineBodyReferenceEditor';
import { XmlReferenceTokens } from './XmlReferenceTokens';
import type { XmlSelection } from './xmlTree';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import './xmlField.css';

type Props = {
  label: ReactNode;
  value: string;
  selection: XmlSelection;
  selected?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  variant?: 'text' | 'attribute';
  onSelect: (selection: XmlSelection) => void;
  onChange: (value: string) => void;
  onRemove?: () => void;
  onReferenceClick?: (selection: XmlSelection) => void;
  onInsertReference?: (selection: XmlSelection) => void;
  onEdit?: () => void;
};

export function XmlFieldEditor({
  label,
  value,
  selection,
  selected,
  readOnly,
  placeholder,
  variant = 'text',
  onSelect,
  onChange,
  onRemove,
  onReferenceClick,
  onInsertReference,
  onEdit,
}: Props) {
  const { t } = useI18n('workflow');
  const stringValue = typeof value === 'string' ? value : value == null ? '' : String(value);
  const referenceOnly = hasOnlyReferences(stringValue);
  const isEmptyValue = !stringValue.trim();
  const preview = isEmptyValue ? placeholder || t('xmlNode.empty') : stringValue;
  return (
    <div className={`xmlField xmlFieldRow ${variant === 'attribute' ? 'xmlFieldRowAttr' : 'xmlFieldRowText'} ${selected ? 'xmlFieldRowSelected' : ''}`}>
      <span className="xmlFieldLabel">{label}</span>
      <div className="xmlFieldValue">
        {referenceOnly ? (
          <XmlReferenceTokens
            value={stringValue}
            readOnly={readOnly}
            onChange={onChange}
            onClick={() => {
              onSelect(selection);
              onReferenceClick?.(selection);
            }}
          />
        ) : (
          <button
            type="button"
            className={`xmlFieldPreview ${isEmptyValue ? 'xmlFieldPreviewEmpty' : ''}`}
            onClick={() => {
              onSelect(selection);
              onEdit?.();
            }}
            disabled={readOnly && !onEdit}
          >
            {preview}
          </button>
        )}
      </div>
      {!readOnly ? (
        <Space size={4} className="xmlFieldActions">
          {onInsertReference ? (
            <Button
              className="xmlActionButton"
              size="small"
              type="text"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const container = event.currentTarget.closest('.bodyLegacyLeft') as HTMLElement | null;
                const containerRect = container?.getBoundingClientRect();
                setLastBodyReferenceTriggerRect({
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                  containerLeft: containerRect?.left,
                  containerRight: containerRect?.right,
                });
                onSelect(selection);
                onInsertReference(selection);
              }}
            >
              {t('actions.insertReference')}
            </Button>
          ) : null}
          {onEdit ? <Button className="xmlActionButton" size="small" type="text" onClick={onEdit}>{t('actions.edit')}</Button> : null}
          {onRemove ? (
            <Tooltip content={t('actions.delete')}>
              <DeleteIconButton iconSize={14} onClick={onRemove} />
            </Tooltip>
          ) : null}
        </Space>
      ) : null}
    </div>
  );
}
