import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {message} from 'antd'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import {Typography} from '@shared/ui/primitives/Typography'
import {Button} from '@shared/ui/primitives/Button'
import {Input} from '@shared/ui/primitives/Input'
import {Alert} from '@shared/ui/primitives/Alert'
import {Hint} from '@shared/ui/primitives/Hint'
import {Loading} from '@shared/ui/primitives/Loading/Loading'
import {Tree} from '@shared/ui/primitives/Tree'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {Icon} from '@shared/ui/primitives/Icon'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {
    useGetApplicationConfigQuery,
    useUpdateApplicationConfigMutation,
} from '@entities/systemConfig/api/systemConfigApi'
import type {
    ConfigNode,
    ConfigPatchNode,
    ConfigScalar,
    NodeEdit,
} from '@entities/systemConfig/model/types'
import {isContainerNode} from '@entities/systemConfig/model/types'
import {
    buildTree,
    collectExpandableKeys,
    filterTree,
    hasAnyNodeComment,
} from './buildTree'
import {CommentTooltipBody} from './CommentInfo'

type LeafValue = ConfigScalar | ConfigScalar[]

export function SystemConfigPage() {
    const {t, lang} = useI18n('entities')
    const {data, isLoading, isError, refetch} = useGetApplicationConfigQuery()
    const [updateConfig, {isLoading: isSaving}] = useUpdateApplicationConfigMutation()
    const [edits, setEdits] = useState<Record<string, NodeEdit>>({})
    const [restartRequired, setRestartRequired] = useState(false)
    const [expandedKeys, setExpandedKeys] = useState<string[] | null>(null)
    const [search, setSearch] = useState('')

    const fields = useMemo(() => data?.fields ?? [], [data?.fields])

    const nodeByPath = useMemo(() => {
        const map = new Map<string, ConfigNode>()
        const walk = (nodes: ConfigNode[]) => {
            for (const n of nodes) {
                map.set(n.path, n)
                if (isContainerNode(n)) walk(n.value as ConfigNode[])
            }
        }
        walk(fields)
        return map
    }, [fields])

    const handleValueChange = useCallback((path: string, value: LeafValue) => {
        setEdits((prev) => {
            const node = nodeByPath.get(path)
            const edit: NodeEdit = {...prev[path]}
            if (node && JSON.stringify(node.value) === JSON.stringify(value)) {
                delete edit.value
            } else {
                edit.value = value
            }
            const next = {...prev}
            if (edit.value === undefined && edit.status === undefined) delete next[path]
            else next[path] = edit
            return next
        })
    }, [nodeByPath])

    const handleToggleStatus = useCallback((path: string) => {
        setEdits((prev) => {
            const node = nodeByPath.get(path)
            if (!node) return prev
            const edit: NodeEdit = {...prev[path]}
            const current = edit.status ?? node.status
            const flipped = current === 'active' ? 'inactive' : 'active'
            if (flipped === node.status) delete edit.status
            else edit.status = flipped
            const next = {...prev}
            if (edit.value === undefined && edit.status === undefined) delete next[path]
            else next[path] = edit
            return next
        })
    }, [nodeByPath])

    const statusLabels = useMemo(
        () => ({
            enable: t('system-config.status.enable'),
            disable: t('system-config.status.disable'),
        }),
        // re-translate only when the language changes (t identity is unstable)
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [lang],
    )

    const treeData = useMemo(() => {
        if (fields.length === 0) return []
        return buildTree({
            fields,
            edits,
            onValueChange: handleValueChange,
            onToggleStatus: handleToggleStatus,
            statusLabels,
        })
    }, [fields, edits, handleValueChange, handleToggleStatus, statusLabels])

    const allExpandableKeys = useMemo(
        () => collectExpandableKeys(treeData),
        [treeData],
    )

    // Auto-expand the whole tree the first time config data arrives. defaultExpandAll
    // can't do this because the tree mounts before the async response resolves.
    useEffect(() => {
        if (expandedKeys === null && allExpandableKeys.length > 0) {
            setExpandedKeys(allExpandableKeys)
        }
    }, [allExpandableKeys, expandedKeys])

    const isSearching = search.trim().length > 0

    const isAllExpanded =
        allExpandableKeys.length > 0 &&
        allExpandableKeys.every((k) => (expandedKeys ?? []).includes(k))

    const toggleExpandAll = useCallback(() => {
        setExpandedKeys(isAllExpanded ? [] : allExpandableKeys)
    }, [isAllExpanded, allExpandableKeys])

    const displayedTreeData = useMemo(
        () => filterTree(treeData, search),
        [treeData, search],
    )

    // While searching, force every surviving branch open so matches are visible;
    // otherwise honor the user's manual expand/collapse state.
    const displayedExpandedKeys = useMemo(
        () => (isSearching ? collectExpandableKeys(displayedTreeData) : expandedKeys ?? []),
        [isSearching, displayedTreeData, expandedKeys],
    )

    // Envelope comments are only file header/footer orphans; per-node comments
    // live on each node and surface via the inline ℹ icons.
    const fileComments = useMemo(() => data?.comments ?? [], [data?.comments])

    const hasComments = fileComments.length > 0 || hasAnyNodeComment(fields)

    // Virtual-scroll height: fill from the tree's top to the viewport bottom,
    // leaving room for the hint + action buttons below. Recomputed on resize and
    // whenever layout above the tree changes (restart alert, search toggle, load).
    const treeWrapRef = useRef<HTMLDivElement>(null)
    const [treeHeight, setTreeHeight] = useState<number | undefined>(undefined)

    useLayoutEffect(() => {
        const el = treeWrapRef.current
        if (!el) return
        const compute = () => {
            const top = el.getBoundingClientRect().top
            const bottomReserve = 180 // hint + Reset/Save row beneath the tree
            setTreeHeight(Math.max(240, Math.round(window.innerHeight - top - bottomReserve)))
        }
        compute()
        window.addEventListener('resize', compute)
        return () => window.removeEventListener('resize', compute)
    }, [isLoading, isError, restartRequired, isSearching])

    const isDirty = Object.keys(edits).length > 0

    const handleReset = useCallback(() => {
        setEdits({})
        setRestartRequired(false)
    }, [])

    const handleSave = useCallback(async () => {
        const paths = Object.keys(edits)
        if (paths.length === 0) {
            message.info(t('system-config.messages.noChanges'))
            return
        }
        const patchFields: ConfigPatchNode[] = []
        for (const path of paths) {
            const node = nodeByPath.get(path)
            if (!node) continue
            const edit = edits[path]
            const patch: ConfigPatchNode = {path, status: edit.status ?? node.status}
            if (!isContainerNode(node)) {
                patch.value = (edit.value ?? node.value) as LeafValue
            }
            patchFields.push(patch)
        }

        const res = await updateConfig({fields: patchFields})
        if ('error' in res && res.error) {
            const err = res.error as {data?: {message?: string}}
            message.error(err.data?.message ?? t('system-config.messages.saveFailed'))
            return
        }
        const payload = res.data
        setEdits({})
        setRestartRequired(Boolean(payload?.restartRequired))
        message.success(t('system-config.messages.saved'))
        refetch()
    }, [edits, nodeByPath, refetch, t, updateConfig])

    return (
        <PageWrapper>
            <div style={{padding: 16}}>
                <header style={{marginBottom: 20}}>
                    <h1 style={{marginBottom: 8}}>
                        <Typography variant="headline" as="span">
                            {t('system-config.page.title')}
                        </Typography>
                    </h1>
                    <div style={{color: '#888'}}>
                        <Typography variant="body">
                            {t('system-config.page.subtitle')}
                        </Typography>
                    </div>
                </header>

                {restartRequired && (
                    <div style={{marginTop: 12}}>
                        <Alert
                            type="warning"
                            showIcon
                            message={t('system-config.restart.title')}
                            description={t('system-config.restart.message')}
                            closable
                            onClose={() => setRestartRequired(false)}
                        />
                    </div>
                )}

                <div style={{marginTop: 16}}>
                    {isLoading && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: 320,
                            }}
                        >
                            <Loading />
                        </div>
                    )}
                    {isError && (
                        <Alert
                            type="error"
                            showIcon
                            message={t('system-config.messages.loadFailed')}
                        />
                    )}
                    {!isLoading && !isError && (
                        <>
                            <div style={{marginBottom: 12}}>
                                <Input
                                    placeholder={t('system-config.search.placeholder')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    leftSlot={<Icon name="search" size={16} isSubtle />}
                                />
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 12,
                                    justifyContent: "space-between"
                                }}
                            >
                                {!isSearching && (
                                    <Button
                                        type="primary"
                                        onClick={toggleExpandAll}
                                        iconLeft={isAllExpanded ? 'collapse' : 'expand'}
                                    >
                                        {isAllExpanded
                                            ? t('system-config.actions.collapseAll')
                                            : t('system-config.actions.expandAll')}
                                    </Button>
                                )}
                                {hasComments && (
                                    <Tooltip
                                        placement="bottom"
                                        content={
                                            <div style={{maxWidth: 520}}>
                                                <div style={{marginBottom: fileComments.length > 0 ? 8 : 0}}>
                                                    {t('system-config.comments.hint')}
                                                </div>
                                                {fileComments.length > 0 && (
                                                    <CommentTooltipBody comments={fileComments} />
                                                )}
                                            </div>
                                        }
                                    >
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                marginLeft: 'auto',
                                                cursor: 'help',
                                                color: 'var(--color-text-secondary)',
                                                fontSize: 12,
                                            }}
                                        >
                                            <Icon name="info" size={14} color="secondary" isSubtle />
                                            {t('system-config.comments.label')}
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                            <div
                                style={{
                                    height: 1,
                                    background: 'var(--color-border-strong)',
                                    marginBottom: 12,
                                }}
                            />
                            <div ref={treeWrapRef}>
                                {displayedTreeData.length > 0 ? (
                                    <Tree
                                        treeData={displayedTreeData}
                                        expandedKeys={displayedExpandedKeys}
                                        onExpand={setExpandedKeys}
                                        showLine
                                        blockNode
                                        height={isSearching ? undefined : treeHeight}
                                        itemHeight={36}
                                    />
                                ) : (
                                    <div style={{padding: '12px 0'}}>
                                        <Typography variant="body" isSubtle>
                                            {t('system-config.search.empty')}
                                        </Typography>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div style={{marginTop: 16}}>
                    <Hint>{t('system-config.hint.afterSave')}</Hint>
                </div>

                <div style={{display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end'}}>
                    <Button onClick={handleReset}>
                        {t('system-config.actions.reset')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleSave}
                        loading={isSaving}
                        disabled={!isDirty}
                    >
                        {t('system-config.actions.save')}
                    </Button>
                </div>
            </div>
        </PageWrapper>
    )
}

export default SystemConfigPage
