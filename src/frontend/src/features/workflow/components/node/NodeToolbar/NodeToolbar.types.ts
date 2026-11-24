export type NodeToolbarProps = {
	/** Opens the node's own configuration dialog (notification step). */
	canOpen?: boolean;
	canDelete?: boolean;
	canComment?: boolean;
	canAddJoint?: boolean;
	canRemoveJoint?: boolean;
	/** Offered but greyed out: no method can be this node's joint target. */
	isAddJointDisabled?: boolean;
	onOpen?: () => void;
	onDelete?: () => void;
	onComment?: () => void;
	onAddJoint?: () => void;
	onRemoveJoint?: () => void;
};
