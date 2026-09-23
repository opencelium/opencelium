import {useState, type CSSProperties} from 'react'
import {resolveStorageUrl} from '@shared/utils/storageUrl'
import {Icon} from '@shared/ui/primitives/Icon'
import type {IconName} from '@shared/ui/primitives/Icon/Icon.types'

type Props = {
    /** A stored path (`./storage/files/<file>`) or any loadable URL; null shows the fallback. */
    path: string | null | undefined
    fallbackIcon: IconName
    size?: number
    /** `contain` insets a logo inside the disc; `cover` fills it (photos). */
    fit?: 'contain' | 'cover'
}

// Inset so a contained logo doesn't touch the disc edge.
const CIRCLE_PADDING = 4

// Same disc as ConnectorIcon's `isCircled`: images are drawn for a light ground, so the
// disc stays white in dark mode too. Without a border it disappears into a light row.
const circleStyle = (size: number, hasImage: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 auto',
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    background: hasImage ? '#fff' : 'var(--color-background-surface)',
    border: '1px solid var(--color-border-subtle)',
})

/** An entity's stored image on a disc, falling back to a generic glyph when it has none. */
export const EntityAvatar = ({path, fallbackIcon, size = 28, fit = 'contain'}: Props) => {
    const resolved = resolveStorageUrl(path)
    const [failedSrc, setFailedSrc] = useState<string | null>(null)
    const hasImage = resolved !== null && resolved !== failedSrc
    const imageSize = fit === 'cover' ? size : size - CIRCLE_PADDING * 2

    return (
        <span style={circleStyle(size, hasImage)}>
            {hasImage ? (
                <img
                    src={resolved}
                    alt=""
                    loading="lazy"
                    onError={() => setFailedSrc(resolved)}
                    style={{objectFit: fit, display: 'block', width: imageSize, height: imageSize}}
                />
            ) : (
                <Icon name={fallbackIcon} size={Math.round(size / 2)} color="secondary" />
            )}
        </span>
    )
}
