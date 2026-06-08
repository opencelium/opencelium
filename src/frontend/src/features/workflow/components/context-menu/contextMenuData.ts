import type { WorkflowNodeMenuItem } from '../../types/workflow.types';

export type MenuSection = { id: string; items: WorkflowNodeMenuItem[] };
export type MenuEntry =
  | { id: string; type: 'action'; item: WorkflowNodeMenuItem; indented?: boolean }
  | { id: string; type: 'label'; labelKey: string };

const operatorMenu: MenuSection[] = [
  {
    id: 'main',
    items: [
      { id: 'change-label', labelKey: 'contextMenu.changeLabel' },
      { id: 'open-config', labelKey: 'contextMenu.openConfiguration' },
      { id: 'configure-aggregator', labelKey: 'contextMenu.configureAggregator' },
    ],
  },
];

export const menuByType: Record<string, MenuSection[]> = {
  connector: [
    { id: 'main', items: [{ id: 'change-label', labelKey: 'contextMenu.changeLabel' }, { id: 'run-call', labelKey: 'contextMenu.runThisCallOnly' }, { id: 'configure-aggregator', labelKey: 'contextMenu.configureAggregator' }] },
    { id: 'request', items: [{ id: 'request', labelKey: 'contextMenu.request' }, { id: 'edit-url', labelKey: 'contextMenu.editUrl' }, { id: 'edit-headers', labelKey: 'contextMenu.editHeader' }, { id: 'edit-body', labelKey: 'contextMenu.editBody' }] },
    { id: 'response', items: [{ id: 'show-response', labelKey: 'contextMenu.showResponse' }] },
  ],
  system: [
    { id: 'main', items: [{ id: 'change-label', labelKey: 'contextMenu.changeLabel' }, { id: 'run-call', labelKey: 'contextMenu.runThisCallOnly' }, { id: 'configure-aggregator', labelKey: 'contextMenu.configureAggregator' }] },
    { id: 'request', items: [{ id: 'request', labelKey: 'contextMenu.request' }] },
  ],
  if: operatorMenu,
  loop: operatorMenu,
};
