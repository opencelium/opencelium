import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Space, Typography } from 'antd';
import { hasOnlyReferences } from '../bodyReference';
import { setLastBodyReferenceTriggerRect } from '../InlineBodyReferenceEditor';
import { XmlReferenceTokens } from './XmlReferenceTokens';
import type { XmlSelection } from './xmlTree';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import './xmlField.css';

type Props = {
  label: string;
  value: string;
  selection: XmlSelection;
  selected?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  onSelect: (selection: XmlSelection) => void;
  onChange: (value: string) => void;
  onRemove?: () => void;
  onReferenceClick?: (selection: XmlSelection) => void;
  onAddEmpty?: () => void;
  onInsertReference?: (selection: XmlSelection) => void;
  onEdit?: () => void;
  inlineEditable?: boolean;
};

export function XmlFieldEditor({
  label,
  value,
  selection,
  selected,
  readOnly,
  placeholder,
  onSelect,
  onChange,
  onRemove,
  onReferenceClick,
  onAddEmpty,
  onInsertReference,
  onEdit,
  inlineEditable = false,
}: Props) {
  const { t } = useI18n('workflow');
  const stringValue = typeof value === 'string' ? value : value == null ? '' : String(value);
  const referenceOnly = hasOnlyReferences(stringValue);
  const preview = stringValue.trim() ? stringValue : placeholder || t('xmlNode.empty');
  return (
    <div className="xmlField" style={{ display: 'grid', gap: 6 }}>
      <Space className="xmlFieldHeader" style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Text type="secondary" className="xmlFieldLabel">{label}</Typography.Text>
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
            {onAddEmpty ? <Button className="xmlIconButton" size="small" type="text" icon={<PlusOutlined />} onClick={onAddEmpty} /> : null}
            {onRemove ? <Button className="xmlIconButton" size="small" danger type="text" icon={<DeleteOutlined />} onClick={onRemove} /> : null}
          </Space>
        ) : null}
      </Space>
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
      ) : inlineEditable ? (
        <Input.TextArea
          className="xmlFieldInput"
          value={stringValue}
          placeholder={placeholder}
          autoSize={{ minRows: 1, maxRows: 4 }}
          readOnly={readOnly}
          status={selected ? 'warning' : ''}
          onFocus={() => onSelect(selection)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <button
          type="button"
          className={`xmlFieldPreview ${selected ? 'xmlFieldPreviewSelected' : ''}`}
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
  );
}
