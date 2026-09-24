import {useRef} from 'react'
import {useFormContext} from 'react-hook-form'
import {z} from 'zod'
import type {Mode} from '@/engine/entity/EntityDefinition'
import {useConfirm} from '@shared/ui/confirm/ConfirmDialogContext'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {isImageFile} from '@shared/utils/fileTypeGuards'
import {fetchGravatarFile, normalizeEmail} from '@entities/user/lib/gravatar'
import {useOnlineFeature} from '@entities/subscription/model/useOnlineFeature'

const PICTURE_FIELD = 'profilePicture'
const I18N_PREFIX = 'user.fields.profilePicture.gravatar'

const emailSchema = z.email()

const hasPicture = (value: unknown) =>
    isImageFile(value) || (typeof value === 'string' && value.trim() !== '')

type Params = {
    emailField: string
    mode: Mode
}

/**
 * On email blur, offers the address's Gravatar as the profile picture. Accepting stages
 * it as the picture file, so the regular after-save upload stores it — and the upload
 * endpoint deletes whatever picture the user had before.
 *
 * The lookup sends a hash of the typed email to a third party, so it is gated on
 * `online-services.active` — installs that opted out of external services never call
 * Gravatar. While the setting is still loading the lookup is skipped, not deferred.
 */
export function useGravatarSuggestion({emailField, mode}: Params) {
    const {getValues, getFieldState, setValue} = useFormContext()
    const confirm = useConfirm()
    const {t} = useI18n('entities')
    const lastCheckedRef = useRef<string | null>(null)
    const isOnlineAllowed = useOnlineFeature().state === 'available'

    const handleBlur = async () => {
        if (mode === 'view' || !isOnlineAllowed) return
        const email = normalizeEmail(getValues(emailField))
        if (!emailSchema.safeParse(email).success || email === lastCheckedRef.current) return

        const currentPicture = getValues(PICTURE_FIELD)
        const isPictureSet = hasPicture(currentPicture)
        // An untouched email on an existing user with a picture is not worth a prompt
        // every time the wizard is opened.
        if (isPictureSet && !getFieldState(emailField).isDirty) return

        lastCheckedRef.current = email
        const file = await fetchGravatarFile(email)
        if (!file || normalizeEmail(getValues(emailField)) !== email) return

        const previewUrl = URL.createObjectURL(file)
        try {
            const ok = await confirm({
                title: t(`${I18N_PREFIX}.title`),
                message: (
                    <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                        <img
                            src={previewUrl}
                            alt=""
                            width={72}
                            height={72}
                            style={{borderRadius: '50%', objectFit: 'cover', flexShrink: 0}}
                            data-testid="user-gravatar-preview"
                        />
                        <span>
                            {t(isPictureSet ? `${I18N_PREFIX}.messageReplace` : `${I18N_PREFIX}.message`)}
                        </span>
                    </div>
                ),
            })
            if (ok) setValue(PICTURE_FIELD, file, {shouldDirty: true})
        } finally {
            URL.revokeObjectURL(previewUrl)
        }
    }

    return {handleBlur}
}
