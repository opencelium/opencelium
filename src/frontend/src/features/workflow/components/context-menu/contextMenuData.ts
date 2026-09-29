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
const configureAggregatorItem: WorkflowNodeMenuItem = { id: 'configure-aggregator', labelKey: 'contextMenu.configureAggregator' };

const requestSections: MenuSection[] = [
  { id: 'request', items: [{ id: 'request', labelKey: 'contextMenu.request' }, { id: 'edit-url', labelKey: 'contextMenu.editUrl' }, { id: 'edit-headers', labelKey: 'contextMenu.editHeader' }, { id: 'edit-body', labelKey: 'contextMenu.editBody' }] },
  { id: 'response', items: [{ id: 'show-response', labelKey: 'contextMenu.showResponse' }] },
];

const methodMenu: MenuSection[] = [
  { id: 'main', items: [changeLabelItem, changeConnectorItem, configureAggregatorItem] },
  ...requestSections,
];

// A trigger-connection node calls another workflow's webhook — it has no connector to swap.
const triggerConnectionMenu: MenuSection[] = [
  { id: 'main', items: [changeLabelItem, configureAggregatorItem] },
  ...requestSections,
];

export const menuByType: Record<string, MenuSection[]> = {
  connector: methodMenu,
  system: methodMenu,
  'trigger-connection': triggerConnectionMenu,
  if: operatorMenu,
  loop: operatorMenu,
};
