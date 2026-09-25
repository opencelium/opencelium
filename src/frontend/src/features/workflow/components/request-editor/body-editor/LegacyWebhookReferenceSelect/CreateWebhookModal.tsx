import { FontSizeOutlined, UserOutlined } from '@ant-design/icons';
import { Input, Modal, Select } from 'antd';
import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { upsertWebhookOption, WEBHOOK_TYPES, type WebhookType } from '../bodyWebhook';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (value: string) => void;
};

export function CreateWebhookModal({ open, onClose, onCreate }: Props) {
  const { t } = useI18n('workflow');
  const [name, setName] = useState('');
  const [type, setType] = useState<WebhookType>();
  const resetAndClose = () => {
    setName('');
    setType(undefined);
    onClose();
  };
  const create = () => {
    if (!(name.trim() && type)) return;
    onCreate(upsertWebhookOption(name.trim(), type).value);
    resetAndClose();
  };

  return <Modal open={open} title={t('actions.addWebhook')} zIndex={13020}
    rootClassName='bodyLegacyWebhookModalRoot' closeIcon={null} onCancel={resetAndClose}
    onOk={create} okButtonProps={{ disabled: !(name.trim() && type) }}
    styles={{ body: { paddingTop: 12 } }}>
    <Input value={name} onChange={(event) => setName(event.target.value)}
      placeholder={t('webhook.namePlaceholder')}
      prefix={<UserOutlined style={{ color: 'var(--color-text-disabled)' }} />}
      variant='borderless' className='bodyLegacyWebhookModalInput' />
    <Select placeholder={t('webhook.typePlaceholder')} value={type} onChange={setType}
      options={WEBHOOK_TYPES.map((item) => ({ label: item, value: item }))}
      style={{ width: '100%', marginTop: 12 }}
      prefix={<FontSizeOutlined style={{ color: 'var(--color-text-disabled)' }} />}
      variant='borderless' className='bodyLegacyWebhookModalSelect'
      getPopupContainer={(trigger) => trigger.parentElement || document.body}
      styles={{ popup: { root: { zIndex: 13030 } } }} />
  </Modal>;
}
