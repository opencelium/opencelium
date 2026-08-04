import type { RefObject } from 'react';

export type ContextMenuEditorProps = {
	inputRef: RefObject<HTMLInputElement | null>;
	value: string;
	onChange: (value: string) => void;
	onCancel: () => void;
	onSave: () => void;
};
