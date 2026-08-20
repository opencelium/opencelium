export type NodeToolbarProps = {
	canDelete?: boolean;
	canComment?: boolean;
	canRemoveJoint?: boolean;
	onDelete?: () => void;
	onComment?: () => void;
	onRemoveJoint?: () => void;
};
