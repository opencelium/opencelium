import {Tree as AntTreeBase} from "antd";
import type {TreeComponent} from "@shared/ui/primitives/Tree/Tree.types.ts";

export const AntTree: TreeComponent = ({
    treeData,
    defaultExpandAll,
    expandedKeys,
    onExpand,
    showLine = true,
    blockNode = true,
    height,
    itemHeight,
    className,
    style,
}) => {
    // Only switch to controlled mode when expandedKeys is actually provided —
    // passing `expandedKeys={undefined}` alongside async treeData makes rc-tree
    // capture defaultExpandAll against the empty initial tree and never re-apply it.
    const controlledProps = expandedKeys !== undefined ? {expandedKeys} : {defaultExpandAll};

    return (
        <AntTreeBase
            treeData={treeData}
            {...controlledProps}
            onExpand={(keys) => onExpand?.(keys.map(String))}
            showLine={showLine}
            blockNode={blockNode}
            height={height}
            itemHeight={itemHeight}
            selectable={false}
            className={className}
            style={style}
        />
    );
};
