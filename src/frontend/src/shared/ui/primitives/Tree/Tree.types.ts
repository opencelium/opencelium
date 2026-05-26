import React, {type CSSProperties, type ReactNode} from "react";

export interface TreeNode {
    key: string;
    title: ReactNode;
    children?: TreeNode[];
    isLeaf?: boolean;
}

export interface TreeProps {
    treeData: TreeNode[];
    defaultExpandAll?: boolean;
    expandedKeys?: string[];
    onExpand?: (expandedKeys: string[]) => void;
    showLine?: boolean;
    blockNode?: boolean;
    className?: string;
    style?: CSSProperties;
}

export type TreeComponent = React.FC<TreeProps>;
