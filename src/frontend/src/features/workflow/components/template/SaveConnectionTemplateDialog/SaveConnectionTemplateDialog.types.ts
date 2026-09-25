export type SaveConnectionTemplateDialogProps = {
	open: boolean;
	name: string;
	description: string;
	nameError: string;
	loading: boolean;
	onNameChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onClearNameError: () => void;
	onClose: () => void;
	onSave: () => void;
};
