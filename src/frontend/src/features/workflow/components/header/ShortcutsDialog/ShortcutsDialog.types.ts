export type ShortcutsDialogProps = {
	open: boolean;
	onClose: () => void;
};

export type ShortcutGroup = {
	titleKey: string;
	items: { keys: string[]; descKey: string }[];
};
