import { Input, Modal } from 'antd';
import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  value: string;
  onClose: () => void;
  onSave: (value: string) => void;
};

export function XmlTagDialog({ open, value, onClose, onSave }: Props) {
  const [nextValue, setNextValue] = useState(value);

  useEffect(() => {
    setNextValue(value);
  }, [value]);

  return (
    <Modal
      open={open}
      title="Edit tag"
      onCancel={onClose}
      onOk={() => onSave(nextValue.trim() || 'tag')}
      okText="Apply"
    >
      <Input value={nextValue} onChange={(event) => setNextValue(event.target.value)} placeholder="Tag name" />
    </Modal>
  );
}
