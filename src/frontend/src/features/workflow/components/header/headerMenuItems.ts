import type { WorkflowHeaderMenuItem } from '../../types/workflow.types';

export const headerMenuItems: WorkflowHeaderMenuItem[] = [
  { id: 'version-history', labelKey: 'headerMenu.versionHistory', section: 'history' },
  { id: 'download-template', labelKey: 'headerMenu.downloadAsTemplate', section: 'template', keepOpenOnSelect: true },
  { id: 'save-template', labelKey: 'headerMenu.saveAsTemplate', section: 'template' },
  { id: 'load-template', labelKey: 'headerMenu.loadTemplate', section: 'template' },
  { id: 'shortcuts', labelKey: 'headerMenu.shortcuts', section: 'shortcuts' },
  { id: 'exit', labelKey: 'headerMenu.exit', section: 'exit' },
];
