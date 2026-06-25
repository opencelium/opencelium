import type { WorkflowHeaderMenuItem } from '../../types/workflow.types';

export const headerMenuItems: WorkflowHeaderMenuItem[] = [
  { id: 'download-template', labelKey: 'headerMenu.downloadAsTemplate', section: 'template', keepOpenOnSelect: true },
  { id: 'save-template', labelKey: 'headerMenu.saveAsTemplate', section: 'template' },
  { id: 'load-template', labelKey: 'headerMenu.loadTemplate', section: 'template' },
  { id: 'editor-appearance', labelKey: 'headerMenu.editorAppearance', section: 'editor', disabled: true, badgeKey: 'headerMenu.inDevelopment' },
  { id: 'shortcuts', labelKey: 'headerMenu.shortcuts', section: 'editor' },
  { id: 'exit', labelKey: 'headerMenu.exit', section: 'exit' },
];
