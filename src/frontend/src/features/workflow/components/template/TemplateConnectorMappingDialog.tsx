import { Button, Modal } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Select } from '@shared/ui/primitives/Select';
import type { SelectOption, SelectOptionGroup } from '@shared/ui/primitives/Select/Select.types';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard';
import type { Connector } from '@entities/connector/model/types';
import { useTemplateConnectorMapping } from './useTemplateConnectorMapping';
import type { ConnectorMappingGroup } from './templateConnectorMapping.utils';
import '../dialogHeader.css';
import './template-connector-mapping-dialog.css';

type Props = {
  open: boolean;
  groups: ConnectorMappingGroup[];
  connectors: Connector[];
  onConfirm: (mapping: Record<number, number>) => void;
  onCancel: () => void;
};

const toConnectorOption = (connector: Connector): SelectOption<number> => ({
  value: connector.connectorId,
  label: connector.title,
});

export function TemplateConnectorMappingDialog({ open, groups, connectors, onConfirm, onCancel }: Props) {
  const { t } = useI18n('workflow');
  const {
    mapping,
    creatingForId,
    selectConnector,
    groupedConnectors,
    startCreate,
    cancelCreate,
    handleCreateSubmit,
    isComplete,
  } = useTemplateConnectorMapping({ open, groups, connectors });

  if (!open) return null;

  const handleConfirmClick = () => {
    const complete: Record<number, number> = {};
    groups.forEach((group) => {
      const value = mapping[group.oldConnectorId];
      if (value != null) complete[group.oldConnectorId] = value;
    });
    onConfirm(complete);
  };

  const optionsForGroup = (group: ConnectorMappingGroup): SelectOption<number>[] | SelectOptionGroup<number>[] => {
    const { suggested, rest } = groupedConnectors(group);
    if (suggested.length === 0) return rest.map(toConnectorOption);
    return [
      { label: t('templateConnectorMapping.suggested'), options: suggested.map(toConnectorOption) },
      { label: t('templateConnectorMapping.allConnectors'), options: rest.map(toConnectorOption) },
    ];
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
        creatingForId != null ? (
          <Button onClick={cancelCreate}>{t('actions.back')}</Button>
        ) : (
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
        )
      }
    >
      <div data-testid="workflow-template-connector-mapping-dialog">
        {creatingForId != null ? (
          <EntityWizard
            entityName="connector"
            mode="create"
            onSubmit={handleCreateSubmit}
            skipSuccessState
            hideRecommendations
            hideHeader
          />
        ) : (
          <>
            <p className="templateConnectorMappingIntro">{t('templateConnectorMapping.intro')}</p>
            {groups.map((group) => (
              <div className="templateConnectorMappingRow" key={group.oldConnectorId}>
                <div className="templateConnectorMappingRowInfo">
                  <span className="templateConnectorMappingRowTitle">{group.templateTitle}</span>
                  <span className="templateConnectorMappingRowMeta">
                    {group.invokerName
                      ? t('templateConnectorMapping.invokerHint', { invoker: group.invokerName })
                      : t('templateConnectorMapping.noInvokerHint')}
                    {' · '}
                    {t('templateConnectorMapping.usedBy', { methods: group.methodNames.join(', ') })}
                  </span>
                </div>
                <div className="templateConnectorMappingRowSelect">
                  <Select
                    value={mapping[group.oldConnectorId]}
                    options={optionsForGroup(group)}
                    placeholder={t('templateConnectorMapping.selectPlaceholder')}
                    onChange={(value) => selectConnector(group.oldConnectorId, value)}
                    testId={`workflow-template-connector-mapping-select-${group.oldConnectorId}`}
                  />
                </div>
                <Tooltip content={t('templateConnectorMapping.createNewTooltip')}>
                  <IconButton
                    iconProps={{ name: 'plus' }}
                    onClick={() => startCreate(group.oldConnectorId)}
                    testId={`workflow-template-connector-mapping-create-${group.oldConnectorId}`}
                  />
                </Tooltip>
              </div>
            ))}
          </>
        )}
      </div>
    </Modal>
  );
}
