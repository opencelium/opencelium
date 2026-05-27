import React from 'react'
import type {TreeNode} from '@shared/ui/primitives/Tree'
import type {ConfigComment, ConfigValue} from '@entities/systemConfig/model/types'
import {ConfigLeafEditor} from './ConfigLeafEditor'

type CommentsByPath = Map<string, ConfigComment[]>

export type BuildTreeArgs = {
    data: ConfigValue
    comments: ConfigComment[]
    onLeafChange: (path: string, value: ConfigValue) => void
}

function groupComments(comments: ConfigComment[]): CommentsByPath {
    const map: CommentsByPath = new Map()
    for (const c of comments) {
        const list = map.get(c.path) ?? []
        list.push(c)
        map.set(c.path, list)
    }
    return map
}

function joinPath(parent: string, segment: string | number): string {
    if (typeof segment === 'number') return `${parent}[${segment}]`
    return parent ? `${parent}.${segment}` : segment
}

function CommentLine({text, kind}: {text: string; kind: 'before' | 'after'}) {
    const content = text.split('\n').map((line) => `#${line}`).join('\n')
    return (
        <pre
            className={`config-tree__comment config-tree__comment--${kind}`}
            style={{
                color: 'var(--color-text-subtle)',
                fontStyle: 'italic',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 12,
                margin: 0,
                whiteSpace: 'pre-wrap',
            }}
        >
            {content}
        </pre>
    )
}

function InlineComment({text}: {text: string}) {
    const lines = text.split('\n')
    const isMultiline = lines.length > 1
    const content = lines.map((line) => `#${line}`).join('\n')
    return (
        <span
            className="config-tree__comment config-tree__comment--inline"
            style={{
                color: 'var(--color-text-subtle)',
                fontStyle: 'italic',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 12,
                marginLeft: 8,
                whiteSpace: isMultiline ? 'pre-wrap' : 'normal',
            }}
        >
            {content}
        </span>
    )
}

function isPlainObject(value: ConfigValue): value is { [key: string]: ConfigValue } {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function buildNodeTitle(opts: {
    label: string
    path: string
    value: ConfigValue
    commentsForPath: ConfigComment[] | undefined
    onLeafChange: BuildTreeArgs['onLeafChange']
}): React.ReactNode {
    const {label, path, value, commentsForPath, onLeafChange} = opts
    const before = commentsForPath?.filter((c) => c.position === 'before') ?? []
    const inline = commentsForPath?.find((c) => c.position === 'inline')
    const after = commentsForPath?.filter((c) => c.position === 'after') ?? []

    const isLeaf =
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: 2, padding: '2px 0'}}>
            {before.map((c, idx) => (
                <CommentLine key={`b-${idx}`} text={c.text} kind="before" />
            ))}
            <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
                <span style={{fontWeight: 500, color: 'var(--color-text-primary)'}}>
                    {label}
                    {isLeaf ? ':' : ''}
                </span>
                {isLeaf && (
                    <ConfigLeafEditor
                        path={path}
                        value={value}
                        onChange={(next) => onLeafChange(path, next)}
                    />
                )}
                {inline && <InlineComment text={inline.text} />}
            </div>
            {after.map((c, idx) => (
                <CommentLine key={`a-${idx}`} text={c.text} kind="after" />
            ))}
        </div>
    )
}

function buildNodes(
    value: ConfigValue,
    parentPath: string,
    commentsByPath: CommentsByPath,
    onLeafChange: BuildTreeArgs['onLeafChange'],
): TreeNode[] {
    if (Array.isArray(value)) {
        return value.map((item, idx) => {
            const path = joinPath(parentPath, idx)
            const children = buildNodes(item, path, commentsByPath, onLeafChange)
            const isLeaf = !Array.isArray(item) && !isPlainObject(item)
            return {
                key: path,
                isLeaf,
                title: buildNodeTitle({
                    label: `[${idx}]`,
                    path,
                    value: item,
                    commentsForPath: commentsByPath.get(path),
                    onLeafChange,
                }),
                children: isLeaf ? undefined : children,
            }
        })
    }

    if (isPlainObject(value)) {
        return Object.entries(value).map(([key, child]) => {
            const path = joinPath(parentPath, key)
            const children = buildNodes(child, path, commentsByPath, onLeafChange)
            const isLeaf = !Array.isArray(child) && !isPlainObject(child)
            return {
                key: path,
                isLeaf,
                title: buildNodeTitle({
                    label: key,
                    path,
                    value: child,
                    commentsForPath: commentsByPath.get(path),
                    onLeafChange,
                }),
                children: isLeaf ? undefined : children,
            }
        })
    }

    return []
}

export function buildTree({data, comments, onLeafChange}: BuildTreeArgs): TreeNode[] {
    const map = groupComments(comments)
    return buildNodes(data, '', map, onLeafChange)
}

export function getHeaderComments(comments: ConfigComment[]): ConfigComment[] {
    return comments.filter((c) => c.path === '$.header')
}

export function getFooterComments(comments: ConfigComment[]): ConfigComment[] {
    return comments.filter((c) => c.path === '$.footer')
}
