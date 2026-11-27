import { Input, Modal } from 'antd';
import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { checkXmlName } from '../../../../../utils/xmlBody';
import type { XmlTagDialogProps } from './XmlTagDialog.types';

export function XmlTagDialog({ open, value, onClose, onSave }: XmlTagDialogProps) {
  const { t } = useI18n('workflow');
  const [nextValue, setNextValue] = useState(value);

  const name = nextValue.trim() || 'tag';
  const check = checkXmlName(name);
  const error = check === 'reserved' ? t('xmlDialog.tagReserved', { name })
    : check === 'invalid' ? t('xmlDialog.tagInvalid') : null;

  return <Modal open={open} title={t('xmlDialog.editTag')} onCancel={onClose}
    onOk={() => onSave(name)} okText={t('actions.apply')} okButtonProps={{ disabled: !!error }}>
    <Input value={nextValue} onChange={(event) => setNextValue(event.target.value)}
      placeholder={t('xmlDialog.tagName')} status={error ? 'error' : undefined} data-testid='xml-tag-name' />
    {error && <div className='xmlTagError' role='alert'>{error}</div>}
  </Modal>;
}
