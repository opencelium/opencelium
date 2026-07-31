import { Input, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
  open: boolean;
  name: string;
  value: string;
  onClose: () => void;
  onSave: (name: string, value: string) => void;
};

export function XmlAttributeDialog({ open, name, value, onClose, onSave }: Props) {
  const { t } = useI18n('workflow');
  const [nextName, setNextName] = useState(name);
  const [nextValue, setNextValue] = useState(value);

  useEffect(() => {
    setNextName(name);
    setNextValue(value);
  }, [name, value]);

  return (
    <Modal
      open={open}
      title={t('xmlDialog.editAttribute')}
      onCancel={onClose}
      onOk={() => onSave(nextName.trim() || 'attribute', nextValue)}
      okText={t('actions.apply')}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <Input value={nextName} onChange={(event) => setNextName(event.target.value)} placeholder={t('xmlDialog.attributeName')} />
        <Input.TextArea value={nextValue} onChange={(event) => setNextValue(event.target.value)} autoSize={{ minRows: 2, maxRows: 4 }} placeholder={t('xmlDialog.attributeValue')} />
      </div>
    </Modal>
  );
}
