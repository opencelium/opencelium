export type NodeToolbarProps = {
	canDelete?: boolean;
	canComment?: boolean;
	canAddJoint?: boolean;
	canRemoveJoint?: boolean;
	onDelete?: () => void;
	onComment?: () => void;
	onAddJoint?: () => void;
	onRemoveJoint?: () => void;
};
