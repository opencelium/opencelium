import { Button } from '@shared/ui/primitives/Button'
import { InvokerUploadButton, type InvokerUploadButtonHandle } from '@entities/invoker/components/InvokerUploadButton'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { DEVICE_THEME_ID } from '@shared/theme/types'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Trans } from 'react-i18next'
import { Check, Upload } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import './onboardingIntro.css'

export function WelcomeContent({ userName }: { userName: string }) {
    const { t } = useI18n('onboarding')
    return (
        <div>
            <p>{t('content.welcome.lead')} {t('content.welcome.body')}</p>
            <div className="onboarding-duration-row">
                <strong className="onboarding-duration">~2 minutes, 4 phases</strong>
                <span className="onboarding-phase-dots" aria-hidden>
                    {[0, 1, 2, 3].map(index => (
                        <i key={index} className={index === 0 ? 'is-current' : ''} />
                    ))}
                </span>
            </div>
            <div className="onboarding-phases" aria-label="Four onboarding phases">
                {[t('content.welcome.theme'), t('content.welcome.palette'), t('content.welcome.invoker'), t('content.welcome.connector')].map(phase => (
                    <span key={phase}>{phase}</span>
                ))}
            </div>
            <span className="onboarding-visually-hidden">{t('content.welcome.hidden', { name: userName })}</span>
        </div>
    )
}

export function ThemeChoiceContent() {
    const { themeId, setTheme } = useTheme()
    const { t } = useI18n('onboarding')
    const themeGridRef = useRef<HTMLDivElement>(null)
    const options = [
        { id: 'ci-light', label: t('content.theme.light'), description: t('content.theme.lightDescription') },
        { id: 'ci-dark', label: t('content.theme.dark'), description: t('content.theme.darkDescription') },
        { id: DEVICE_THEME_ID, label: t('content.theme.device'), description: t('content.theme.deviceDescription') },
    ]
    const selectedThemeIndex = Math.max(0, options.findIndex(option => option.id === themeId))
    const handleThemeKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
        event.preventDefault()
        const cards = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('.onboarding-theme-card'))
        const currentCard = (event.target as HTMLElement).closest<HTMLElement>('.onboarding-theme-card')
        const currentIndex = Math.max(0, currentCard ? cards.indexOf(currentCard) : 0)
        const direction = event.key === 'ArrowRight' ? 1 : -1
        const nextIndex = (currentIndex + direction + options.length) % options.length
        cards[nextIndex]?.focus()
    }

    useEffect(() => {
        const focusThemeGroup = (event: KeyboardEvent) => {
            if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || themeGridRef.current?.contains(event.target as Node)) return
            event.preventDefault()
            const cards = themeGridRef.current?.querySelectorAll<HTMLElement>('.onboarding-theme-card')
            cards?.[selectedThemeIndex]?.focus()
        }

        window.addEventListener('keydown', focusThemeGroup)
        return () => window.removeEventListener('keydown', focusThemeGroup)
    }, [selectedThemeIndex])

    return (
        <div>
            <p className="onboarding-theme-lead">{t('content.theme.body')}</p>
            <div ref={themeGridRef} className="onboarding-theme-grid" role="radiogroup" aria-label="Theme" onKeyDown={handleThemeKeys}>
            {options.map(option => {
                const selected = themeId === option.id
                return (
                    <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        tabIndex={selected ? 0 : -1}
                        className={`onboarding-theme-card${selected ? ' is-selected' : ''}`}
                        onClick={() => setTheme(option.id)}
                    >
                        <span className={`onboarding-theme-preview onboarding-theme-preview--${option.id}`}>
                            <span className="onboarding-theme-preview__nav"><i /><i /><i /><i /></span>
                            <span className="onboarding-theme-preview__main">
                                <span className="onboarding-theme-preview__top"><i /><i /><i /></span>
                                <i className="onboarding-theme-preview__label" />
                                <span className="onboarding-theme-preview__cards"><i /><i /><i /></span>
                                <i className="onboarding-theme-preview__panel" />
                            </span>
                        </span>
                        <strong><span className="onboarding-theme-icon" aria-hidden>{option.id === 'ci-light' ? '☀️' : option.id === 'ci-dark' ? '🌙' : '🖥️'}</span>{option.label}<i className="onboarding-theme-state">{selected && <Check size={12} strokeWidth={3} />}</i></strong>
                        <span>{option.description}</span>
                    </button>
                )
            })}
            </div>
        </div>
    )
}

export function ThemeFooterNote() {
    return <span>Change it later in <code>/ui/config</code> or with <kbd>Ctrl</kbd> <kbd>K</kbd> <code>ui theme</code></span>
}

export function PaletteContent() {
    const { t } = useI18n('onboarding')
    return (
        <div>
            <p><Trans ns="onboarding" i18nKey="content.palette.body" components={{ strong: <strong /> }} /></p>
            <div className="onboarding-copy-grid">
                <div><strong>{t('content.palette.tokens')}</strong><span>An object, then a verb. Start typing the thing you want to act on.</span><code>connector create</code><code>invoker upload</code><code>schedule run</code></div>
                <div><strong>{t('content.palette.help')}</strong><span>If you forget a command, this is the only one to remember.</span><code className="onboarding-help-token">help</code></div>
            </div>
        </div>
    )
}

