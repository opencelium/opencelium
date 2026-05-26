import React, {useCallback, useMemo, useState} from 'react'
import {message} from 'antd'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import {Typography} from '@shared/ui/primitives/Typography'
import {Card} from '@shared/ui/primitives/Card'
import {Button} from '@shared/ui/primitives/Button'
import {Alert} from '@shared/ui/primitives/Alert'
import {Hint} from '@shared/ui/primitives/Hint'
import {Loading} from '@shared/ui/primitives/Loading/Loading'
import {Tree} from '@shared/ui/primitives/Tree'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {
    useGetApplicationConfigQuery,
    useUpdateApplicationConfigMutation,
} from '@entities/systemConfig/api/systemConfigApi'
import type {ConfigData, ConfigValue} from '@entities/systemConfig/model/types'
import {
    buildTree,
    getFooterComments,
    getHeaderComments,
} from './buildTree'
import {buildPatch} from './buildPatch'
import {parsePath, setValueAtPath} from './setValueAtPath'

function CommentBanner({text, kind}: {text: string; kind: 'header' | 'footer'}) {
    return (
        <div
            className={`system-config__banner system-config__banner--${kind}`}
            style={{
                color: 'var(--color-text-subtle)',
                fontStyle: 'italic',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 12,
                padding: '4px 0',
                whiteSpace: 'pre-wrap',
            }}
        >
            #{text}
        </div>
    )
}

export function SystemConfigPage() {
    const {t} = useI18n('entities')
    const {data, isLoading, isError, refetch} = useGetApplicationConfigQuery()
    const [updateConfig, {isLoading: isSaving}] = useUpdateApplicationConfigMutation()
    const [modified, setModified] = useState<ConfigData | null>(null)
    const [restartRequired, setRestartRequired] = useState(false)

    const original = data?.data ?? null
    const current = modified ?? original

    const handleLeafChange = useCallback((path: string, value: ConfigValue) => {
        setModified((prev) => {
            const base = prev ?? original ?? {}
            const segments = parsePath(path)
            return setValueAtPath(base as ConfigValue, segments, value) as ConfigData
        })
    }, [original])

    const treeData = useMemo(() => {
        if (!current) return []
        return buildTree({
            data: current as ConfigValue,
            comments: data?.comments ?? [],
            onLeafChange: handleLeafChange,
        })
    }, [current, data?.comments, handleLeafChange])

    const headerComments = useMemo(
        () => getHeaderComments(data?.comments ?? []),
        [data?.comments],
    )
    const footerComments = useMemo(
        () => getFooterComments(data?.comments ?? []),
        [data?.comments],
    )

    const isDirty = modified !== null && original !== null &&
        buildPatch(original as ConfigValue, modified as ConfigValue) !== undefined

    const handleReset = useCallback(() => {
        setModified(null)
        setRestartRequired(false)
    }, [])

    const handleSave = useCallback(async () => {
        if (!original || !modified) return
        const patch = buildPatch(original as ConfigValue, modified as ConfigValue)
        if (patch === undefined || patch === null) {
            message.info(t('system-config.messages.noChanges'))
            return
        }
        const res = await updateConfig(patch as Partial<ConfigData>)
        if ('error' in res && res.error) {
            message.error(t('system-config.messages.saveFailed'))
            return
        }
        const payload = res.data
        setModified(null)
        setRestartRequired(Boolean(payload?.restartRequired))
        message.success(t('system-config.messages.saved'))
        refetch()
    }, [modified, original, refetch, t, updateConfig])

    return (
        <PageWrapper>
            <div style={{padding: 18, maxWidth: 1100, margin: '0 auto'}}>
                <div style={{marginBottom: 16}}>
                    <Typography variant="headline">
                        {t('system-config.page.title')}
                    </Typography>
                    <div style={{marginTop: 6}}>
                        <Typography isSubtle>
                            {t('system-config.page.subtitle')}
                        </Typography>
                    </div>
                </div>

                <Hint>{t('system-config.hint.secrets')}</Hint>

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

                <Card style={{marginTop: 16}}>
                    {isLoading && <Loading />}
                    {isError && (
                        <Alert
                            type="error"
                            showIcon
                            message={t('system-config.messages.loadFailed')}
                        />
                    )}
                    {!isLoading && !isError && (
                        <>
                            {headerComments.map((c, idx) => (
                                <CommentBanner key={`h-${idx}`} text={c.text} kind="header" />
                            ))}
                            <Tree treeData={treeData} defaultExpandAll showLine blockNode />
                            {footerComments.map((c, idx) => (
                                <CommentBanner key={`f-${idx}`} text={c.text} kind="footer" />
                            ))}
                        </>
                    )}
                </Card>

                <div style={{display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end'}}>
                    <Button onClick={handleReset} disabled={!isDirty || isSaving}>
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
