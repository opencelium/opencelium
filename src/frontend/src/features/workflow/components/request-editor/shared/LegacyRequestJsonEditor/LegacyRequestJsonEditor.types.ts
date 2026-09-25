export type LegacyRequestJsonEditorProps = {
	messageProperty: 'body' | 'header';
	source: Record<string, unknown>;
	readOnly?: boolean;
};

export type JsonExtensionComponent = {
	id: string;
	self?: { current: Record<string, unknown> };
	getComponent: (params: Record<string, unknown>) => React.ReactNode;
};