export function IntegrationLayersContent() {
    const { t } = useI18n('onboarding')
    return (
        <div>
            <p>{t('content.layers.body')}</p>
            <div className="onboarding-layer-grid">
                <article><small>{t('content.layers.step', { count: 1 })}</small><strong>Invoker</strong><span>{t('content.layers.invoker')}</span><code>jira.xml</code></article>
                <b aria-hidden>→</b>
                <article><small>{t('content.layers.step', { count: 2 })}</small><strong>Connector</strong><span>{t('content.layers.connector')}</span><code>Jira Production</code></article>
                <b aria-hidden>→</b>
                <article><small>{t('content.layers.step', { count: 3 })}</small><strong>Workflow</strong><span>{t('content.layers.workflow')}</span><code>Jira → Zendesk Sync</code></article>
            </div>
        </div>
    )
}

export function FirstInvokerContent({ onCreateManually, onUploaded }: { onCreateManually: () => void; onUploaded: () => void }) {
    const { t } = useI18n('onboarding')
    const uploadRef = useRef<InvokerUploadButtonHandle>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadState, setUploadState] = useState<'idle' | 'success' | 'error'>('idle')
    const [fileName, setFileName] = useState('')
    const [uploadMetadata, setUploadMetadata] = useState<{ methodCount: number; authType?: string; version?: string } | null>(null)
    const advanceTimerRef = useRef<number | null>(null)

    useEffect(() => () => {
        if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current)
    }, [])

    const preventFileOpen = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
    }

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        preventFileOpen(event)
        setIsDragging(false)
        const file = event.dataTransfer.files?.[0]
        if (!file) return
        setFileName(file.name)
        if (!file.name.toLowerCase().endsWith('.xml')) {
            setUploadState('error')
            return
        }
        setUploadState('idle')
        void uploadRef.current?.upload(file)
    }

    return (
        <div>
            <p>{t('content.invoker.body')}</p>
            <div className="onboarding-invoker-grid">
                <section className="is-recommended">
                    <h3>{t('content.invoker.uploadTitle')} <span className="onboarding-recommended">{t('content.invoker.recommended')}</span></h3>
                    <p>{t('content.invoker.uploadBody')}</p>
                    <div
                        className={`onboarding-dropzone${isDragging ? ' is-dragging' : ''}${uploadState === 'success' ? ' is-success' : ''}${uploadState === 'error' ? ' is-error' : ''}`}
                        onDragEnter={event => { preventFileOpen(event); setFileName(event.dataTransfer.files?.[0]?.name ?? ''); setIsDragging(true) }}
                        onDragOver={preventFileOpen}
                        onDragLeave={event => { preventFileOpen(event); setIsDragging(false) }}
                        onDrop={handleDrop}
                    >
                        {uploadState === 'success' ? (
                            <><strong>✓ {fileName} added</strong><small>{[`${uploadMetadata?.methodCount ?? 0} methods`, uploadMetadata?.authType, uploadMetadata?.version].filter(Boolean).join(' · ')}</small><small>Ready to use in a connector.</small></>
                        ) : uploadState === 'error' ? (
                            <><strong>× Could not read {fileName}</strong><small>Invokers are .xml. JSON invokers are not supported yet.</small><b>Choose another file</b></>
                        ) : isUploading ? (
                            <><strong>{fileName}</strong><span className="onboarding-upload-progress"><i /></span><small>Parsing endpoints…</small></>
                        ) : (
                            <><Upload size={22} strokeWidth={1.8} aria-hidden /><strong>{isDragging ? 'Release to upload' : 'Drop an .xml file here'}</strong><small>{isDragging ? fileName : <>or <em>browse your machine</em> · max 2 MB</>}</small></>
                        )}
                        <InvokerUploadButton
                            ref={uploadRef}
                            onLoadingChange={(loading, file) => { setFileName(file.name); setIsUploading(loading) }}
                            onUploadResult={(result, file, metadata) => {
                                setFileName(file.name)
                                setUploadMetadata(metadata ?? null)
                                setUploadState(result === 'success' ? 'success' : result === 'error' ? 'error' : 'idle')
                                if (result === 'success') advanceTimerRef.current = window.setTimeout(onUploaded, 900)
                            }}
                        />
                    </div>
                    <div className="onboarding-template-tags"><span>jira.xml</span><span>zendesk.xml</span><span>sap_businessone.xml</span><span>hubspot.xml</span></div>
                </section>
                <section>
                    <h3>{t('content.invoker.manualTitle')}</h3>
                    <p>{t('content.invoker.manualBody')}</p>
                    <ol><li>Name the API and its base URL</li><li>Add an authentication method</li><li>Declare one method per endpoint</li></ol>
                    <Button type="default" onClick={onCreateManually}>{t('content.invoker.manualAction')}</Button>
                    <small className="onboarding-manual-time">Around 15 minutes for a small API.</small>
                </section>
            </div>
        </div>
    )
}

export function ExistingInvokersContent({ invokers }: { invokers: Array<{ name: string; methodCount: number }> }) {
    const { t } = useI18n('onboarding')
    const names = invokers.map(invoker => invoker.name).join(', ')
    return (
        <div>
            <p>{names} are described and ready, so we are skipping the upload step. You can add more at any time.</p>
            <div className="onboarding-invoker-tags">
                {invokers.map(invoker => <span key={invoker.name}>{invoker.name} · {t('content.invoker.methods', { count: invoker.methodCount })}</span>)}
            </div>
            <code className="onboarding-command-hint">{t('content.invoker.commandHint')}</code>
        </div>
    )
}
