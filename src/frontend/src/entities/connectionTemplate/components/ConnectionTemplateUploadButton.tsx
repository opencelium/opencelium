import React, { useRef, useState } from 'react'
import { message } from 'antd'
import { Button } from '@shared/ui/primitives/Button'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { uploadConnectionTemplate } from '@entities/connectionTemplate/lib/uploadConnectionTemplate'
import { notifyError } from '@shared/ui/feedback/notifyError'

export const ConnectionTemplateUploadButton: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isLoading, setIsLoading] = useState(false)
    const confirm = useConfirm()
    const { t: tEntities } = useI18n('entities')

    const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return

        setIsLoading(true)
        try {
            const uploaded = await uploadConnectionTemplate(file, () =>
                confirm({
                    title: tEntities('connection-template.list.upload.confirmReplace.title'),
                    message: tEntities('connection-template.list.upload.confirmReplace.message'),
                }),
            )
            if (uploaded) {
                message.success(tEntities('connection-template.list.upload.success', { name: file.name }))
            }
        } catch (err) {
            console.error(err)
            notifyError(tEntities('connection-template.list.upload.error'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept=".json,.zip,application/json,application/zip"
                style={{ display: 'none' }}
                onChange={handleFileChosen}
            />
            <Button
                type="primary"
                loading={isLoading}
                onClick={() => inputRef.current?.click()}
            >
                {tEntities('connection-template.list.upload.button')}
            </Button>
        </>
    )
}
