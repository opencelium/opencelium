import { SaveConnectionTemplateDialog } from '../SaveConnectionTemplateDialog/SaveConnectionTemplateDialog';
import { LoadConnectionTemplateDialog } from '../LoadConnectionTemplateDialog/LoadConnectionTemplateDialog';
import { TemplateConnectorMappingDialog } from '../TemplateConnectorMappingDialog/TemplateConnectorMappingDialog';
import type { WorkflowTemplateDialogsProps } from './WorkflowTemplateDialogs.types';

export const WorkflowTemplateDialogs = ({ save, load,
	mapping }: WorkflowTemplateDialogsProps) => <>
	<SaveConnectionTemplateDialog {...save} />
	<LoadConnectionTemplateDialog {...load} />
	<TemplateConnectorMappingDialog {...mapping} />
</>;
