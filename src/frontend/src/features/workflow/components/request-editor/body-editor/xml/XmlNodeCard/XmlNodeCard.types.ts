import type { XmlSelection, XmlTreeNode } from '../xmlTree';

export type XmlNodeCardProps = {
	node: XmlTreeNode;
	depth?: number;
	readOnly?: boolean;
	selected?: XmlSelection | null;
	onChangeNode: (nodeId: string, patch: Partial<XmlTreeNode>) => void;
	onAddChild: (nodeId: string) => void;
	onRemove: (nodeId: string) => void;
	onSelect: (selection: XmlSelection) => void;
	onReferenceClick?: (selection: XmlSelection) => void;
	onInsertReference?: (selection: XmlSelection) => void;
};
