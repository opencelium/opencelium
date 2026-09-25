export type AssignCategoryDialogProps = {
	open: boolean;
	currentCategoryId: number | null;
	loading: boolean;
	onClose: () => void;
	onAssign: (categoryId: number | null, categoryName: string | null) => void;
};
