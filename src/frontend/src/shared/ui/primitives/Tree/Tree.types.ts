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
    /**
     * Fixed viewport height in px. When set, the antd adapter enables virtual
     * scrolling (only visible rows are rendered, no expand animation); the
     * material adapter wraps the tree in a scroll container of this height.
     */
    height?: number;
    /**
     * Row height in px for virtual scrolling. Set this to the actual rendered row
     * height — otherwise antd's token-derived estimate (~28px) is wrong for rows
     * with inputs, forcing rc-virtual-list to re-measure and re-render on expand.
     */
    itemHeight?: number;
    className?: string;
    style?: CSSProperties;
}

export type TreeComponent = React.FC<TreeProps>;
