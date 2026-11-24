import React, { useCallback, useState } from 'react'
import { message } from 'antd'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { NewFeature } from '@shared/ui/feedback/NewFeature/NewFeature'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { JsonEditorDialog } from '@shared/ui/json-editor/JsonEditorDialog'
import {
    fetchConnectionTemplateJson,
    updateConnectionTemplateJson,
    validateConnectionTemplateJson,
    type ConnectionTemplateJson,
} from '@entities/connectionTemplate/lib/editConnectionTemplate'

type Props = {
    row: unknown
    rowId: string
    /** The "new" badge goes on the top row only: one per row would turn the whole column blue. */
    isFirstRow: boolean
}

export const ConnectionTemplateEditAction: React.FC<Props> = ({ row, rowId, isFirstRow }) => {
    const { t: tEntities } = useI18n('entities')
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [value, setValue] = useState<Record<string, unknown> | null>(null)

    const template = (row ?? {}) as { templateId?: string | number; id?: string | number }
    const idField = template.templateId !== undefined ? 'templateId' : 'id'
    const id = String(template.templateId ?? template.id ?? rowId ?? '')

    const validate = useCallback(
        (draft: Record<string, unknown>) => validateConnectionTemplateJson(draft, idField, value?.[idField]),
        [idField, value],
    )

    const open = async () => {
        if (!id) return
        setIsLoading(true)
        try {
            setValue(await fetchConnectionTemplateJson(id))
        } catch (err) {
            console.error(err)
            notifyError(tEntities('connection-template.list.edit.loadError'))
        } finally {
            setIsLoading(false)
        }
    }

    const save = async (next: ConnectionTemplateJson) => {
        setIsSaving(true)
        try {
            await updateConnectionTemplateJson(id, next)
            setValue(null)
            message.success(tEntities('connection-template.list.edit.success', { name: next.name }))
        } catch (err) {
            console.error(err)
            notifyError(tEntities('connection-template.list.edit.error'))
        } finally {
            setIsSaving(false)
        }
    }

    const tooltip = tEntities('connection-template.list.edit.tooltip')
    const button = (
        <IconButton
            iconProps={{ name: 'edit', color: 'primary', size: 15 }}
            type={'text'}
            size={'xs'}
            loading={isLoading}
            onClick={open}
            testId={`connection-template-row-action-edit-json-${id}`}
        />
    )

    return (
        <>
            {isFirstRow ? (
                <NewFeature id="workflow-template-json-edit" tooltip={tooltip} placement="top">{button}</NewFeature>
            ) : (
                <Tooltip content={tooltip} placement="top">{button}</Tooltip>
            )}
            {value !== null && <JsonEditorDialog
                open
                readOnly={false}
                title={tEntities('connection-template.list.edit.title')}
                testId="workflow-template-json"
                value={value}
                validate={validate}
                applyConfirm={{
                    title: tEntities('connection-template.list.edit.applyConfirm.title'),
                    message: tEntities('connection-template.list.edit.applyConfirm.message'),
                }}
                isApplying={isSaving}
                onClose={() => setValue(null)}
                onApply={(next) => void save(next)}
                forceApply={{
                    confirm: {
                        title: tEntities('connection-template.list.edit.forceApplyConfirm.title'),
                        message: tEntities('connection-template.list.edit.forceApplyConfirm.message'),
                    },
                    onApply: (draft) => void save(draft as ConnectionTemplateJson),
                }}
            />}
        </>
    )
}
