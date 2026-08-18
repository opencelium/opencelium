export type QueryCaretTarget = {
	rowId: string;
	field: 'key' | 'value';
	caret: number;
};

export type UrlEditorProps = { readOnly?: boolean };
