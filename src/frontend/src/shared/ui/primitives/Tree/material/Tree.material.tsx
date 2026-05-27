import React, {useCallback, useEffect, useMemo, useState} from "react";
import {IconButton as MuiIconButton} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import type {TreeComponent, TreeNode} from "@shared/ui/primitives/Tree/Tree.types.ts";

function collectAllKeys(nodes: TreeNode[], acc: string[] = []): string[] {
    for (const node of nodes) {
        acc.push(node.key);
        if (node.children?.length) {
            collectAllKeys(node.children, acc);
        }
    }
    return acc;
}

type RowProps = {
    node: TreeNode;
    depth: number;
    expanded: Set<string>;
    toggle: (key: string) => void;
};

const TreeRow: React.FC<RowProps> = ({node, depth, expanded, toggle}) => {
    const hasChildren = !node.isLeaf && (node.children?.length ?? 0) > 0;
    const isOpen = expanded.has(node.key);

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: depth * 16,
                    minHeight: 28,
                    gap: 4,
                }}
            >
                {hasChildren ? (
                    <MuiIconButton
                        size="small"
                        onClick={() => toggle(node.key)}
                        sx={{padding: 0.25, color: 'var(--color-text-primary)'}}
                    >
                        {isOpen
                            ? <KeyboardArrowDownIcon fontSize="small" />
                            : <KeyboardArrowRightIcon fontSize="small" />}
                    </MuiIconButton>
                ) : (
                    <span style={{display: 'inline-block', width: 24}} />
                )}
                <div style={{flex: 1, minWidth: 0}}>{node.title}</div>
            </div>
            {hasChildren && isOpen && (
                <div>
                    {node.children!.map((child) => (
                        <TreeRow
                            key={child.key}
                            node={child}
                            depth={depth + 1}
                            expanded={expanded}
                            toggle={toggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const MaterialTree: TreeComponent = ({
    treeData,
    defaultExpandAll,
    expandedKeys,
    onExpand,
    height,
    className,
    style,
}) => {
    const isControlled = expandedKeys !== undefined;

    const initial = useMemo<Set<string>>(() => {
        if (expandedKeys) return new Set(expandedKeys);
        if (defaultExpandAll) return new Set(collectAllKeys(treeData));
        return new Set<string>();
    // intentional: initial state derives from first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [internal, setInternal] = useState<Set<string>>(initial);

    useEffect(() => {
        if (isControlled) {
            setInternal(new Set(expandedKeys));
        }
    }, [isControlled, expandedKeys]);

    const toggle = useCallback((key: string) => {
        setInternal((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            onExpand?.([...next]);
            return next;
        });
    }, [onExpand]);

    return (
        <div
            className={className}
            style={{
                ...style,
                ...(height ? {maxHeight: height, overflowY: 'auto'} : {}),
            }}
        >
            {treeData.map((node) => (
                <TreeRow
                    key={node.key}
                    node={node}
                    depth={0}
                    expanded={internal}
                    toggle={toggle}
                />
            ))}
        </div>
    );
};
