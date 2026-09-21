import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { message } from 'antd'
import { Button } from '@shared/ui/primitives/Button'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { uploadInvoker } from '@entities/invoker/lib/uploadInvoker'
import { notifyError } from '@shared/ui/feedback/notifyError'

export type InvokerUploadButtonHandle = {
    upload: (file: File) => Promise<void>
}

type InvokerUploadButtonProps = {
    onLoadingChange?: (loading: boolean, file: File) => void
    onUploadResult?: (result: 'success' | 'cancelled' | 'error', file: File, metadata?: { methodCount: number; authType?: string; version?: string }) => void
}

export const InvokerUploadButton = forwardRef<InvokerUploadButtonHandle, InvokerUploadButtonProps>(function InvokerUploadButton({ onLoadingChange, onUploadResult }, ref) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isLoading, setIsLoading] = useState(false)
    const confirm = useConfirm()
    const { t: tEntities } = useI18n('entities')

    const uploadFile = async (file: File) => {
        setIsLoading(true)
        onLoadingChange?.(true, file)
        try {
            const uploaded = await uploadInvoker(file, () =>
                confirm({
                    title: tEntities('invoker.list.upload.confirmReplace.title'),
                    message: tEntities('invoker.list.upload.confirmReplace.message'),
                }),
            )
            if (uploaded) {
                message.success(tEntities('invoker.list.upload.success', { name: file.name }))
                onUploadResult?.('success', file, uploaded)
            } else {
                onUploadResult?.('cancelled', file)
            }
        } catch (err) {
            console.error(err)
            notifyError(tEntities('invoker.list.upload.error'))
            onUploadResult?.('error', file)
        } finally {
            setIsLoading(false)
            onLoadingChange?.(false, file)
        }
    }

    useImperativeHandle(ref, () => ({ upload: uploadFile }))

    const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (file) await uploadFile(file)
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
})
