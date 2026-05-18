import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import {
    useRunUpdateMutation,
    useGetOfflineVersionsQuery,
} from '@entities/updateAssistant/api/updateAssistantApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import {Hint} from "@shared/ui/primitives/Hint";

type Props = {
    name: string
    label?: string
    mode: 'create' | 'update' | 'view'
}

export function UpdateAssistantRunButton({ name, label, mode }: Props) {
    const { t } = useI18n('entities')
    const { watch } = useFormContext()
    const [confirmed, setConfirmed] = useState(false)
    const [runUpdate, { isLoading, isSuccess, isError }] = useRunUpdateMutation()

    const updateMode = watch('updateMode') ?? 'online'
    const selectedVersionName = watch('versionsDisplay')
    const isOffline = updateMode === 'offline'

    const { data: offlineVersions } = useGetOfflineVersionsQuery(undefined, { skip: !isOffline })
    const selectedOfflineVersion =
        isOffline && typeof selectedVersionName === 'string'
            ? offlineVersions?.find((v) => v.name === selectedVersionName)
            : undefined
    const instructionHtml = selectedOfflineVersion?.instruction?.trim() || null

    const handleRun = async () => {
        if (!confirmed) {
            setConfirmed(true)
            return
        }
        await runUpdate()
        setConfirmed(false)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {confirmed && (
                <div style={{ color: '#faad14', fontSize: 13 }}>
                    {t('update-assistant.update.confirm')}
                </div>
            )}

            {isSuccess && (
                <div style={{ color: '#52c41a', fontSize: 13 }}>
                    {t('update-assistant.update.success')}
                </div>
            )}

            {isError && (
                <div style={{ color: '#ff4d4f', fontSize: 13 }}>
                    {t('update-assistant.update.error')}
                </div>
            )}

            {instructionHtml && (
                <div
                    style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ant-color-text)' }}
                    dangerouslySetInnerHTML={{ __html: instructionHtml }}
                />
            )}

            <Hint>
                {t('update-assistant.update.hint')}
            </Hint>
        </div>
    )
}
