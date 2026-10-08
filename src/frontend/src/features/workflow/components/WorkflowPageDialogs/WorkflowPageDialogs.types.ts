import type { ComponentProps } from 'react';
import type { WorkflowTemplateDialogs } from '../template/WorkflowTemplateDialogs/WorkflowTemplateDialogs';
import type { ShortcutsDialog } from '../header/ShortcutsDialog/ShortcutsDialog';
import type { AssignCategoryDialog } from '../header/AssignCategoryDialog/AssignCategoryDialog';
import type { PasteOperatorDialog } from '../header/PasteOperatorDialog/PasteOperatorDialog';
import type { WorkflowJsonDialog } from '../header/WorkflowJsonDialog/WorkflowJsonDialog';

export type WorkflowPageDialogsProps = {
	templates: ComponentProps<typeof WorkflowTemplateDialogs>;
	shortcuts: ComponentProps<typeof ShortcutsDialog>;
	category: ComponentProps<typeof AssignCategoryDialog>;
	pasteOperator: ComponentProps<typeof PasteOperatorDialog>;
	jsonEditor: ComponentProps<typeof WorkflowJsonDialog>;
};
