import { Button, Modal } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Select } from '@shared/ui/primitives/Select';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { useAggregatorConfigDialog } from './useAggregatorConfigDialog';
import '../dialogHeader.css';
import './aggregator-config-dialog.css';

type Props = {
  open: boolean;
  node: WorkflowNodeModel | null;
  onClose: () => void;
  onSave: (nodeId: string, dataAggregator: number | null) => void;
};

export function AggregatorConfigDialog({ open, node, onClose, onSave }: Props) {
  const { t } = useI18n('workflow');
  const confirm = useConfirm();
  const assignedId = node?.data.dataAggregator ?? null;
  const {
    aggregators,
    isLoadingAggregators,
    isCreating,
    selectedId,
    selectedAggregator,
    updateInitialValues,
    startCreate,
    selectExisting,
    handleCreateSubmit,
    handleUpdateSubmit,
  } = useAggregatorConfigDialog({ open, assignedId });

  if (!open || !node) return null;

  const options = aggregators.map((aggregator) => ({ value: String(aggregator.id), label: aggregator.name }));

  const handleSelectClick = () => {
    if (!selectedAggregator) return;
    onSave(node.id, selectedAggregator.id);
  };

  const handleDeleteClick = async () => {
    const confirmed = await confirm({
      title: t('aggregatorDialog.confirmUnassign.title'),
      message: t('aggregatorDialog.confirmUnassign.message'),
      confirmText: t('actions.delete'),
      cancelText: t('actions.cancel'),
      confirmVariant: 'solid',
    });
    if (!confirmed) return;
    onSave(node.id, null);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1000}
      style={{ top: 18 }}
      destroyOnHidden
      title={t('aggregatorDialog.title')}
      className="wfDialog"
      closeIcon={<span className="wfDialogClose">×</span>}
      styles={{ body: { paddingTop: 8 } }}
      footer={null}
    >
      <div className="aggregatorDialogHeader" data-testid="workflow-aggregator-dialog">
        <div className="aggregatorDialogSelect">
          <Select
            value={selectedId !== null ? String(selectedId) : undefined}
            options={options}
            isLoading={isLoadingAggregators}
            placeholder={t('aggregatorDialog.selectPlaceholder')}
            onChange={(value) => selectExisting(Number(value))}
            testId="workflow-aggregator-select-input"
          />
        </div>
        <Tooltip content={t('aggregatorDialog.createNewTooltip')}>
          <IconButton
            iconProps={{ name: 'plus' }}
            onClick={startCreate}
            testId="workflow-aggregator-create-new"
          />
        </Tooltip>
        <Button
          type="primary"
          disabled={!selectedAggregator || isCreating}
          onClick={handleSelectClick}
          data-testid="workflow-aggregator-select"
        >
          {t('actions.select')}
        </Button>
        {assignedId != null && (
          <Button danger onClick={handleDeleteClick} data-testid="workflow-aggregator-delete">
            {t('actions.delete')}
          </Button>
        )}
      </div>
      {isCreating ? (
        <EntityWizard
          entityName="data-aggregator"
          mode="create"
          onSubmit={handleCreateSubmit}
          skipSuccessState
          hideRecommendations
          hideHeader
        />
      ) : selectedAggregator ? (
        <EntityWizard
          key={selectedAggregator.id}
          entityName="data-aggregator"
          mode="update"
          initialValues={updateInitialValues}
          onSubmit={handleUpdateSubmit}
          skipSuccessState
          hideRecommendations
          hideHeader
        />
      ) : (
        <div className="aggregatorDialogEmpty">{t('aggregatorDialog.emptyState')}</div>
      )}
    </Modal>
  );
}
