import React from 'react'
import type {TreeNode} from '@shared/ui/primitives/Tree'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {Icon} from '@shared/ui/primitives/Icon'
import type {
    ConfigNode,
    ConfigScalar,
    ConfigStatus,
    NodeEdit,
} from '@entities/systemConfig/model/types'
import {isContainerNode} from '@entities/systemConfig/model/types'
import {ConfigLeafEditor} from './ConfigLeafEditor'
import {CommentInfo} from './CommentInfo'

type LeafValue = ConfigScalar | ConfigScalar[]

export type BuildTreeArgs = {
    fields: ConfigNode[]
    edits: Record<string, NodeEdit>
    onValueChange: (path: string, value: LeafValue) => void
    onToggleStatus: (path: string) => void
    statusLabels: {enable: string; disable: string}
}

function StatusToggle({
    isActive,
    path,
    onToggleStatus,
    labels,
}: {
    isActive: boolean
    path: string
    onToggleStatus: (path: string) => void
    labels: {enable: string; disable: string}
}) {
    return (
        <Tooltip content={isActive ? labels.disable : labels.enable} placement="top">
            <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                    e.stopPropagation()
                    onToggleStatus(path)
                }}
                style={{display: 'inline-flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0}}
            >
                <Icon
                    name={isActive ? 'toggle-on' : 'toggle-off'}
                    size={18}
                    color={isActive ? 'primary' : 'default'}
                    isSubtle={!isActive}
                />
            </span>
        </Tooltip>
    )
}

function buildNodeTitle(node: ConfigNode, args: BuildTreeArgs): React.ReactNode {
    const {edits, onValueChange, onToggleStatus, statusLabels} = args
    const edit = edits[node.path]
    const isActive = (edit?.status ?? node.status) === 'active'
    const isLeaf = !isContainerNode(node)
    const value = (edit?.value ?? node.value) as LeafValue

    return (
        <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', width: '100%', height: 32}}>
            <StatusToggle
                isActive={isActive}
                path={node.path}
                onToggleStatus={onToggleStatus}
                labels={statusLabels}
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
                    />
                </span>
            )}
            <CommentInfo comments={node.comments} />
        </div>
    )
}

function buildNodes(nodes: ConfigNode[], args: BuildTreeArgs): TreeNode[] {
    return nodes.map((node) => {
        const container = isContainerNode(node)
        return {
            key: node.path,
            isLeaf: !container,
            title: buildNodeTitle(node, args),
            children: container ? buildNodes(node.value as ConfigNode[], args) : undefined,
        }
    })
}

export function buildTree(args: BuildTreeArgs): TreeNode[] {
    return buildNodes(args.fields, args)
}

export function hasAnyNodeComment(nodes: ConfigNode[]): boolean {
    for (const node of nodes) {
        if (node.comments && node.comments.length > 0) return true
        if (isContainerNode(node) && hasAnyNodeComment(node.value as ConfigNode[])) return true
    }
    return false
}

function nodeLabel(key: string): string {
    const lastDot = key.lastIndexOf('.')
    return lastDot >= 0 ? key.slice(lastDot + 1) : key
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
        if (nodeLabel(node.key).toLowerCase().includes(q)) {
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
