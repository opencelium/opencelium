import { useFormContext } from 'react-hook-form'
import { useGetOfflineVersionsQuery } from '@entities/updateAssistant/api/updateAssistantApi'
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

    const updateMode = watch('updateMode') ?? 'online'
    const selectedVersionName = watch('versionsDisplay')
    const isOffline = updateMode === 'offline'

    const { data: offlineVersions } = useGetOfflineVersionsQuery(undefined, { skip: !isOffline })
    const selectedOfflineVersion =
        isOffline && typeof selectedVersionName === 'string'
            ? offlineVersions?.find((v) => v.name === selectedVersionName)
            : undefined
    const instructionHtml = selectedOfflineVersion?.instruction?.trim() || null

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {instructionHtml && (
                <div
                    style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ant-color-text)' }}
                    dangerouslySetInnerHTML={{ __html: instructionHtml }}
                />
            )}

            <Hint type="warning">
                {t('update-assistant.update.hint')}
            </Hint>
        </div>
    )
}
