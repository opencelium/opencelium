import { useEffect, useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { DEVICE_THEME_ID, DEVICE_THEME_LABEL } from '@shared/theme/types'
import { themeRegistry } from '@shared/theme/registry/themeRegistry'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Icon } from '@shared/ui/primitives/Icon'
import '../onboardingIntro.css'

const CARD_SELECTOR = '.onboarding-theme-card'

/**
 * Options come from the registry (same shape the /ui/config picker uses), so a
 * custom or org theme shows up here too. The preview mock only knows a light and
 * a dark look, so it keys off the definition's `mode` rather than its id.
 */
function useThemeOptions() {
    const { t } = useI18n('onboarding')
    return useMemo(() => [
        ...themeRegistry.getAll().map(def => ({
            id: def.id,
            label: def.label,
            preview: def.mode,
            description: def.mode === 'dark' ? t('content.theme.darkDescription') : t('content.theme.lightDescription'),
        })),
        {
            id: DEVICE_THEME_ID,
            label: DEVICE_THEME_LABEL,
            preview: 'device' as const,
            description: t('content.theme.deviceDescription'),
        },
    ], [t])
}

function ThemePreview({ variant }: { variant: 'light' | 'dark' | 'device' }) {
    return (
        <span className={`onboarding-theme-preview onboarding-theme-preview--${variant}`} aria-hidden>
            <span className="onboarding-theme-preview__nav"><i /><i /><i /><i /></span>
            <span className="onboarding-theme-preview__main">
                <span className="onboarding-theme-preview__top"><i /><i /><i /></span>
                <i className="onboarding-theme-preview__label" />
                <span className="onboarding-theme-preview__cards"><i /><i /><i /></span>
                <i className="onboarding-theme-preview__panel" />
            </span>
        </span>
    )
}

export function ThemeChoiceContent() {
    const { themeId, setTheme } = useTheme()
    const { t } = useI18n('onboarding')
    const options = useThemeOptions()
    const gridRef = useRef<HTMLDivElement>(null)
    const selectedIndex = Math.max(0, options.findIndex(option => option.id === themeId))

    const moveFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
        event.preventDefault()
        const cards = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(CARD_SELECTOR))
        const currentCard = (event.target as HTMLElement).closest<HTMLElement>(CARD_SELECTOR)
        const currentIndex = Math.max(0, currentCard ? cards.indexOf(currentCard) : 0)
        const direction = event.key === 'ArrowRight' ? 1 : -1
        cards[(currentIndex + direction + cards.length) % cards.length]?.focus()
    }

    // Arrow keys anywhere in the step jump into the group, since the tooltip's
    // own footer buttons hold focus when the step opens.
    useEffect(() => {
        const focusGroup = (event: KeyboardEvent) => {
            if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || gridRef.current?.contains(event.target as Node)) return
            event.preventDefault()
            gridRef.current?.querySelectorAll<HTMLElement>(CARD_SELECTOR)[selectedIndex]?.focus()
        }
        window.addEventListener('keydown', focusGroup)
        return () => window.removeEventListener('keydown', focusGroup)
    }, [selectedIndex])

    return (
        <div>
            <p className="onboarding-theme-lead">{t('content.theme.body')}</p>
            <div
                ref={gridRef}
                className="onboarding-theme-grid"
                role="radiogroup"
                aria-label={t('content.theme.groupLabel')}
                onKeyDown={moveFocus}
            >
                {options.map(option => {
                    const selected = themeId === option.id
                    return (
                        <button
                            key={option.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            tabIndex={selected ? 0 : -1}
                            className={`onboarding-theme-card${selected ? ' is-selected' : ''}`}
                            onClick={() => setTheme(option.id)}
                            data-testid={`onboarding-theme-${option.id}`}
                        >
                            <ThemePreview variant={option.preview} />
                            <strong>
                                {option.label}
                                <i className="onboarding-theme-state">{selected && <Icon name="check" size={12} color="inherit" />}</i>
                            </strong>
                            <span className="onboarding-theme-description">{option.description}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

