import {useState, type CSSProperties} from 'react'
import {defaultConnectorImage, resolveConnectorIconUrl} from '@entities/connector/model/iconUrl'

type Props = {
    icon: unknown
    size?: number
    style?: CSSProperties
    /** Sets the icon on a white disc, the way the workflow method node presents it —
     * connector logos are drawn for a light ground, so they stay legible in dark mode. */
    isCircled?: boolean
}

const baseStyle: CSSProperties = {
    objectFit: 'contain',
    display: 'block',
}

// Inset so the logo doesn't touch the disc edge.
const CIRCLE_PADDING = 4

const circleStyle = (size: number): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 auto',
    width: size,
    height: size,
    borderRadius: '50%',
    background: '#fff',
    // Without a border the disc disappears into a light-theme row.
    border: '1px solid var(--color-border-subtle)',
})

export const ConnectorIcon = ({icon, size = 28, style, isCircled}: Props) => {
    const resolved = resolveConnectorIconUrl(typeof icon === 'string' ? icon : null)
    const [hasError, setHasError] = useState(false)
    const src = !resolved || hasError ? defaultConnectorImage : resolved
    const imageSize = isCircled ? size - CIRCLE_PADDING * 2 : size

    const image = (
        <img
            src={src}
            alt=""
            loading="lazy"
            onError={() => setHasError(true)}
            style={{...baseStyle, width: imageSize, height: imageSize, ...style}}
        />
    )

    return isCircled ? <span style={circleStyle(size)}>{image}</span> : image
}
