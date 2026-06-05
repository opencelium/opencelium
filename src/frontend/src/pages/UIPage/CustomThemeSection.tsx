import { useState } from 'react'
import { ColorPicker, message } from 'antd'
import type { CustomThemeSeeds } from '@shared/theme/palette/customPalette'
import {
    applyCustomThemeSeeds,
    CUSTOM_THEME_IDS,
    hasCustomTheme,
    removeCustomTheme,
} from '@shared/theme/registry/customTheme'
import { themeRegistry } from '@shared/theme/registry/themeRegistry'
import { readCustomThemeSeeds } from '@shared/theme/themeStorage'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Button } from '@shared/ui/primitives/Button'
import { Card } from '@shared/ui/primitives/Card'
import { Typography } from '@shared/ui/primitives/Typography'

const DEFAULT_SEEDS: CustomThemeSeeds = {
    primary: '#1677ff',
    accent: '#2f54eb',
    neutral: '#8c8c8c',
}

const SEED_FIELDS: { key: keyof CustomThemeSeeds; labelKey: string }[] = [
    { key: 'primary', labelKey: 'ui.customTheme.primary' },
    { key: 'accent', labelKey: 'ui.customTheme.accent' },
    { key: 'neutral', labelKey: 'ui.customTheme.neutral' },
]

export const CustomThemeSection = () => {
    const { t: tEntities } = useI18n('entities')
    const { themeId, themeMode, setTheme } = useTheme()
    const [seeds, setSeeds] = useState<CustomThemeSeeds>(() => readCustomThemeSeeds() ?? DEFAULT_SEEDS)
    const [isSaved, setIsSaved] = useState(hasCustomTheme)

    const isCustomActive = themeId === CUSTOM_THEME_IDS.light || themeId === CUSTOM_THEME_IDS.dark

    const handleApply = () => {
        applyCustomThemeSeeds(seeds)
        setIsSaved(true)
        setTheme(themeMode === 'dark' ? CUSTOM_THEME_IDS.dark : CUSTOM_THEME_IDS.light)
        message.success(tEntities('ui.customTheme.applied'))
    }

    const handleRemove = () => {
        removeCustomTheme()
        setIsSaved(false)
        if (isCustomActive) {
            const fallback =
                themeRegistry.getAll().find(def => def.family === 'ant' && def.mode === themeMode) ??
                themeRegistry.getDefault()
            setTheme(fallback.id)
        }
        message.success(tEntities('ui.customTheme.removed'))
    }

    return (
        <Card title={tEntities('ui.customTheme.title')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Typography variant="body" isSubtle>
                    {tEntities('ui.customTheme.description')}
                </Typography>

                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                    {SEED_FIELDS.map(field => (
                        <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <Typography variant="label">{tEntities(field.labelKey)}</Typography>
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

                <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="primary" onClick={handleApply}>
                        {tEntities('ui.customTheme.apply')}
                    </Button>
                    {isSaved && (
                        <Button onClick={handleRemove}>
                            {tEntities('ui.customTheme.remove')}
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    )
}
