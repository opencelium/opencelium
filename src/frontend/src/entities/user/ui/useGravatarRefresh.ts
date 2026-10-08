import {useEffect, useState} from 'react'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {notifyError} from '@shared/ui/feedback/notifyError'
import type {ImageTileAction} from '@shared/ui/wizard-image-editor/ImageTileEditor'
import {useOnlineFeature} from '@entities/subscription/model/useOnlineFeature'
import {
    isValidEmail,
    lookupGravatarFile,
    normalizeEmail,
    refreshGravatarFile,
} from '@entities/user/lib/gravatar'

const LOOKUP_DEBOUNCE_MS = 500

type Params = {
    email: unknown
    testIdPrefix: string
    /** What to do with the downloaded picture — stage it in a form, or upload it right away. */
    onFile: (file: File) => void | Promise<void>
}

/**
 * The picture tile's "Refresh from Gravatar" action. A stored Gravatar is only a copy, so
 * this re-downloads the current one on demand. The action is only offered once a lookup
 * confirmed the email has a Gravatar — and, like the email-blur suggestion, no request
 * reaches Gravatar at all unless `online-services.active` is on.
 */
export function useGravatarRefresh({email, testIdPrefix, onFile}: Params): {
    isLoading: boolean
    actions: ImageTileAction[]
} {
    const {t} = useI18n('entities')
    const isOnlineAllowed = useOnlineFeature().state === 'available'
    const [isLoading, setIsLoading] = useState(false)
    const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null)
    const normalized = normalizeEmail(email)
    const isEligible = isOnlineAllowed && isValidEmail(normalized)

    useEffect(() => {
        if (!isEligible) return
        let isCancelled = false
        const timer = setTimeout(() => {
            void lookupGravatarFile(normalized).then(file => {
                if (!isCancelled) setConfirmedEmail(file ? normalized : null)
            })
        }, LOOKUP_DEBOUNCE_MS)
        return () => {
            isCancelled = true
            clearTimeout(timer)
        }
    }, [isEligible, normalized])

    const refresh = async () => {
        setIsLoading(true)
        try {
            const file = await refreshGravatarFile(normalized)
            if (!file) {
                setConfirmedEmail(null)
                notifyError(t('user.fields.profilePicture.gravatar.notFound'))
                return
            }
            await onFile(file)
        } finally {
            setIsLoading(false)
        }
    }

    const hasGravatar = isEligible && confirmedEmail === normalized
    const actions: ImageTileAction[] = hasGravatar
        ? [{
            key: 'gravatar-refresh',
            iconName: 'refresh',
            label: t('user.fields.profilePicture.gravatar.refresh'),
            testId: `${testIdPrefix}-gravatar-refresh`,
            onClick: () => void refresh(),
        }]
        : []

    return {isLoading, actions}
}
