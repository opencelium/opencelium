import type React from 'react';
import ReactJson from 'react-json-view';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Collapse } from '@shared/ui/primitives/Collapse';
import type { MethodResponse } from '../../../types/connection';

const PatchedReactJson = ReactJson as unknown as React.ComponentType<Record<string, unknown>>;

const JsonValue = ({ value }: { value: unknown }) => {
  const { themeMode } = useTheme();
  return <div className="responseJsonWrap">
    <PatchedReactJson name={false}
      src={(value && typeof value === 'object' ? value : {}) as Record<string, unknown>}
      collapsed={false} enableClipboard={false} displayDataTypes={false}
      displayObjectSize={false} onEdit={false} onAdd={false} onDelete={false}
      theme={themeMode === 'dark' ? 'twilight' : 'rjv-default'}
      style={{ background: 'transparent', fontSize: 13, wordBreak: 'break-word', padding: '4px 0' }} />
  </div>;
};

export function ResponseColumn({ title, response }: { title: string; response?: MethodResponse }) {
  const { t } = useI18n('workflow');
  return <div className="responseColumn">
    <div className="responseColumnTitle">{title}</div>
    <div className="responseStatusField">
      <div className="responseStatusLabel">{t('response.status')}</div>
      <div className="responseStatusValue">{response?.status ?? ''}</div>
    </div>
    <Collapse items={[{ key: 'header', label: t('methodConfig.header'),
      content: <JsonValue value={response?.header ?? {}} /> }]} defaultActiveKeys={[]} />
    <Collapse items={[{ key: 'body', label: t('methodConfig.body'),
      content: <JsonValue value={response?.body?.fields ?? {}} /> }]} defaultActiveKeys={['body']} />
  </div>;
}
