import {useEffect, useMemo, useRef, useState, type ChangeEvent} from 'react'
import {useFormContext, useWatch} from 'react-hook-form'
import connectorWizardImage from '@/assets/images/wizard/connector.gif'
import type {Mode} from '@/engine/entity/EntityDefinition'
import {resolveConnectorIconUrl} from '@entities/connector/model/iconUrl'
import {Icon} from '@shared/ui/primitives/Icon'
import {IconButton} from '@shared/ui/primitives/IconButton'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {useI18n} from '@shared/i18n/hooks/useI18n'

const ACCEPT = 'image/png,image/jpeg'

const isFileValue = (value: unknown): value is File =>
    typeof File !== 'undefined' && value instanceof File

const wrapperStyle = {
    width: 260,
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'right',
} as const

// Square frame keeps the radius a true circle regardless of the
// image's aspect ratio; the image sits slightly inset so it isn't cropped.
const frameStyle = {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: 'white',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
} as const

const imgStyle = {
    width: '85%',
    height: '85%',
    objectFit: 'contain',
} as const

const overlayStyle = (visible: boolean) =>
    ({
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.45)',
        color: '#fff',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.15s ease',
        cursor: 'pointer',
    }) as const

const deleteButtonStyle = {
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 1,
    background: 'var(--color-bg-elevated, #fff)',
    borderRadius: '50%',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)',
} as const

type Props = {
    mode?: Mode
}

export const ConnectorWizardImage = ({mode}: Props) => {
    const {setValue} = useFormContext()
    const {t} = useI18n('entities')
    const inputRef = useRef<HTMLInputElement>(null)
    const [hovered, setHovered] = useState(false)

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

    let src: string = connectorWizardImage
    if (objectUrl) {
        src = objectUrl
    } else if (typeof selected === 'string' && selected.trim()) {
        src = resolveConnectorIconUrl(selected) ?? connectorWizardImage
    }

    const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null
        if (file) setValue('icon', file, {shouldDirty: true})
        // Reset so picking the same file again still fires onChange.
        event.target.value = ''
    }

    const handleDelete = () => setValue('icon', null, {shouldDirty: true})

    const openPicker = () => inputRef.current?.click()

    return (
        <div style={wrapperStyle}>
            <div
                style={frameStyle}
                onMouseEnter={() => interactive && setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <img src={src} alt="connector icon" style={imgStyle} />

                {interactive && (
                    <>
                        <Tooltip content={t('connector.fields.icon.uploadHint')}>
                            <div
                                style={overlayStyle(hovered)}
                                onClick={openPicker}
                                role="button"
                                aria-label={t('connector.fields.icon.uploadHint')}
                                data-testid="connector-icon-upload"
                            >
                                <Icon name="upload" size={26} color="inherit" />
                            </div>
                        </Tooltip>

                        {hasIcon && (
                            <div style={deleteButtonStyle}>
                                <Tooltip content={t('connector.fields.icon.delete')}>
                                    <IconButton
                                        size="xs"
                                        iconProps={{name: 'delete', color: 'danger'}}
                                        onClick={handleDelete}
                                        testId="connector-icon-delete"
                                    />
                                </Tooltip>
                            </div>
                        )}

                        <input
                            ref={inputRef}
                            type="file"
                            accept={ACCEPT}
                            style={{display: 'none'}}
                            onChange={handlePick}
                            data-testid="connector-icon-input"
                        />
                    </>
                )}
            </div>
        </div>
    )
}
