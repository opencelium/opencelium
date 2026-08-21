import { useSystemThemeAdmin } from '@entities/ui/ui/useSystemThemeAdmin'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { CustomThemeSeeds } from '@shared/theme/palette/customPalette'
import { Button } from '@shared/ui/primitives/Button'
import { Divider } from '@shared/ui/primitives/Divider'
import { Hint } from '@shared/ui/primitives/Hint'
import { Typography } from '@shared/ui/primitives/Typography'

type Props = {
    /** The seeds currently in the editor above — saved as-is, unapplied changes included. */
    seeds: CustomThemeSeeds
}

/**
 * Admin-only footer of the theme editor: stores the edited colors as the system theme
 * (`theme_colors`), which every user without a theme of their own then follows.
 */
export const SystemThemeControls = ({ seeds }: Props) => {
    const { t: tEntities } = useI18n('entities')
    const {
        isAdmin,
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

    return (
        <>
            <Divider />

            <Typography variant="body" isSubtle>
                {tEntities('ui.systemTheme.description')}
            </Typography>

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
                {isConfigured && isPersonalThemeActive && (
                    <Button disabled={isBusy} onClick={activateSystemTheme} testId="ui-system-theme-use">
                        {tEntities('ui.systemTheme.use')}
                    </Button>
                )}
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
            </div>
        </>
    )
}
