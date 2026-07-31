import { Input, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
  open: boolean;
  value: string;
  onClose: () => void;
  onSave: (value: string) => void;
};

export function XmlTagDialog({ open, value, onClose, onSave }: Props) {
  const { t } = useI18n('workflow');
  const [nextValue, setNextValue] = useState(value);

  useEffect(() => {
    setNextValue(value);
  }, [value]);

  return (
    <Modal
      open={open}
      title={t('xmlDialog.editTag')}
      onCancel={onClose}
      onOk={() => onSave(nextValue.trim() || 'tag')}
      okText={t('actions.apply')}
    >
      <Input value={nextValue} onChange={(event) => setNextValue(event.target.value)} placeholder={t('xmlDialog.tagName')} />
    </Modal>
  );
}
