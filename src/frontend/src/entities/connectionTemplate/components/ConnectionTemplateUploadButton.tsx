import React, { useRef, useState } from 'react'
import { message } from 'antd'
import { Button } from '@shared/ui/primitives/Button'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { TEMPLATE_FILE_ACCEPT, uploadConnectionTemplate } from '@entities/connectionTemplate/lib/uploadConnectionTemplate'
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
            const result = await uploadConnectionTemplate(file, () =>
                confirm({
                    title: tEntities('connection-template.list.upload.confirmReplace.title'),
                    message: tEntities('connection-template.list.upload.confirmReplace.message'),
                }),
            )
            switch (result.status) {
                case 'uploaded':
                    message.success(tEntities('connection-template.list.upload.success', { name: file.name }))
                    break
                case 'uploadedArchive':
                    message.success(tEntities('connection-template.list.upload.successArchive',
                        { name: file.name, count: result.ids.length }))
                    break
                case 'emptyArchive':
                    notifyError(tEntities('connection-template.list.upload.emptyArchive'))
                    break
                case 'cancelled':
                    break
                case 'invalidType':
                    notifyError(tEntities('connection-template.list.upload.invalidType'))
                    break
                case 'tooLarge':
                    notifyError(tEntities('connection-template.list.upload.tooLarge'))
                    break
                case 'archiveTooLarge':
                    notifyError(tEntities('connection-template.list.upload.archiveTooLarge'))
                    break
                default: {
                    const _exhaustive: never = result
                    return _exhaustive
                }
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
                accept={TEMPLATE_FILE_ACCEPT}
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
