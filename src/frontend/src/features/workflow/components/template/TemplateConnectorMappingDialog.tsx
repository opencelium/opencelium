import { Button, Modal } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Select } from '@shared/ui/primitives/Select';
import type { SelectOption } from '@shared/ui/primitives/Select/Select.types';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard';
import { useDialog } from '@shared/ui/dialog/useDialog';
import type { Connector } from '@entities/connector/model/types';
import type { Invoker } from '@entities/invoker/model/types';
import { useTemplateConnectorMapping } from './useTemplateConnectorMapping';
import type { ConnectorMappingGroup } from './templateConnectorMapping.utils';
import '../dialogHeader.css';
import './template-connector-mapping-dialog.css';

type Props = {
  open: boolean;
  groups: ConnectorMappingGroup[];
  connectors: Connector[];
  invokers: Invoker[];
  onConfirm: (mapping: Record<number, number>) => void;
  onCancel: () => void;
};

const toConnectorOption = (connector: Connector): SelectOption<number> => ({
  value: connector.connectorId,
  label: connector.title,
});

// method.connector.title from the template is almost always the normalizer's own
// 'DEFAULT' placeholder (see connectionPayload.ts), so it's never a meaningful label —
// prefer the real template title when it's not that placeholder.
const groupFallbackTitle = (group: ConnectorMappingGroup) =>
  group.templateTitle && group.templateTitle !== 'DEFAULT' ? group.templateTitle : null;

export function TemplateConnectorMappingDialog({ open, groups, connectors, invokers, onConfirm, onCancel }: Props) {
  const { t } = useI18n('workflow');
  const dialog = useDialog();
  const {
    mapping,
    selectConnector,
    suggestedConnectors,
    createConnectorForGroup,
    isComplete,
  } = useTemplateConnectorMapping({ open, groups, connectors, invokers });

  if (!open) return null;

  const handleConfirmClick = () => {
    const complete: Record<number, number> = {};
    groups.forEach((group) => {
      const value = mapping[group.oldConnectorId];
      if (value != null) complete[group.oldConnectorId] = value;
    });
    onConfirm(complete);
  };

  const openCreateConnectorDialog = (oldConnectorId: number) => {
    const id = dialog.open({
      width: 1000,
      top: 18,
      testId: `workflow-template-connector-mapping-create-dialog-${oldConnectorId}`,
      content: (
        <EntityWizard
          entityName="connector"
          mode="create"
          skipSuccessState
          onSubmit={async (data) => {
            await createConnectorForGroup(oldConnectorId, data);
            dialog.closeById(id);
          }}
        />
      ),
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      width={720}
      style={{ top: 18 }}
      destroyOnHidden
      title={t('templateConnectorMapping.title')}
      className="wfDialog"
      closeIcon={<span className="wfDialogClose">×</span>}
      styles={{ body: { paddingTop: 8 } }}
      footer={
        <>
          <Button onClick={onCancel}>{t('actions.cancel')}</Button>
          <Button
            type="primary"
            disabled={!isComplete}
            onClick={handleConfirmClick}
            data-testid="workflow-template-connector-mapping-confirm"
          >
            {t('actions.confirm')}
          </Button>
        </>
      }
    >
      <div data-testid="workflow-template-connector-mapping-dialog">
        <p className="templateConnectorMappingIntro">{t('templateConnectorMapping.intro')}</p>
        {groups.map((group) => (
          <div className="templateConnectorMappingRow" key={group.oldConnectorId}>
            <div className="templateConnectorMappingRowInfo">
              <span className="templateConnectorMappingRowTitle">
                {group.invokerName
                  ?? groupFallbackTitle(group)
                  ?? t('templateConnectorMapping.unknownConnector', { id: group.oldConnectorId })}
              </span>
              <span className="templateConnectorMappingRowMeta">
                {!group.invokerName && (
                  <>
                    {t('templateConnectorMapping.noInvokerHint')}
                    {' · '}
                  </>
                )}
                {t('templateConnectorMapping.usedBy', { methods: group.methodNames.join(', ') })}
              </span>
            </div>
            <div className="templateConnectorMappingRowSelect">
              <Select
                value={mapping[group.oldConnectorId]}
                options={suggestedConnectors(group).map(toConnectorOption)}
                placeholder={t('templateConnectorMapping.selectPlaceholder')}
                onChange={(value) => selectConnector(group.oldConnectorId, value)}
                testId={`workflow-template-connector-mapping-select-${group.oldConnectorId}`}
              />
            </div>
            <Tooltip content={t('templateConnectorMapping.createNewTooltip')}>
              <IconButton
                iconProps={{ name: 'plus' }}
                onClick={() => openCreateConnectorDialog(group.oldConnectorId)}
                testId={`workflow-template-connector-mapping-create-${group.oldConnectorId}`}
              />
            </Tooltip>
          </div>
        ))}
      </div>
    </Modal>
  );
}
