import {useEffect, useMemo, useRef, type ChangeEvent} from 'react'
import {useFormContext, useWatch} from 'react-hook-form'
import type {Mode} from '@/engine/entity/EntityDefinition'
import {resolveConnectorIconUrl} from '@entities/connector/model/iconUrl'
import {Icon} from '@shared/ui/primitives/Icon'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {useConfirm} from '@shared/ui/confirm/ConfirmDialogContext'
import {useI18n} from '@shared/i18n/hooks/useI18n'

const ACCEPT = 'image/png,image/jpeg'

const isFileValue = (value: unknown): value is File =>
    typeof File !== 'undefined' && value instanceof File

const displayNameFor = (selected: unknown): string => {
    if (isFileValue(selected)) return selected.name
    if (typeof selected === 'string' && selected.trim()) {
        return selected.split('/').pop() || selected
    }
    return ''
}

// The header slot this renders into is a fixed 260x120 box (see StepHeader).
// The filename is shown as a caption bar inside the tile (not below it) so the
// tile can use nearly the full 120px height without overflowing that box.
const wrapperStyle = {
    width: 260,
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
} as const

const tileStyle = {
    position: 'relative',
    width: 114,
    height: 114,
    borderRadius: 16,
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
} as const

const emptyTileStyle = {
    background: 'var(--color-background-surface)',
    border: '1.5px dashed var(--color-border-default)',
    transition: 'border-color 0.15s ease, background 0.15s ease',
} as const

const filledTileStyle = {
    background: 'var(--color-background-surface)',
} as const

const imgStyle = {
    width: '94%',
    height: '94%',
    objectFit: 'contain',
    transition: 'opacity 0.15s ease',
} as const

const overlayStyle = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0,
    transition: 'opacity 0.15s ease',
} as const

const actionChipStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    padding: 0,
    borderRadius: '50%',
    background: 'rgba(20, 23, 29, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
} as const

const actionChipDangerStyle = {
    ...actionChipStyle,
    color: '#f0808a',
} as const

const filenameStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: '10px 8px 5px',
    fontSize: 10.5,
    color: '#fff',
    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0))',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
} as const

type Props = {
    mode?: Mode
}

export const ConnectorWizardImage = ({mode}: Props) => {
    const {setValue} = useFormContext()
    const {t} = useI18n('entities')
    const confirm = useConfirm()
    const inputRef = useRef<HTMLInputElement>(null)

    const iconValue = useWatch({name: 'icon'})
    const selected = Array.isArray(iconValue) ? iconValue[0] : iconValue

    const objectUrl = useMemo(
        () => (isFileValue(selected) ? URL.createObjectURL(selected) : null),
        [selected],
    )
    useEffect(() => {
        if (!objectUrl) return
        return () => URL.revokeObjectURL(objectUrl)
    }, [objectUrl])

    const interactive = mode !== 'view'
    const hasIcon =
        objectUrl !== null || (typeof selected === 'string' && selected.trim().length > 0)

    const src = objectUrl ?? (typeof selected === 'string' ? resolveConnectorIconUrl(selected) : null)
    const fileName = displayNameFor(selected)

    const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null
        if (file) setValue('icon', file, {shouldDirty: true})
        // Reset so picking the same file again still fires onChange.
        event.target.value = ''
    }

    const openPicker = () => inputRef.current?.click()

    const handleDelete = async () => {
        const ok = await confirm({
            title: t('connector.fields.icon.confirmDelete.title'),
            message: t('connector.fields.icon.confirmDelete.message'),
        })
        if (!ok) return
        setValue('icon', null, {shouldDirty: true})
    }

    return (
        <div style={wrapperStyle}>
            {hasIcon && src ? (
                <div className="oc-connector-icon-tile" style={{...tileStyle, ...filledTileStyle}}>
                    <img className="oc-connector-icon-image" src={src} alt="connector icon" style={imgStyle} />

                    {fileName && (
                        <span style={filenameStyle}>{fileName}</span>
                    )}

                    {interactive && (
                        <div className="oc-connector-icon-overlay" style={overlayStyle}>
                            <Tooltip content={t('connector.fields.icon.replace')}>
                                <button
                                    type="button"
                                    className="oc-connector-icon-action"
                                    style={actionChipStyle}
                                    onClick={openPicker}
                                    data-testid="connector-icon-upload"
                                >
                                    <Icon name="upload" size={18} color="inherit" />
                                </button>
                            </Tooltip>
                            <Tooltip content={t('connector.fields.icon.delete')}>
                                <button
                                    type="button"
                                    className="oc-connector-icon-action"
                                    style={actionChipDangerStyle}
                                    onClick={handleDelete}
                                    data-testid="connector-icon-delete"
                                >
                                    <Icon name="delete" size={18} color="inherit" />
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    className="oc-connector-icon-tile oc-connector-icon-tile--empty"
                    style={{...tileStyle, ...emptyTileStyle, cursor: interactive ? 'pointer' : 'default'}}
                    onClick={interactive ? openPicker : undefined}
                    disabled={!interactive}
                    data-testid="connector-icon-upload"
                >
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 8}}>
                        <Icon name="upload" size={20} color="primary" />
                        <span style={{fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2}}>
                            {t('connector.fields.icon.uploadButton')}
                        </span>
                        <span style={{fontSize: 9, color: 'var(--color-text-secondary)', lineHeight: 1.2}}>
                            {t('connector.fields.icon.hint')}
                        </span>
                    </div>
                </button>
            )}

            {interactive && (
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT}
                    style={{display: 'none'}}
                    onChange={handlePick}
                    data-testid="connector-icon-input"
                />
            )}

            <style>{`
                .oc-connector-icon-tile--empty:hover,
                .oc-connector-icon-tile--empty:focus-visible {
                    border-color: var(--color-action-primary);
                    background: var(--color-background-hover);
                }
                .oc-connector-icon-tile:hover .oc-connector-icon-image,
                .oc-connector-icon-tile:focus-within .oc-connector-icon-image {
                    opacity: 0.35 !important;
                }
                .oc-connector-icon-tile:hover .oc-connector-icon-overlay,
                .oc-connector-icon-tile:focus-within .oc-connector-icon-overlay {
                    opacity: 1 !important;
                }
                .oc-connector-icon-action:hover {
                    background: rgba(35, 40, 48, 0.95) !important;
                }
            `}</style>
        </div>
    )
}
