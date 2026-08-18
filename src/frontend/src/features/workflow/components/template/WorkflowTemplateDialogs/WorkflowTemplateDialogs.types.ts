import type { ComponentProps } from 'react';
import type { SaveConnectionTemplateDialog } from '../SaveConnectionTemplateDialog/SaveConnectionTemplateDialog';
import type { LoadConnectionTemplateDialog } from '../LoadConnectionTemplateDialog/LoadConnectionTemplateDialog';
import type { TemplateConnectorMappingDialog } from '../TemplateConnectorMappingDialog/TemplateConnectorMappingDialog';

export type WorkflowTemplateDialogsProps = {
	save: ComponentProps<typeof SaveConnectionTemplateDialog>;
	load: ComponentProps<typeof LoadConnectionTemplateDialog>;
	mapping: ComponentProps<typeof TemplateConnectorMappingDialog>;
};
