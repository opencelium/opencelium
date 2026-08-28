import { WorkflowTemplateDialogs } from '../template/WorkflowTemplateDialogs/WorkflowTemplateDialogs';
import { ShortcutsDialog } from '../header/ShortcutsDialog/ShortcutsDialog';
import { AssignCategoryDialog } from '../header/AssignCategoryDialog/AssignCategoryDialog';
import type { WorkflowPageDialogsProps } from './WorkflowPageDialogs.types';
import { PasteOperatorDialog } from '../header/PasteOperatorDialog/PasteOperatorDialog';

export const WorkflowPageDialogs = ({ templates, shortcuts,
	category, pasteOperator }: WorkflowPageDialogsProps) => <>
	<WorkflowTemplateDialogs {...templates} />
	<ShortcutsDialog {...shortcuts} />
	<AssignCategoryDialog {...category} />
	<PasteOperatorDialog {...pasteOperator} />
</>;
