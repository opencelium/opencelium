import type React from 'react';
import { Button, Modal } from 'antd';
import ReactJson from 'react-json-view';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Collapse } from '@shared/ui/primitives/Collapse';
import type { CollapseItem } from '@shared/ui/primitives/Collapse/Collapse.types';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import type { MethodResponse } from '../../types/connection';
import '../dialogHeader.css';
import './response-dialog.css';

type Props = {
  open: boolean;
  node: WorkflowNodeModel | null;
  onClose: () => void;
};

const PatchedReactJson = ReactJson as unknown as React.ComponentType<Record<string, unknown>>;

export function ResponseDialog({ open, node, onClose }: Props) {
  const { t } = useI18n('workflow');
  const { themeMode } = useTheme();

  if (!open || !node) return null;

  const config = node.data.methodConfig;
  const method = (config?.method || 'GET').toUpperCase();
  const url = config?.url ?? '';
  const response = config?.response;
  const rjvTheme = themeMode === 'dark' ? 'twilight' : 'rjv-default';

  const renderJson = (src: unknown) => (
    <div className="responseJsonWrap">
      <PatchedReactJson
        name={false}
        src={(src && typeof src === 'object' ? src : {}) as Record<string, unknown>}
        collapsed={false}
        enableClipboard={false}
        displayDataTypes={false}
        displayObjectSize={false}
        onEdit={false}
        onAdd={false}
        onDelete={false}
        theme={rjvTheme}
        style={{ background: 'transparent', fontSize: 13, wordBreak: 'break-word', padding: '4px 0' }}
      />
    </div>
  );

  const headerItems = (result?: MethodResponse): CollapseItem[] => [
    { key: 'header', label: t('methodConfig.header'), content: renderJson(result?.header ?? {}) },
  ];
  const bodyItems = (result?: MethodResponse): CollapseItem[] => [
    { key: 'body', label: t('methodConfig.body'), content: renderJson(result?.body?.fields ?? {}) },
  ];

  const column = (title: string, result?: MethodResponse) => (
    <div className="responseColumn">
      <div className="responseColumnTitle">{title}</div>
      <div className="responseUrlLine">
        <span className="responseMethod">{method}</span>
        <span className="responseUrl">{url}</span>
      </div>
      <Collapse items={headerItems(result)} defaultActiveKeys={[]} />
      <Collapse items={bodyItems(result)} defaultActiveKeys={['body']} />
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width="94vw"
      style={{ top: 18 }}
      destroyOnHidden
      title={t('methodConfig.response')}
      className="wfDialog"
      closeIcon={<span className="wfDialogClose">×</span>}
      styles={{ body: { paddingTop: 8, height: 'calc(100vh - 191px)', overflow: 'auto' } }}
      footer={[
        <Button key="close" type="primary" onClick={onClose} data-testid="workflow-response-dialog-close">
          {t('actions.close')}
        </Button>,
      ]}
    >
      <div className="responseColumns" data-testid="workflow-response-dialog">
        {column(t('response.success'), response?.success)}
        {column(t('response.fail'), response?.fail)}
      </div>
    </Modal>
  );
}
