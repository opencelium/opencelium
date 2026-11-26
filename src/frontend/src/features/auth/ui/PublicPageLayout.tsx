import type { ReactNode } from 'react'
import { AppLogo } from '@features/branding/AppLogo'
import { LanguageToggle } from '@features/user/language/LanguageToggle'
import { AppFooter } from '@shared/ui/layout/AppFooter'

/** Signed-out page shell: centered logo and content, footer with a language switch. */
export function PublicPageLayout({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                background: 'var(--color-background-app)',
            }}
        >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                    <AppLogo />
                    {children}
                </div>
            </div>
            <AppFooter hasBorder={false} leadingSlot={<LanguageToggle testId="footer-language" />} />
        </div>
    )
}
