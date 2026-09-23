import {useState, type CSSProperties} from 'react'
import {resolveStorageUrl} from '@shared/utils/storageUrl'
import {Icon} from '@shared/ui/primitives/Icon'

type Props = {
    icon: string | null
    size?: number
}

// Inset so the icon doesn't touch the disc edge.
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
    background: hasImage ? '#fff' : 'var(--color-background-surface)',
    border: '1px solid var(--color-border-subtle)',
})

/** A group's icon on a disc, falling back to a generic group glyph when it has none. */
export const RoleIcon = ({icon, size = 28}: Props) => {
    const resolved = resolveStorageUrl(icon)
    const [hasError, setHasError] = useState(false)
    const hasImage = resolved !== null && !hasError
    const imageSize = size - CIRCLE_PADDING * 2

    return (
        <span style={circleStyle(size, hasImage)}>
            {hasImage ? (
                <img
                    src={resolved}
                    alt=""
                    loading="lazy"
                    onError={() => setHasError(true)}
                    style={{objectFit: 'contain', display: 'block', width: imageSize, height: imageSize}}
                />
            ) : (
                <Icon name="team" size={Math.round(size / 2)} color="secondary" />
            )}
        </span>
    )
}
