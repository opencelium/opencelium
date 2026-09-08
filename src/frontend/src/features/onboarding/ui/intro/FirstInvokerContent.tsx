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
import '../onboardingIntro.css'

const INVOKER_ACCEPT = '.xml,text/xml,application/xml'
const GIT_INVOKER_REPO = 'github.com/opencelium/invokers · branch main'
/** Fake latency for the not-yet-implemented git fetch, so the spinner registers. */
const FAKE_GIT_FETCH_MS = 700
/** Lets the success alert read before the tour moves on. */
const UPLOAD_SUCCESS_ADVANCE_MS = 900

type UploadResult = { fileName: string; methodCount: number; authType?: string; version?: string }

type FirstInvokerProps = {
    onCreateManually: () => void
    onUploaded: () => void
    onGitDownloaded: () => void
}

export function FirstInvokerContent({ onCreateManually, onUploaded, onGitDownloaded }: FirstInvokerProps) {
    const { t } = useI18n('onboarding')
    const { t: tEntities } = useI18n('entities')
    const confirm = useConfirm()
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<UploadResult | null>(null)
    const [failedFile, setFailedFile] = useState<string | null>(null)
    const [gitLoading, setGitLoading] = useState(false)
    const advanceTimerRef = useRef<number | null>(null)

    useEffect(() => () => {
        if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current)
    }, [])

    const handleFile = async (file: File) => {
        setResult(null)
        setFailedFile(null)
        if (!file.name.toLowerCase().endsWith('.xml')) {
            setFailedFile(file.name)
            return
        }
        setIsUploading(true)
        try {
            const uploaded = await uploadInvoker(file, () => confirm({
                title: tEntities('invoker.list.upload.confirmReplace.title'),
                message: tEntities('invoker.list.upload.confirmReplace.message'),
            }))
            if (!uploaded) return
            message.success(tEntities('invoker.list.upload.success', { name: file.name }))
            setResult({ fileName: file.name, ...uploaded })
            advanceTimerRef.current = window.setTimeout(onUploaded, UPLOAD_SUCCESS_ADVANCE_MS)
        } catch (error) {
            console.error(error)
            notifyError(tEntities('invoker.list.upload.error'))
            setFailedFile(file.name)
        } finally {
            setIsUploading(false)
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
                        <h3>{t('content.invoker.uploadTitle')} <span className="onboarding-recommended">{t('content.invoker.recommended')}</span></h3>
                        <p>{t('content.invoker.uploadBody')}</p>
                    </div>
                    <div className="onboarding-invoker-upload">
                        <Dropzone
                            accept={INVOKER_ACCEPT}
                            label={t('content.invoker.drop')}
                            hint={t('content.invoker.fileFormat')}
                            disabled={isUploading}
                            onFiles={files => { if (files[0]) void handleFile(files[0]) }}
                            testId="onboarding-invoker-dropzone"
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
                        description={t('content.invoker.chooseAnother')}
                    />
                )}
                <section>
                    <div>
                        <h3>{t('content.invoker.gitTitle')}</h3>
                        <p>{t('content.invoker.gitBody')}</p>
                        <code>{GIT_INVOKER_REPO}</code>
                    </div>
                    {/* STUB: nothing is downloaded. The timer only fakes latency so the
                        spinner registers; OnboardingPreview then splices in a placeholder
                        invoker (STUB_GIT_INVOKER). Swap for the real repository fetch. */}
                    <Button
                        type="default"
                        loading={gitLoading}
                        testId="onboarding-invoker-git"
                        onClick={() => {
                            setGitLoading(true)
                            window.setTimeout(() => { setGitLoading(false); onGitDownloaded() }, FAKE_GIT_FETCH_MS)
                        }}
                    >
                        {t('content.invoker.gitAction')}
                    </Button>
                </section>
                <section>
                    <div><h3>{t('content.invoker.manualTitle')}</h3><p>{t('content.invoker.manualBody')}</p></div>
                    <Button type="default" onClick={onCreateManually} testId="onboarding-invoker-manual">{t('content.invoker.manualAction')}</Button>
                </section>
            </div>
        </div>
    )
}
