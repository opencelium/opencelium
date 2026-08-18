import type { ComponentProps } from 'react';
import type { WorkflowTemplateDialogs } from '../template/WorkflowTemplateDialogs/WorkflowTemplateDialogs';
import type { ShortcutsDialog } from '../header/ShortcutsDialog/ShortcutsDialog';
import type { AssignCategoryDialog } from '../header/AssignCategoryDialog/AssignCategoryDialog';

export type WorkflowPageDialogsProps = {
	templates: ComponentProps<typeof WorkflowTemplateDialogs>;
	shortcuts: ComponentProps<typeof ShortcutsDialog>;
	category: ComponentProps<typeof AssignCategoryDialog>;
};
