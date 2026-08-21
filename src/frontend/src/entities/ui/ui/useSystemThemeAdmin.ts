import { useState } from 'react'
import { message } from 'antd'
import {
    useDeleteSystemSettingMutation,
    useSaveSystemSettingMutation,
} from '@entities/systemSetting/api/systemSettingApi'
import { useIsAdmin } from '@features/auth/useIsAdmin'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { CustomThemeSeeds } from '@shared/theme/palette/customPalette'
import {
    applySystemThemeSeeds,
    hasSystemTheme,
    isSystemThemeId,
    removeSystemTheme,
    SYSTEM_THEME_IDS,
} from '@shared/theme/registry/systemTheme'
import { themeRegistry } from '@shared/theme/registry/themeRegistry'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { DEVICE_THEME_ID, type ThemeMode } from '@shared/theme/types'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { notifyError } from '@shared/ui/feedback/notifyError'

/**
 * The theme editor's actions: writes the edited seeds to `theme_colors` so every user
 * picks them up, or deletes the setting so everyone falls back to the built-in default.
 *
 * A save also switches this admin onto the saved theme, which is what lets one button
 * both apply the colors and publish them — without it, an admin holding a personal theme
 * would save and see nothing change (the case `isPersonalThemeActive` still describes for
 * a theme picked *after* a save).
 */
export function useSystemThemeAdmin(seeds: CustomThemeSeeds) {
    const { t: tEntities } = useI18n('entities')
    const { themeId, themeMode, setTheme } = useTheme()
    const confirm = useConfirm()
    const [saveSetting, { isLoading: isSaving }] = useSaveSystemSettingMutation()
    const [deleteSetting, { isLoading: isResetting }] = useDeleteSystemSettingMutation()
    // hasSystemTheme() reads the registry, which mutations change without a re-render.
    const [isConfigured, setIsConfigured] = useState(hasSystemTheme)

    // PUT/DELETE /system-setting require the 'Admin' authority; non-admins are rejected
    // with 403 regardless — this only keeps the controls out of their way.
    const isAdmin = useIsAdmin()

    // A personal choice (custom theme or any explicitly picked built-in) shadows the
    // system theme on this screen only, so a save can look like it did nothing.
    const isPersonalThemeActive = themeId !== DEVICE_THEME_ID && !isSystemThemeId(themeId)

    const save = async () => {
        try {
            await saveSetting({ name: 'theme_colors', value: seeds }).unwrap()
            applySystemThemeSeeds(seeds)
            setIsConfigured(true)
            setTheme(SYSTEM_THEME_IDS[themeMode])
            message.success(tEntities('ui.systemTheme.saved'))
        } catch {
            notifyError(tEntities('ui.systemTheme.saveFailed'))
        }
    }

    const reset = async () => {
        const confirmed = await confirm({
            title: tEntities('ui.systemTheme.confirmReset.title'),
            message: tEntities('ui.systemTheme.confirmReset.message'),
        })
        if (!confirmed) return
        try {
            await deleteSetting('theme_colors').unwrap()
            const wasActive = isSystemThemeId(themeId)
            removeSystemTheme()
            setIsConfigured(false)
            if (wasActive) setTheme(resolveFallbackThemeId(themeMode))
            message.success(tEntities('ui.systemTheme.removed'))
        } catch {
            notifyError(tEntities('ui.systemTheme.resetFailed'))
        }
    }

    const activateSystemTheme = () => setTheme(SYSTEM_THEME_IDS[themeMode])

    return {
        isAdmin,
        isConfigured,
        isPersonalThemeActive,
        isBusy: isSaving || isResetting,
        isSaving,
        isResetting,
        save,
        reset,
        activateSystemTheme,
    }
}

/** Keeps the current light/dark mode while leaving the removed theme behind. */
function resolveFallbackThemeId(mode: ThemeMode): string {
    const fallbackFamily = themeRegistry.getDefault().family
    const match = themeRegistry.getAll().find(def => def.family === fallbackFamily && def.mode === mode)
    return match?.id ?? themeRegistry.getDefault().id
}
