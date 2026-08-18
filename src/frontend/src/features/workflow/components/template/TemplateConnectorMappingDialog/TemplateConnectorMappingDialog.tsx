import { Button, Modal } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard';
import { useDialog } from '@shared/ui/dialog/useDialog';
import { useTemplateConnectorMapping } from '../useTemplateConnectorMapping';
import { TemplateConnectorMappingRow } from '../TemplateConnectorMappingRow/TemplateConnectorMappingRow';
import type { TemplateConnectorMappingDialogProps } from './TemplateConnectorMappingDialog.types';
import '../../dialogHeader.css';
import './TemplateConnectorMappingDialog.css';

export function TemplateConnectorMappingDialog({ open, groups, connectors, invokers,
  onConfirm, onCancel }: TemplateConnectorMappingDialogProps) {
  const { t } = useI18n('workflow');
  const dialog = useDialog();
  const state = useTemplateConnectorMapping({ open, groups, connectors, invokers });
  if (!open) return null;

  const confirm = () => onConfirm(Object.fromEntries(groups.flatMap((group) => {
    const value = state.mapping[group.oldConnectorId];
    return value == null ? [] : [[group.oldConnectorId, value]];
  })));
  const createConnector = (oldConnectorId: number) => {
    const id = dialog.open({ width: 1000, top: 18,
      testId: `workflow-template-connector-mapping-create-dialog-${oldConnectorId}`,
      content: <EntityWizard entityName="connector" mode="create" skipSuccessState
        onSubmit={async (data) => {
          await state.createConnectorForGroup(oldConnectorId, data);
          dialog.closeById(id);
        }} /> });
  };

  return <Modal open={open} onCancel={onCancel} width={720} style={{ top: 18 }} destroyOnHidden
    title={t('templateConnectorMapping.title')} className="wfDialog"
    closeIcon={<span className="wfDialogClose">×</span>} styles={{ body: { paddingTop: 8 } }}
    footer={<><Button onClick={onCancel}>{t('actions.cancel')}</Button>
      <Button type="primary" disabled={!state.isComplete} onClick={confirm}
        data-testid="workflow-template-connector-mapping-confirm">{t('actions.confirm')}</Button></>}>
    <div data-testid="workflow-template-connector-mapping-dialog">
      <p className="templateConnectorMappingIntro">{t('templateConnectorMapping.intro')}</p>
      {groups.map((group) => <TemplateConnectorMappingRow key={group.oldConnectorId} group={group}
        value={state.mapping[group.oldConnectorId]} connectors={state.suggestedConnectors(group)}
        unknownLabel={t('templateConnectorMapping.unknownConnector', { id: group.oldConnectorId })}
        noInvokerHint={t('templateConnectorMapping.noInvokerHint')}
        usedByLabel={t('templateConnectorMapping.usedBy', { methods: group.methodNames.join(', ') })}
        selectPlaceholder={t('templateConnectorMapping.selectPlaceholder')}
        createTooltip={t('templateConnectorMapping.createNewTooltip')}
        onChange={(value) => state.selectConnector(group.oldConnectorId, value)}
        onCreate={() => createConnector(group.oldConnectorId)} />)}
    </div>
  </Modal>;
}
