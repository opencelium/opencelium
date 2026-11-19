import { WorkflowTemplateDialogs } from '../template/WorkflowTemplateDialogs/WorkflowTemplateDialogs';
import { ShortcutsDialog } from '../header/ShortcutsDialog/ShortcutsDialog';
import { AssignCategoryDialog } from '../header/AssignCategoryDialog/AssignCategoryDialog';
import type { WorkflowPageDialogsProps } from './WorkflowPageDialogs.types';
import { PasteOperatorDialog } from '../header/PasteOperatorDialog/PasteOperatorDialog';
import { WorkflowJsonDialog } from '../header/WorkflowJsonDialog/WorkflowJsonDialog';
import { RunSettingsDialog } from '../header/RunSettingsDialog/RunSettingsDialog';

export const WorkflowPageDialogs = ({ templates, shortcuts,
	category, pasteOperator, jsonEditor, runSettings }: WorkflowPageDialogsProps) => <>
	<WorkflowTemplateDialogs {...templates} />
	<ShortcutsDialog {...shortcuts} />
	<AssignCategoryDialog {...category} />
	<PasteOperatorDialog {...pasteOperator} />
	<WorkflowJsonDialog {...jsonEditor} />
	<RunSettingsDialog {...runSettings} />
</>;
