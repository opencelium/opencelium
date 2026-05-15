import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Space, Typography } from 'antd';
import { hasOnlyReferences } from '../bodyReference';
import { XmlReferenceTokens } from './XmlReferenceTokens';
import type { XmlSelection } from './xmlTree';
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
  const referenceOnly = hasOnlyReferences(value);
  const preview = value.trim() ? value : placeholder || 'Empty';
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
                onClick={() => {
                  onSelect(selection);
                  onInsertReference(selection);
                }}
              >
                Insert reference
              </Button>
            ) : null}
            {onEdit ? <Button className="xmlActionButton" size="small" type="text" onClick={onEdit}>Edit</Button> : null}
            {onAddEmpty ? <Button className="xmlIconButton" size="small" type="text" icon={<PlusOutlined />} onClick={onAddEmpty} /> : null}
            {onRemove ? <Button className="xmlIconButton" size="small" danger type="text" icon={<DeleteOutlined />} onClick={onRemove} /> : null}
          </Space>
        ) : null}
      </Space>
      {referenceOnly ? (
        <XmlReferenceTokens
          value={value}
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
          value={value}
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
