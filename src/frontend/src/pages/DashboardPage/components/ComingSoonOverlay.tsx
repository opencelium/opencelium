import type { ReactNode } from 'react'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'

type ComingSoonOverlayProps = {
    children: ReactNode
    labelKey?: 'comingSoon' | 'waitingApi'
}

export function ComingSoonOverlay({ children, labelKey = 'comingSoon' }: ComingSoonOverlayProps) {
    const { t } = useI18n('dashboard')
    return (
        <div style={{ position: 'relative' }} aria-disabled>
            <div
                style={{
                    opacity: 0.45,
                    filter: 'grayscale(0.6)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}
            >
                {children}
            </div>
            <div
                style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: '2px 10px',
                    borderRadius: 999,
                    background: 'var(--color-background-surface)',
                    border: '1px solid var(--color-border-subtle)',
                }}
            >
                <Typography variant="caption" isBold isUppercase isSubtle>
                    {t(labelKey)}
                </Typography>
            </div>
        </div>
    )
}
