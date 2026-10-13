export type JsonEditorError = { message: string; path?: string };

export type JsonEditorValidation<T> =
	| { success: true; data: T }
	| { success: false; errors: JsonEditorError[] };

export type JsonEditorValidate<T> = (draft: Record<string, unknown>) => JsonEditorValidation<T>;

export type JsonEditorConfirmCopy = { title: string; message: string };

export type JsonEditorDialogProps<T> = {
	open: boolean;
	readOnly: boolean;
	title: string;
	/** Prefix for every `data-testid` inside the dialog, e.g. `workflow-json`. */
	testId: string;
	value: Record<string, unknown>;
	validate: JsonEditorValidate<T>;
	applyConfirm: JsonEditorConfirmCopy;
	isApplying?: boolean;
	onClose: () => void;
	onApply: (value: T) => void;
	/** Omit to hide the "Force apply" button, which applies a syntactically valid draft that failed validation. */
	forceApply?: {
		confirm: JsonEditorConfirmCopy;
		onApply: (value: Record<string, unknown>) => void;
	};
};
