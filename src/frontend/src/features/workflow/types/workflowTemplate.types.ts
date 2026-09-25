export type WorkflowTemplate = {
	templateId: string | number;
	name?: string;
	description?: string;
	connection?: unknown;
	[key: string]: unknown;
};
