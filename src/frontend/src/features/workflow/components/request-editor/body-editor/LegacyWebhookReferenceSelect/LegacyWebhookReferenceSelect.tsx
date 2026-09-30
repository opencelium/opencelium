import { PlusOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import { useMemo, useState } from 'react';
import { createWebhookOption, getWebhookOptions, type WebhookType } from '../bodyWebhook';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { LegacyWebhookReferenceSelectProps } from './LegacyWebhookReferenceSelect.types';
import { CreateWebhookModal } from './CreateWebhookModal';
import '../bodyLegacy.css';

export function LegacyWebhookReferenceSelect({ value, popupZIndex, onChange }: LegacyWebhookReferenceSelectProps) {
  const { t } = useI18n('workflow');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const options = useMemo(() => getWebhookOptions(), [isModalOpen, value]);
  const selected = value
    ? options.find((item) => item.value === value) ||
      createWebhookOption(value.split(':')[0] || value, (value.split(':')[1] as WebhookType) || 'string')
    : undefined;

  return (
    <>
      <Select
        placeholder={t('placeholders.selectWebhook')}
        value={selected?.value}
        onChange={onChange}
        options={options.map((item) => ({ label: item.label, value: item.value }))}
        className='bodyLegacyWebhookSelect'
        showSearch
        optionFilterProp='label'
        getPopupContainer={() => document.body}
        styles={{ popup: { root: { zIndex: popupZIndex ?? 13010 } } }}
        notFoundContent={t('webhook.noWebhooks')}
        popupRender={(menu) => (
          <>
            <button
              type='button'
              className='bodyLegacyWebhookCreate'
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsModalOpen(true)}
            >
              <span>{t('actions.createNew')}</span>
              <span className='bodyLegacyWebhookCreatePlus'>
                <PlusOutlined />
              </span>
            </button>
            {menu}
          </>
        )}
      />
      <CreateWebhookModal open={isModalOpen} onClose={() => setIsModalOpen(false)}
        onCreate={onChange} />
    </>
  );
}
