import { useState, type CSSProperties } from 'react'
import { FastColor } from '@ant-design/fast-color'
import colorLogoImage from '@assets/images/login_logo.png'
import whiteLogoImage from '@assets/images/logo_oc_white.png'
import { useAppLogoStore } from '@features/branding/appLogoStore'
import { useTheme } from '@shared/theme/hooks/useTheme'

type Props = {
    /** Rendered height in px; the width follows the logo's own aspect ratio. */
    height?: number
    /**
     * Background this logo sits on, deciding which bundled ink stays legible. Defaults to
     * the page background — pass the surface explicitly wherever it differs, as the
     * sidebar's does (it can carry a brand-dark rail on an otherwise light theme).
     */
    surfaceColor?: string
    style?: CSSProperties
    testId?: string
}

/**
 * The application logo: the admin-uploaded one when the org has set one, otherwise the
 * bundled OpenCelium logo. A stored file that no longer loads (removed on another client,
 * cache older than the server) falls back to the default rather than showing a broken
 * image — the cache itself is corrected by `SystemLogoSync` on the next authenticated load.
 *
 * The bundled logo exists in two single-ink variants, so the legible one is picked from the
 * surface's own darkness (the same `isDark()` test the sidebar's foreground tones use):
 * the white file disappears on a light ground and the coloured one muddies on a dark one.
 * An uploaded logo is a single file and gets no such treatment, which is why the upload
 * hint asks for one that works on both themes.
 */
export const AppLogo = ({ height = 56, surfaceColor, style, testId = 'app-logo' }: Props) => {
    const logoUrl = useAppLogoStore(state => state.logoUrl)
    const { theme } = useTheme()
    const [hasError, setHasError] = useState(false)

    const surface = surfaceColor ?? theme.color.background.app
    const defaultLogoImage = new FastColor(surface).isDark() ? whiteLogoImage : colorLogoImage

    return (
        <img
            src={!logoUrl || hasError ? defaultLogoImage : logoUrl}
            alt="OpenCelium"
            onError={() => setHasError(true)}
            style={{ height, width: 'auto', maxWidth: '100%', objectFit: 'contain', ...style }}
            data-testid={testId}
        />
    )
}
