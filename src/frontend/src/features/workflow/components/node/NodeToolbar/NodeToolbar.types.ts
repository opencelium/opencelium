export type NodeToolbarProps = {
	canDelete?: boolean;
	canComment?: boolean;
	canAddJoint?: boolean;
	canRemoveJoint?: boolean;
	/** Offered but greyed out: no method can be this node's joint target. */
	isAddJointDisabled?: boolean;
	onDelete?: () => void;
	onComment?: () => void;
	onAddJoint?: () => void;
	onRemoveJoint?: () => void;
};
