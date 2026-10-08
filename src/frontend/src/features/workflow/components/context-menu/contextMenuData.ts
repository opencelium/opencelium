import type { WorkflowNodeMenuItem } from '../../types/workflow.types';

export type MenuSection = { id: string; items: WorkflowNodeMenuItem[] };
export type MenuEntry =
  | { id: string; type: 'action'; item: WorkflowNodeMenuItem; indented?: boolean }
  | { id: string; type: 'label'; labelKey: string };

const operatorMenu: MenuSection[] = [
  {
    id: 'main',
    items: [
      { id: 'open-config', labelKey: 'contextMenu.openConfiguration' },
      { id: 'configure-aggregator', labelKey: 'contextMenu.configureAggregator' },
    ],
  },
];

const changeLabelItem: WorkflowNodeMenuItem = { id: 'change-label', labelKey: 'contextMenu.changeLabel' };
const changeConnectorItem: WorkflowNodeMenuItem = { id: 'change-connector', labelKey: 'contextMenu.changeConnector' };
const connectorImageItem: WorkflowNodeMenuItem = { id: 'change-connector-image', labelKey: 'contextMenu.changeConnectorImage' };
const configureAggregatorItem: WorkflowNodeMenuItem = { id: 'configure-aggregator', labelKey: 'contextMenu.configureAggregator' };

const requestSections: MenuSection[] = [
  { id: 'request', items: [{ id: 'request', labelKey: 'contextMenu.request' }, { id: 'edit-url', labelKey: 'contextMenu.editUrl' }, { id: 'edit-headers', labelKey: 'contextMenu.editHeader' }, { id: 'edit-body', labelKey: 'contextMenu.editBody' }] },
  { id: 'response', items: [{ id: 'show-response', labelKey: 'contextMenu.showResponse' }] },
];

// Only a connector node draws its connector's image; a system node shows a globe.
const connectorMenu: MenuSection[] = [
  { id: 'main', items: [changeLabelItem, changeConnectorItem, connectorImageItem, configureAggregatorItem] },
  ...requestSections,
];

const systemMenu: MenuSection[] = [
  { id: 'main', items: [changeLabelItem, changeConnectorItem, configureAggregatorItem] },
  ...requestSections,
];

// A trigger-connection node calls another workflow's webhook — it has no connector to swap.
const triggerConnectionMenu: MenuSection[] = [
  { id: 'main', items: [changeLabelItem, configureAggregatorItem] },
  ...requestSections,
];

export const menuByType: Record<string, MenuSection[]> = {
  connector: connectorMenu,
  system: systemMenu,
  'trigger-connection': triggerConnectionMenu,
  if: operatorMenu,
  loop: operatorMenu,
};
