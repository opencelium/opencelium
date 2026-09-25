import { message } from 'antd'
import {
    useDeleteSystemLogoMutation,
    useUploadSystemLogoMutation,
} from '@entities/systemSetting/api/systemSettingApi'
import { isAppLogoValue } from '@entities/systemSetting/model/types'
import { useIsAdmin } from '@features/auth/useIsAdmin'
import { useAppLogoStore } from '@features/branding/appLogoStore'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { notifyError } from '@shared/ui/feedback/notifyError'

import { validateImageUpload } from '@shared/utils/imageUploadRules'

/**
 * The admin half of the logo editor: uploads the file to `app_logo` so every user gets it
 * in place of the OpenCelium logo, or deletes the setting so everyone falls back to the
 * default. Both apply locally on success, since the store the UI reads is also the cache
 * that brands the login screen.
 */
export function useSystemLogoAdmin() {
    const { t: tEntities } = useI18n('entities')
    const confirm = useConfirm()
    const isAdmin = useIsAdmin()
    const [uploadLogo, { isLoading: isUploading }] = useUploadSystemLogoMutation()
    const [deleteLogo, { isLoading: isRemoving }] = useDeleteSystemLogoMutation()
    const logoUrl = useAppLogoStore(state => state.logoUrl)
    const setLogo = useAppLogoStore(state => state.setLogo)
    const clearLogo = useAppLogoStore(state => state.clearLogo)

    const upload = async (file: File) => {
        const rejection = validateImageUpload(file)
        if (rejection) {
            notifyError(tEntities(`ui.systemLogo.${rejection}`))
            return
        }
        try {
            const saved = await uploadLogo(file).unwrap()
            // Every upload gets a fresh UUID filename, so the new URL is its own
            // cache-buster — no reload and no query string needed.
            if (isAppLogoValue(saved.value)) setLogo(saved.value.url)
            message.success(tEntities('ui.systemLogo.saved'))
        } catch {
            notifyError(tEntities('ui.systemLogo.saveFailed'))
        }
    }

    const remove = async () => {
        const confirmed = await confirm({
            title: tEntities('ui.systemLogo.confirmRemove.title'),
            message: tEntities('ui.systemLogo.confirmRemove.message'),
        })
        if (!confirmed) return
        try {
            await deleteLogo().unwrap()
            clearLogo()
            message.success(tEntities('ui.systemLogo.removed'))
        } catch {
            notifyError(tEntities('ui.systemLogo.removeFailed'))
        }
    }

    return {
        isAdmin,
        isConfigured: logoUrl !== null,
        isBusy: isUploading || isRemoving,
        isUploading,
        isRemoving,
        upload,
        remove,
    }
}
