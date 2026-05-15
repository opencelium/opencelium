import { Input, Modal } from 'antd';
import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  name: string;
  value: string;
  onClose: () => void;
  onSave: (name: string, value: string) => void;
};

export function XmlAttributeDialog({ open, name, value, onClose, onSave }: Props) {
  const [nextName, setNextName] = useState(name);
  const [nextValue, setNextValue] = useState(value);

  useEffect(() => {
    setNextName(name);
    setNextValue(value);
  }, [name, value]);

  return (
    <Modal
      open={open}
      title="Edit attribute"
      onCancel={onClose}
      onOk={() => onSave(nextName.trim() || 'attribute', nextValue)}
      okText="Apply"
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <Input value={nextName} onChange={(event) => setNextName(event.target.value)} placeholder="Attribute name" />
        <Input.TextArea value={nextValue} onChange={(event) => setNextValue(event.target.value)} autoSize={{ minRows: 2, maxRows: 4 }} placeholder="Attribute value" />
      </div>
    </Modal>
  );
}
