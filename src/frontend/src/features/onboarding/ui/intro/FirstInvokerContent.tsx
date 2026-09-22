import { useEffect, useRef, useState } from 'react'
import { message } from 'antd'
import { Button } from '@shared/ui/primitives/Button'
import { Alert } from '@shared/ui/primitives/Alert'
import { Dropzone } from '@shared/ui/primitives/DropZone/DropZone'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { uploadInvoker } from '@entities/invoker/lib/uploadInvoker'
import { useDownloadInvokersFromRepositoryMutation } from '@entities/invoker/api/invokerApi'
import '../onboardingIntro.css'

const INVOKER_ACCEPT = '.xml,text/xml,application/xml'
const GIT_INVOKER_REPO = 'github.com/opencelium/invoker · branch main'
/** Lets the success alert read before the tour moves on. */
const UPLOAD_SUCCESS_ADVANCE_MS = 900

type UploadResult = { fileName: string; methodCount: number; authType?: string; version?: string }

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
    const [failReason, setFailReason] = useState<'invalidType' | 'tooLarge' | null>(null)
    const [downloadFromRepository, { isLoading: isDownloadingFromGit }] = useDownloadInvokersFromRepositoryMutation()
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
                    setResult({ fileName: file.name, ...uploaded })
                    advanceTimerRef.current = window.setTimeout(onUploaded, UPLOAD_SUCCESS_ADVANCE_MS)
                    break
                case 'cancelled':
                    break
                case 'invalidType':
                    setFailedFile(file.name)
                    setFailReason('invalidType')
                    break
                case 'tooLarge':
                    setFailedFile(file.name)
                    setFailReason('tooLarge')
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

    /**
     * Reports the outcome with toasts rather than inline alerts: a run that installs
     * anything refetches the invoker list, and the tour then swaps this step for its
     * "you already have invokers" variant — an alert rendered here would vanish with
     * it. The `reason` strings are backend-authored sentences, so they are shown as
     * they arrive rather than mapped to keys.
     */
    const handleDownloadFromGit = async () => {
        try {
            const { installed, failed } = await downloadFromRepository().unwrap()
            if (installed.length > 0) {
                message.success(t('content.invoker.gitSuccess', { count: installed.length }))
            } else if (failed.length === 0) {
                message.info(t('content.invoker.gitEmpty'))
            }
            if (failed.length > 0) {
                notifyError(
                    failed.map(failure => `${failure.fileName}: ${failure.reason}`).join('\n'),
                    undefined,
                    t('content.invoker.gitFailed', { count: failed.length }),
                )
            }
        } catch (error) {
            console.error(error)
            notifyError(t('content.invoker.gitError'))
        }
    }

    const resultMeta = result
        ? [t('content.invoker.methods', { count: result.methodCount }), result.authType, result.version].filter(Boolean).join(' · ')
        : ''

    return (
        <div>
            <p>{t('content.invoker.body')}</p>
            <div className="onboarding-invoker-options">
                <section className="is-recommended">
                    <div>
                        <h3>{t('content.invoker.gitTitle')} <span className="onboarding-recommended">{t('content.invoker.recommended')}</span></h3>
                        <p>{t('content.invoker.gitBody')}</p>
                        <code>{GIT_INVOKER_REPO}</code>
                    </div>
                    <Button
                        type="default"
                        loading={isDownloadingFromGit}
                        disabled={isDownloadingFromGit}
                        testId="onboarding-invoker-git"
                        onClick={handleDownloadFromGit}
                    >
                        {t('content.invoker.gitAction')}
                    </Button>
                </section>
                <section>
                    <div>
                        <h3>{t('content.invoker.uploadTitle')}</h3>
                        <p>{t('content.invoker.uploadBody')}</p>
                    </div>
                    <div className="onboarding-invoker-upload">
                        <Dropzone
                            accept={INVOKER_ACCEPT}
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
                        description={
                            failReason === 'tooLarge'
                                ? t('content.invoker.tooLarge')
                                : failReason === 'invalidType'
                                    ? t('content.invoker.invalidType')
                                    : t('content.invoker.chooseAnother')
                        }
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
