import { WorkflowTemplateDialogs } from '../template/WorkflowTemplateDialogs/WorkflowTemplateDialogs';
import { ShortcutsDialog } from '../header/ShortcutsDialog/ShortcutsDialog';
import { AssignCategoryDialog } from '../header/AssignCategoryDialog/AssignCategoryDialog';
import type { WorkflowPageDialogsProps } from './WorkflowPageDialogs.types';

export const WorkflowPageDialogs = ({ templates, shortcuts,
	category }: WorkflowPageDialogsProps) => <>
	<WorkflowTemplateDialogs {...templates} />
	<ShortcutsDialog {...shortcuts} />
	<AssignCategoryDialog {...category} />
</>;
