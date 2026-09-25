import { Input, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { XmlTextDialogProps } from './XmlTextDialog.types';

export function XmlTextDialog({ open, value, onClose, onSave }: XmlTextDialogProps) {
  const { t } = useI18n('workflow');
  const [nextValue, setNextValue] = useState(value);

  useEffect(() => setNextValue(value), [value]);

  return <Modal open={open} title={t('xmlDialog.editText')} onCancel={onClose}
    onOk={() => onSave(nextValue)} okText={t('actions.apply')}>
    <Input.TextArea value={nextValue} onChange={(event) => setNextValue(event.target.value)}
      autoSize={{ minRows: 4, maxRows: 8 }} placeholder={t('xmlDialog.textValue')} />
  </Modal>;
}
