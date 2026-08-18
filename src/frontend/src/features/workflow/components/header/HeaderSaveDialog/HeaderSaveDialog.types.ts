export type HeaderSaveDialogProps = {
	open: boolean;
	value: string;
	onChange: (value: string) => void;
	onClose: () => void;
	onSave: () => void | Promise<void>;
	saveDisabled?: boolean;
};
