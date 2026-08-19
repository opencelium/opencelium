export type RequestMessageProperty = 'body' | 'header';

export type RequestObjectEditorProps = {
	messageProperty: RequestMessageProperty;
	source: Record<string, unknown>;
};
