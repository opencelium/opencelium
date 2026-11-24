import { useEffect, useRef, useState } from 'react'
import { message } from 'antd'
import { Button } from '@shared/ui/primitives/Button'
import { Alert } from '@shared/ui/primitives/Alert'
import { Dropzone } from '@shared/ui/primitives/DropZone/DropZone'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { INVOKER_FILE_ACCEPT, uploadInvoker } from '@entities/invoker/lib/uploadInvoker'
import { InvokerLibraryOption } from './InvokerLibraryOption'
import '../onboardingIntro.css'

/** Lets the success alert read before the tour moves on. */
const UPLOAD_SUCCESS_ADVANCE_MS = 900

type UploadResult = { fileName: string } & (
    | { kind: 'single'; methodCount: number; authType?: string; version?: string }
    | { kind: 'archive'; invokerCount: number }
)
type FailReason = 'invalidType' | 'tooLarge' | 'archiveTooLarge' | 'emptyArchive'

type FirstInvokerProps = {
    onCreateManually: () => void
    onUploaded: () => void
}

export function FirstInvokerContent({ onCreateManually, onUploaded }: FirstInvokerProps) {
    const { t } = useI18n('onboarding')
    const { t: tEntities } = useI18n('entities')
    const confirm = useConfirm()
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<UploadResult | null>(null)
    const [failedFile, setFailedFile] = useState<string | null>(null)
    const [failReason, setFailReason] = useState<FailReason | null>(null)
    const advanceTimerRef = useRef<number | null>(null)

    useEffect(() => () => {
        if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current)
    }, [])

    const handleFile = async (file: File) => {
        setResult(null)
        setFailedFile(null)
        setFailReason(null)
        setIsUploading(true)
        try {
            const uploaded = await uploadInvoker(file, () => confirm({
                title: tEntities('invoker.list.upload.confirmReplace.title'),
                message: tEntities('invoker.list.upload.confirmReplace.message'),
            }))
            switch (uploaded.status) {
                case 'uploaded':
                    message.success(tEntities('invoker.list.upload.success', { name: file.name }))
                    setResult({ fileName: file.name, kind: 'single', ...uploaded })
                    advanceTimerRef.current = window.setTimeout(onUploaded, UPLOAD_SUCCESS_ADVANCE_MS)
                    break
                case 'uploadedArchive':
                    message.success(tEntities('invoker.list.upload.successArchive', { name: file.name, count: uploaded.ids.length }))
                    setResult({ fileName: file.name, kind: 'archive', invokerCount: uploaded.ids.length })
                    advanceTimerRef.current = window.setTimeout(onUploaded, UPLOAD_SUCCESS_ADVANCE_MS)
                    break
                case 'cancelled':
                    break
                case 'invalidType':
                case 'tooLarge':
                case 'archiveTooLarge':
                case 'emptyArchive':
                    setFailedFile(file.name)
                    setFailReason(uploaded.status)
                    break
                default: {
                    const _exhaustive: never = uploaded
                    return _exhaustive
                }
            }
        } catch (error) {
            console.error(error)
            notifyError(tEntities('invoker.list.upload.error'))
            setFailedFile(file.name)
        } finally {
            setIsUploading(false)
        }
    }

    const resultMeta = !result
        ? ''
        : result.kind === 'archive'
            ? t('content.invoker.invokers', { count: result.invokerCount })
            : [t('content.invoker.methods', { count: result.methodCount }), result.authType, result.version].filter(Boolean).join(' · ')

    return (
        <div>
            <p>{t('content.invoker.body')}</p>
            <div className="onboarding-invoker-options">
                <InvokerLibraryOption />
                <section>
                    <div>
                        <h3>{t('content.invoker.uploadTitle')}</h3>
                        <p>{t('content.invoker.uploadBody')}</p>
                    </div>
                    <div className="onboarding-invoker-upload">
                        <Dropzone
                            accept={INVOKER_FILE_ACCEPT}
                            label={t('content.invoker.drop')}
                            disabled={isUploading}
                            onFiles={files => { if (files[0]) void handleFile(files[0]) }}
                            testId="onboarding-invoker-dropzone"
                            className="onboarding-invoker-dropzone"
                        />
                        {isUploading && (
                            <span className="onboarding-invoker-upload__status">
                                <Loading size="sm" inline /> {t('content.invoker.parsing')}
                            </span>
                        )}
                    </div>
                </section>
                {result && (
                    <Alert
                        type="success"
                        showIcon
                        message={t('content.invoker.fileAdded', { name: result.fileName })}
                        description={`${resultMeta} · ${t('content.invoker.ready')}`}
                    />
                )}
                {failedFile && (
                    <Alert
                        type="error"
                        showIcon
                        message={t('content.invoker.fileError', { name: failedFile })}
                        description={t(failReason ? `content.invoker.${failReason}` : 'content.invoker.chooseAnother')}
                    />
                )}
                <section>
                    <div><h3>{t('content.invoker.manualTitle')}</h3><p>{t('content.invoker.manualBody')}</p></div>
                    <Button type="default" onClick={onCreateManually} testId="onboarding-invoker-manual">{t('content.invoker.manualAction')}</Button>
                </section>
            </div>
        </div>
    )
}
