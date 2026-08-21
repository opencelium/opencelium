import { useState } from 'react'
import { ColorPicker, message } from 'antd'
import type { CustomThemeSeeds } from '@shared/theme/palette/customPalette'
import {
    CUSTOM_THEME_IDS,
    hasCustomTheme,
    removeCustomTheme,
} from '@shared/theme/registry/customTheme'
import { themeRegistry } from '@shared/theme/registry/themeRegistry'
import { readCustomThemeSeeds, readSystemThemeSeeds } from '@shared/theme/themeStorage'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { useIsAdmin } from '@features/auth/useIsAdmin'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Button } from '@shared/ui/primitives/Button'
import { FormControl } from '@shared/ui/form/FormControl'
import { Hint } from '@shared/ui/primitives/Hint'
import { Typography } from '@shared/ui/primitives/Typography'
import { useSystemThemeAdmin } from '@entities/ui/ui/useSystemThemeAdmin'

const DEFAULT_SEEDS: Required<CustomThemeSeeds> = {
    primary: '#1677ff',
    accent: '#2f54eb',
    neutral: '#8c8c8c',
    sidebar: '#2c3d49',
}

const SEED_FIELDS: { key: keyof CustomThemeSeeds; labelKey: string }[] = [
    { key: 'primary', labelKey: 'ui.customTheme.primary' },
    { key: 'accent', labelKey: 'ui.customTheme.accent' },
    { key: 'neutral', labelKey: 'ui.customTheme.neutral' },
    { key: 'sidebar', labelKey: 'ui.customTheme.sidebar' },
]

/**
 * Theme colour editor. Admin-only: the colours it edits are saved as the system theme
 * (`theme_colors`) for every user, and letting a regular user repaint their own copy of
 * the app is not what the branding feature is for.
 *
 * There is deliberately one apply button rather than a local one beside a publish one:
 * the seeds only ever had a single destination, so "try it here first" was a distinction
 * without a difference — see `useSystemThemeAdmin.save`, which activates what it saves.
 */
export const CustomThemeSection = () => {
    const isAdmin = useIsAdmin()
    const { t: tEntities } = useI18n('entities')
    const { themeId, themeMode, setTheme } = useTheme()
    // The saved system theme is what the editor edits, so it loads those seeds — falling
    // back to a legacy personal set, then to the defaults. Spread over the defaults so
    // seeds stored before the sidebar color existed still populate all pickers.
    const [seeds, setSeeds] = useState<CustomThemeSeeds>(() => ({
        ...DEFAULT_SEEDS,
        ...(readSystemThemeSeeds() ?? readCustomThemeSeeds()),
    }))
    // A personal custom theme can only exist from before this editor became admin-only
    // and single-button; the remove action stays so such a browser has a way out of it.
    const [hasPersonalTheme, setHasPersonalTheme] = useState(hasCustomTheme)
    const {
        isConfigured,
        isPersonalThemeActive,
        isBusy,
        isSaving,
        isResetting,
        save,
        reset,
        activateSystemTheme,
    } = useSystemThemeAdmin(seeds)

    if (!isAdmin) return null

    const isCustomActive = themeId === CUSTOM_THEME_IDS.light || themeId === CUSTOM_THEME_IDS.dark

    const handleRemovePersonal = () => {
        removeCustomTheme()
        setHasPersonalTheme(false)
        if (isCustomActive) {
            const defaultFamily = themeRegistry.getDefault().family
            const fallback =
                themeRegistry.getAll().find(def => def.family === defaultFamily && def.mode === themeMode) ??
                themeRegistry.getDefault()
            setTheme(fallback.id)
        }
        message.success(tEntities('ui.customTheme.removed'))
    }

    return (
        // FormControl gives the block the exact label styling of the
        // surrounding wizard fields, so the editor reads as one more form row.
        <FormControl label="ui.customTheme.title">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                <Typography variant="body" isSubtle>
                    {tEntities('ui.customTheme.description')}
                </Typography>

                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {SEED_FIELDS.map(field => (
                        <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Typography variant="caption" isSubtle>{tEntities(field.labelKey)}</Typography>
                            <ColorPicker
                                value={seeds[field.key]}
                                disabledAlpha
                                showText
                                onChange={value =>
                                    setSeeds(current => ({ ...current, [field.key]: value.toHexString() }))
                                }
                            />
                        </div>
                    ))}
                </div>

                {isConfigured && isPersonalThemeActive && (
                    <Hint noPrefix>
                        {tEntities('ui.systemTheme.personalOverride')}
                    </Hint>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                        type="primary"
                        loading={isSaving}
                        disabled={isBusy}
                        onClick={save}
                        testId="ui-system-theme-save"
                    >
                        {tEntities('ui.systemTheme.save')}
                    </Button>
                    {isConfigured && (
                        <Button
                            loading={isResetting}
                            disabled={isBusy}
                            onClick={reset}
                            testId="ui-system-theme-reset"
                        >
                            {tEntities('ui.systemTheme.reset')}
                        </Button>
                    )}
                    {isConfigured && isPersonalThemeActive && (
                        <Button disabled={isBusy} onClick={activateSystemTheme} testId="ui-system-theme-use">
                            {tEntities('ui.systemTheme.use')}
                        </Button>
                    )}
                    {hasPersonalTheme && (
                        <Button disabled={isBusy} onClick={handleRemovePersonal}>
                            {tEntities('ui.customTheme.remove')}
                        </Button>
                    )}
                </div>
            </div>
        </FormControl>
    )
}
