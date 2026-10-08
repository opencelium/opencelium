import { Button, Modal } from 'antd';
import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl';
import type { Connector } from '@entities/connector/model/types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ImageTileEditor } from '@shared/ui/wizard-image-editor/ImageTileEditor';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { useConnectorImageActions } from './useConnectorImageActions';
import '../dialogHeader.css';
import './connector-image-dialog.css';

type Props = {
  open: boolean;
  node: WorkflowNodeModel | null;
  connectors: Connector[];
  onClose: () => void;
};

export function ConnectorImageDialog({ open, node, ...rest }: Props) {
  const connectorId = node?.data.connector?.connectorId;
  if (!open || !node || !connectorId) return null;
  return <ConnectorImageDialogContent key={node.id} connectorId={connectorId} {...rest} />;
}

function ConnectorImageDialogContent({ connectorId, connectors, onClose }:
  Omit<Props, 'open' | 'node'> & { connectorId: number }) {
  const { t } = useI18n('workflow');
  const connector = connectors.find((item) => item.connectorId === connectorId);
  // The connector's own image only: the node may be showing its invoker's as a
  // fallback, and that one is not the connector's to replace or delete.
  const ownIcon = typeof connector?.icon === 'string' && connector.icon.trim() ? connector.icon : null;
  const { src, isSaving, hasChanges, stageUpload, stageRemove, save } =
    useConnectorImageActions(connectorId, resolveConnectorIconUrl(ownIcon), onClose);

  return (
    <Modal open onCancel={onClose} width={440} style={{ top: 18 }} destroyOnHidden
      title={t('connectorImageDialog.title')} className="wfDialog"
      closeIcon={<span className="wfDialogClose">×</span>} styles={{ body: { paddingTop: 8 } }}
      footer={<>
        <Button onClick={onClose} disabled={isSaving} data-testid="workflow-connector-image-cancel">{t('actions.cancel')}</Button>
        <Button type="primary" onClick={save} loading={isSaving} disabled={!hasChanges}
          data-testid="workflow-connector-image-save">{t('actions.save')}</Button>
      </>}>
      <div data-testid="workflow-connector-image-dialog">
        <p className="connectorImageDialogIntro">
          {t('connectorImageDialog.intro', { connector: connector?.title ?? '—' })}
        </p>
        <div className="connectorImageDialogTile">
          <ImageTileEditor src={src} isInteractive={!isSaving} isLoading={isSaving}
            i18nPrefix="connector.fields.icon" testIdPrefix="workflow-connector-image"
            onPicked={stageUpload} onDelete={src ? stageRemove : undefined} />
        </div>
      </div>
    </Modal>
  );
}
