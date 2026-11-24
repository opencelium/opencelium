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

/** The patched react-json-view hands a string to this component when `matches` accepts it. */
export type JsonGlobalComponent = JsonExtensionComponent & {
	matches: (value: unknown) => boolean;
};
