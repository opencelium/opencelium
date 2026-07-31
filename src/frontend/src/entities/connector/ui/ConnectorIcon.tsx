import {useState, type CSSProperties} from 'react'
import {defaultConnectorImage, resolveConnectorIconUrl} from '@entities/connector/model/iconUrl'

type Props = {
    icon: unknown
    size?: number
    style?: CSSProperties
}

const baseStyle: CSSProperties = {
    objectFit: 'contain',
    display: 'block',
}

export const ConnectorIcon = ({icon, size = 28, style}: Props) => {
    const resolved = resolveConnectorIconUrl(typeof icon === 'string' ? icon : null)
    const [hasError, setHasError] = useState(false)
    const src = !resolved || hasError ? defaultConnectorImage : resolved

    return (
        <img
            src={src}
            alt=""
            loading="lazy"
            onError={() => setHasError(true)}
            style={{...baseStyle, width: size, height: size, ...style}}
        />
    )
}
