import { useEffect, useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import connectorWizardImage from '@/assets/images/wizard/connector.gif'
import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl'

const isFileValue = (value: unknown): value is File =>
    typeof File !== 'undefined' && value instanceof File

const wrapperStyle = {
    width: 260,
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
} as const

const frameStyle = {
    width: 120,
    height: 120,
    border: '5px solid var(--color-border-strong)',
    borderRadius: '50%',
    boxSizing: 'border-box',
    background: 'var(--color-background-surface)',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
} as const

const imgStyle = {
    height: '100%',
    objectFit: 'contain',
    display: 'block',
} as const

export const ConnectorWizardImage = () => {
    const iconValue = useWatch({ name: 'icon' })
    const selected = Array.isArray(iconValue) ? iconValue[0] : iconValue

    const objectUrl = useMemo(
        () => (isFileValue(selected) ? URL.createObjectURL(selected) : null),
        [selected],
    )
    useEffect(() => {
        if (!objectUrl) return
        return () => URL.revokeObjectURL(objectUrl)
    }, [objectUrl])

    let src: string = connectorWizardImage
    if (objectUrl) {
        src = objectUrl
    } else if (typeof selected === 'string' && selected.trim()) {
        src = resolveConnectorIconUrl(selected) ?? connectorWizardImage
    }

    return (
        <div style={wrapperStyle}>
            <div style={frameStyle}>
                <img src={src} alt="wizard" style={imgStyle} />
            </div>
        </div>
    )
}
