import React from 'react'
import type {TreeNode} from '@shared/ui/primitives/Tree'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {Checkbox} from '@shared/ui/primitives/Checkbox'
import type {
    ConfigNode,
    ConfigScalar,
    NodeEdit,
} from '@entities/systemConfig/model/types'
import {isContainerNode} from '@entities/systemConfig/model/types'
import {nodeLabel} from '@entities/systemConfig/model/helpers'
import {Icon} from '@shared/ui/primitives/Icon'
import {ConfigLeafEditor} from '@entities/systemConfig/ui/ConfigLeafEditor'
import {CommentTooltipBody} from './CommentInfo'

type LeafValue = ConfigScalar | ConfigScalar[]

export type BuildTreeArgs = {
    fields: ConfigNode[]
    edits: Record<string, NodeEdit>
    onValueChange: (path: string, value: LeafValue) => void
    onToggleStatus: (path: string) => void
    statusLabels: {enable: string; disable: string}
    /** When true, the tree renders every node's controls disabled. */
    readOnly?: boolean
}

function StatusToggle({
    isActive,
    path,
    onToggleStatus,
    labels,
    readOnly,
}: {
    isActive: boolean
    path: string
    onToggleStatus: (path: string) => void
    labels: {enable: string; disable: string}
    readOnly?: boolean
}) {
    return (
        <Tooltip content={isActive ? labels.disable : labels.enable} placement="top">
            <span
                onClick={(e) => e.stopPropagation()}
                style={{display: 'inline-flex', alignItems: 'center', flexShrink: 0}}
            >
                <Checkbox checked={isActive} disabled={readOnly} onChange={() => onToggleStatus(path)} />
            </span>
        </Tooltip>
    )
}

function buildNodeTitle(node: ConfigNode, args: BuildTreeArgs): React.ReactNode {
    const {edits, onValueChange, onToggleStatus, statusLabels, readOnly} = args
    const edit = edits[node.path]
    const isActive = (edit?.status ?? node.status) === 'active'
    const isLeaf = !isContainerNode(node)
    const value = (edit?.value ?? node.value) as LeafValue

    const hasComments = !!node.comments && node.comments.length > 0

    return (
        // Focus events are kept off rc-tree: it treats a focus it did not see a mousedown
        // for as keyboard entry, activates the *first* node and scrolls the virtual list to
        // it. Chrome fires exactly that when an input's `type` flips — clicking the reveal
        // icon on a password row swaps `password`→`text`, the browser re-focuses the input,
        // and the whole tree jumped back to the top.
        <div
            onFocus={(e) => e.stopPropagation()}
            onBlur={(e) => e.stopPropagation()}
            style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', width: '100%', height: 32}}
        >
            <StatusToggle
                isActive={isActive}
                path={node.path}
                onToggleStatus={onToggleStatus}
                labels={statusLabels}
                readOnly={readOnly}
            />
            <span
                style={{
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                }}
            >
                {node.key}
                {isLeaf ? ':' : ''}
            </span>
            {isLeaf && (
                <span style={{display: 'inline-flex', opacity: isActive ? 1 : 0.6}}>
                    <ConfigLeafEditor
                        path={node.path}
                        value={value}
                        onChange={(next) => onValueChange(node.path, next)}
                        readOnly={readOnly}
                    />
                </span>
            )}
            {/* Pin the comment icon to the far right of the row. */}
            <span style={{marginLeft: 'auto', flexShrink: 0}}>
                {hasComments && (
                    <Tooltip content={<CommentTooltipBody comments={node.comments!} />} placement="left">
                        <span style={{display: 'inline-flex', alignItems: 'center', cursor: 'help', paddingRight: 10}}>
                            <Icon name="info" size={14} color="secondary" isSubtle />
                        </span>
                    </Tooltip>
                )}
            </span>
        </div>
    )
}

// application.yml may hold the same key more than once (e.g. commented-out alternatives),
// so several nodes share a path. rc-tree needs unique keys — duplicate keys make its
// virtual list re-append rows on every scroll — so repeats get an occurrence suffix.
const DUPLICATE_KEY_SEPARATOR = '::dup'

function uniqueTreeKey(path: string, seen: Map<string, number>): string {
    const count = seen.get(path) ?? 0
    seen.set(path, count + 1)
    return count === 0 ? path : `${path}${DUPLICATE_KEY_SEPARATOR}${count}`
}

function treeKeyToPath(key: string): string {
    const index = key.indexOf(DUPLICATE_KEY_SEPARATOR)
    return index >= 0 ? key.slice(0, index) : key
}

function buildNodes(nodes: ConfigNode[], args: BuildTreeArgs, seen: Map<string, number>): TreeNode[] {
    return nodes.map((node) => {
        const container = isContainerNode(node)
        return {
            key: uniqueTreeKey(node.path, seen),
            isLeaf: !container,
            title: buildNodeTitle(node, args),
            children: container ? buildNodes(node.value as ConfigNode[], args, seen) : undefined,
        }
    })
}

export function buildTree(args: BuildTreeArgs): TreeNode[] {
    return buildNodes(args.fields, args, new Map())
}

export function hasAnyNodeComment(nodes: ConfigNode[]): boolean {
    for (const node of nodes) {
        if (node.comments && node.comments.length > 0) return true
        if (isContainerNode(node) && hasAnyNodeComment(node.value as ConfigNode[])) return true
    }
    return false
}

/**
 * Prune the tree to nodes whose field label matches `query` (case-insensitive
 * substring). A self-match keeps the node's whole subtree; a descendant match
 * keeps the ancestor chain so the match stays reachable.
 */
export function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
    const q = query.trim().toLowerCase()
    if (!q) return nodes
    const out: TreeNode[] = []
    for (const node of nodes) {
        if (nodeLabel(treeKeyToPath(node.key)).toLowerCase().includes(q)) {
            out.push(node)
            continue
        }
        if (node.children?.length) {
            const kids = filterTree(node.children, q)
            if (kids.length > 0) out.push({...node, children: kids})
        }
    }
    return out
}

export function collectExpandableKeys(nodes: TreeNode[], acc: string[] = []): string[] {
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            acc.push(node.key)
            collectExpandableKeys(node.children, acc)
        }
    }
    return acc
}
