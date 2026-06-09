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
    justifyContent: 'right',
} as const

// Square frame keeps the radius a true circle regardless of the
// image's aspect ratio; the image sits slightly inset so it isn't cropped.
const frameStyle = {
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
