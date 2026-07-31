import React, { useRef, useState } from 'react'
import { message } from 'antd'
import { Button } from '@shared/ui/primitives/Button'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { uploadInvoker } from '@entities/invoker/lib/uploadInvoker'

export const InvokerUploadButton: React.FC = () => {
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
            const uploaded = await uploadInvoker(file, () =>
                confirm({
                    title: tEntities('invoker.list.upload.confirmReplace.title'),
                    message: tEntities('invoker.list.upload.confirmReplace.message'),
                }),
            )
            if (uploaded) {
                message.success(tEntities('invoker.list.upload.success', { name: file.name }))
            }
        } catch (err) {
            console.error(err)
            message.error(tEntities('invoker.list.upload.error'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                style={{ display: 'none' }}
                onChange={handleFileChosen}
            />
            <Button
                type="primary"
                loading={isLoading}
                onClick={() => inputRef.current?.click()}
            >
                {tEntities('invoker.list.upload.button')}
            </Button>
        </>
    )
}
