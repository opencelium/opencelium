import { useState } from 'react';
import { Button, Modal } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Select } from '@shared/ui/primitives/Select';
import type { Connector } from '@entities/connector/model/types';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import '../dialogHeader.css';
import './change-connector-dialog.css';

type Props = {
  open: boolean;
  node: WorkflowNodeModel | null;
  connectors: Connector[];
  onClose: () => void;
  onChange: (nodeId: string, connector: Connector) => void;
};

const connectorsWithSameInvoker = (connectors: Connector[], invokerName: string | null | undefined) => {
  const name = invokerName?.toLowerCase();
  return name ? connectors.filter((connector) => connector.invoker?.name?.toLowerCase() === name) : [];
};

export function ChangeConnectorDialog({ open, node, ...rest }: Props) {
  if (!open || !node) return null;
  return <ChangeConnectorDialogContent key={node.id} node={node} {...rest} />;
}

function ChangeConnectorDialogContent({ node, connectors, onClose, onChange }:
  Omit<Props, 'open' | 'node'> & { node: WorkflowNodeModel }) {
  const { t } = useI18n('workflow');
  const currentConnectorId = node.data.connector?.connectorId;
  const [selectedId, setSelectedId] = useState<number | undefined>(currentConnectorId);

  const invokerName = node.data.connector?.invokerName;
  const options = connectorsWithSameInvoker(connectors, invokerName)
    .map((connector) => ({ value: connector.connectorId, label: connector.title }));
  const selectedConnector = connectors.find((connector) => connector.connectorId === selectedId);

  return (
    <Modal open onCancel={onClose} width={560} style={{ top: 18 }} destroyOnHidden
      title={t('changeConnectorDialog.title')} className="wfDialog"
      closeIcon={<span className="wfDialogClose">×</span>} styles={{ body: { paddingTop: 8 } }}
      footer={<>
        <Button onClick={onClose} data-testid="workflow-change-connector-cancel">{t('actions.cancel')}</Button>
        <Button type="primary" data-testid="workflow-change-connector-submit"
          disabled={!selectedConnector || selectedId === currentConnectorId}
          onClick={() => selectedConnector && onChange(node.id, selectedConnector)}>
          {t('changeConnectorDialog.change')}
        </Button>
      </>}>
      <div data-testid="workflow-change-connector-dialog">
        <p className="changeConnectorDialogIntro">
          {t('changeConnectorDialog.intro', { invoker: invokerName ?? '—' })}
        </p>
        <Select value={selectedId} options={options}
          placeholder={t('changeConnectorDialog.selectPlaceholder')}
          onChange={(value) => setSelectedId(value)}
          testId="workflow-change-connector-select" />
      </div>
    </Modal>
  );
}
