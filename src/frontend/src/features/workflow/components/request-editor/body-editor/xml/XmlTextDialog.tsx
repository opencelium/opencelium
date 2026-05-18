import { Input, Modal } from 'antd';
import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  value: string;
  onClose: () => void;
  onSave: (value: string) => void;
};

export function XmlTextDialog({ open, value, onClose, onSave }: Props) {
  const [nextValue, setNextValue] = useState(value);

  useEffect(() => {
    setNextValue(value);
  }, [value]);

  return (
    <Modal
      open={open}
      title="Edit text"
      onCancel={onClose}
      onOk={() => onSave(nextValue)}
      okText="Apply"
    >
      <Input.TextArea
        value={nextValue}
        onChange={(event) => setNextValue(event.target.value)}
        autoSize={{ minRows: 4, maxRows: 8 }}
        placeholder="Text value"
      />
    </Modal>
  );
}
