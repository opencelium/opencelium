import { PlusOutlined, UserOutlined, FontSizeOutlined } from '@ant-design/icons';
import { Input, Modal, Select } from 'antd';
import { useMemo, useState } from 'react';
import { createWebhookOption, getWebhookOptions, type WebhookType, upsertWebhookOption, WEBHOOK_TYPES } from './bodyWebhook';
import './bodyLegacy.css';

type Props = {
  value?: string;
  onChange: (value?: string) => void;
};

export function LegacyWebhookReferenceSelect({ value, onChange }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<WebhookType | undefined>();
  const options = useMemo(() => getWebhookOptions(), [isModalOpen, value]);
  const selected = value
    ? options.find((item) => item.value === value) ||
      createWebhookOption(value.split(':')[0] || value, (value.split(':')[1] as WebhookType) || 'string')
    : undefined;

  return (
    <>
      <Select
        placeholder='Select Webhook...'
        value={selected?.value}
        onChange={onChange}
        options={options.map((item) => ({ label: item.label, value: item.value }))}
        className='bodyLegacyWebhookSelect'
        showSearch
        optionFilterProp='label'
        getPopupContainer={() => document.body}
        styles={{ popup: { root: { zIndex: 13010 } } }}
        notFoundContent='No webhooks yet'
        popupRender={(menu) => (
          <>
            <button
              type='button'
              className='bodyLegacyWebhookCreate'
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsModalOpen(true)}
            >
              <span>Create new</span>
              <span className='bodyLegacyWebhookCreatePlus'>
                <PlusOutlined />
              </span>
            </button>
            {menu}
          </>
        )}
      />
      <Modal
        open={isModalOpen}
        title='Add Webhook'
        zIndex={13020}
        rootClassName='bodyLegacyWebhookModalRoot'
        closeIcon={null}
        onCancel={() => {
          setIsModalOpen(false);
          setName('');
          setType(undefined);
        }}
        onOk={() => {
          if (!(name.trim() && type)) return;
          const webhook = upsertWebhookOption(name.trim(), type);
          onChange(webhook.value);
          setIsModalOpen(false);
          setName('');
          setType(undefined);
        }}
        okButtonProps={{ disabled: !(name.trim() && type) }}
        styles={{ body: { paddingTop: 12 } }}
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder='Name'
          prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
          variant='borderless'
          className='bodyLegacyWebhookModalInput'
        />
        <Select
          placeholder='Type'
          value={type}
          onChange={setType}
          options={WEBHOOK_TYPES.map((item) => ({ label: item, value: item }))}
          style={{ width: '100%', marginTop: 12 }}
          prefix={<FontSizeOutlined style={{ color: '#bfbfbf' }} />}
          variant='borderless'
          className='bodyLegacyWebhookModalSelect'
          getPopupContainer={(trigger) => trigger.parentElement || document.body}
          styles={{ popup: { root: { zIndex: 13030 } } }}
        />
      </Modal>
    </>
  );
}
