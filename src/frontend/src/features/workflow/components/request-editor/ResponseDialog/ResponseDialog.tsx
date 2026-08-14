import { Button, Modal } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ResponseDialogProps } from './ResponseDialog.types';
import { ResponseColumn } from './ResponseColumn';
import '../../dialogHeader.css';
import './ResponseDialog.css';

export function ResponseDialog({ open, node, onClose }: ResponseDialogProps) {
  const { t } = useI18n('workflow');

  if (!open || !node) return null;

  const config = node.data.methodConfig;
  const response = config?.response;
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
        <ResponseColumn title={t('response.success')} response={response?.success} />
        <ResponseColumn title={t('response.fail')} response={response?.fail} />
      </div>
    </Modal>
  );
}
