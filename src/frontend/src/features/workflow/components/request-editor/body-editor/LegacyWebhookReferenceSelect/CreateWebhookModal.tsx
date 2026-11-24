import { Modal, Select } from 'antd';
import { useState, type ReactNode } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Input } from '@shared/ui/primitives/Input';
import { upsertWebhookOption, WEBHOOK_TYPES, type WebhookType } from '../bodyWebhook';
import '@shared/ui/form/FormControl/FormControl.css';
import '@shared/ui/primitives/Select/select.ant.css';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (value: string) => void;
};

// Laid out like a wizard field (label above a bordered control); the FormControl component itself
// reads entity-namespace keys, and these strings live in the workflow namespace.
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className='form-control'>
    <span className='form-control__label'>{label}</span>
    <span className='form-control__field'>{children}</span>
  </label>
);

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
    styles={{ body: { paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 16 } }}>
    <Field label={t('webhook.namePlaceholder')}>
      <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus
        testId='workflow-webhook-create-name' />
    </Field>
    <Field label={t('webhook.typePlaceholder')}>
      {/* antd directly: the Select primitive can't lift its popup above this modal's z-index. */}
      <Select value={type} onChange={setType} className='ant-select-custom'
        options={WEBHOOK_TYPES.map((item) => ({ label: item, value: item }))}
        style={{ width: '100%' }} data-testid='workflow-webhook-create-type'
        getPopupContainer={(trigger) => trigger.parentElement || document.body}
        styles={{ popup: { root: { zIndex: 13030 } } }} />
    </Field>
  </Modal>;
}
