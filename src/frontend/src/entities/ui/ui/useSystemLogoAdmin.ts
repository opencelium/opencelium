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

/** The backend's own cap; rejected there with 400, checked here to say so without a round trip. */
const MAX_LOGO_BYTES = 5 * 1024 * 1024
// SVG is deliberately not accepted by the backend, so don't offer it in the file dialog.
export const LOGO_ACCEPT = 'image/png,image/jpeg'
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg']

const hasAllowedExtension = (name: string) =>
    ALLOWED_EXTENSIONS.includes(name.split('.').pop()?.toLowerCase() ?? '')

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
        // The extension is what the backend validates on, not the browser's MIME guess.
        if (!hasAllowedExtension(file.name)) {
            notifyError(tEntities('ui.systemLogo.invalidType'))
            return
        }
        if (file.size > MAX_LOGO_BYTES) {
            notifyError(tEntities('ui.systemLogo.tooLarge'))
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
