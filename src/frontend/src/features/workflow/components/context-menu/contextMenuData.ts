import type { WorkflowNodeMenuItem } from '../../types/workflow.types';

export type MenuSection = { id: string; items: WorkflowNodeMenuItem[] };
export type MenuEntry =
  | { id: string; type: 'action'; item: WorkflowNodeMenuItem; indented?: boolean }
  | { id: string; type: 'label'; label: string };

const operatorMenu: MenuSection[] = [
  {
    id: 'main',
    items: [
      { id: 'change-label', label: 'Change Label' },
      { id: 'open-config', label: 'Open Configuration' },
      { id: 'configure-aggregator', label: 'Configure Aggregator' },
    ],
  },
];

export const menuByType: Record<string, MenuSection[]> = {
  connector: [
    { id: 'main', items: [{ id: 'change-label', label: 'Change Label' }, { id: 'run-call', label: 'Run This Call Only' }, { id: 'configure-aggregator', label: 'Configure Aggregator' }] },
    { id: 'request', items: [{ id: 'request', label: 'Request' }, { id: 'edit-url', label: 'Edit URL' }, { id: 'edit-headers', label: 'Edit Header' }, { id: 'edit-body', label: 'Edit Body' }] },
    { id: 'response', items: [{ id: 'show-response', label: 'Show Response' }] },
  ],
  system: [
    { id: 'main', items: [{ id: 'change-label', label: 'Change Label' }, { id: 'run-call', label: 'Run This Call Only' }, { id: 'configure-aggregator', label: 'Configure Aggregator' }] },
    { id: 'request', items: [{ id: 'request', label: 'Request' }] },
  ],
  if: operatorMenu,
  loop: operatorMenu,
};
