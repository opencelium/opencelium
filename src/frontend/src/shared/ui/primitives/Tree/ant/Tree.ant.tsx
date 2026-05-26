import {Tree as AntTreeBase} from "antd";
import type {TreeComponent} from "@shared/ui/primitives/Tree/Tree.types.ts";

export const AntTree: TreeComponent = ({
    treeData,
    defaultExpandAll,
    expandedKeys,
    onExpand,
    showLine = true,
    blockNode = true,
    className,
    style,
}) => {
    return (
        <AntTreeBase
            treeData={treeData}
            defaultExpandAll={defaultExpandAll}
            expandedKeys={expandedKeys}
            onExpand={(keys) => onExpand?.(keys.map(String))}
            showLine={showLine}
            blockNode={blockNode}
            selectable={false}
            className={className}
            style={style}
        />
    );
};
