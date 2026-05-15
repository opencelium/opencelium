import type { WorkflowHeaderMenuItem } from '../../types/workflow.types';

export const headerMenuItems: WorkflowHeaderMenuItem[] = [
  { id: 'download-template', label: 'download as template', section: 'template' },
  { id: 'save-template', label: 'save as template', section: 'template' },
  { id: 'load-template', label: 'load template', section: 'template' },
  { id: 'editor-appearance', label: 'editor appearance', section: 'editor' },
  { id: 'shortcuts', label: 'shortcuts', section: 'editor' },
  { id: 'exit', label: 'exit', section: 'exit' },
];
