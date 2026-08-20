import { useCallback } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useAppDispatch, useAppSelector } from '@shared/lib/storeHooks'
import { selectAuthSession } from '@entities/auth/model/authSelectors'
import { authActions } from '@entities/auth/model/authSlice'
import { useUpdateUserMutation } from '@entities/user/api/userApi'
import {
    DEFAULT_LANGUAGE,
    normalizeLanguage,
    type AppLanguage,
} from '@shared/i18n/config/languages'
import { storeLanguage } from '@shared/i18n/config/languageStorage'

/**
 * The app's language, switched through the one place that also persists it:
 * locally for the next reload and, for a signed-in user, onto the account so the
 * choice follows them to another browser. Read back by UserLanguageSync.
 */
export function useAppLanguage(): {
    lang: AppLanguage
    changeLanguage: (next: AppLanguage) => Promise<void>
    isSaving: boolean
} {
    const { lang, setLang } = useI18n('common')
    const session = useAppSelector(selectAuthSession)
    const dispatch = useAppDispatch()
    const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation()

    const changeLanguage = useCallback(
        async (next: AppLanguage) => {
            if (next === normalizeLanguage(lang)) return
            await setLang(next)
            storeLanguage(next)

            const user = session?.user
            // No session yet (login screen): the device copy is all there is to keep.
            if (!user) return

            // Applied to the session before the request goes out, so UserLanguageSync
            // reads the new value as the current preference instead of switching the
            // UI back to the stale server one while the PUT is in flight.
            dispatch(
                authActions.setSession({
                    ...session,
                    user: { ...user, userDetail: { ...user.userDetail, lang: next } },
                }),
            )

            const groupId = user.userGroup?.groupId
            // PUT /user/{id} replaces the whole record and clears the role when no
            // group is sent, so an incompletely hydrated user is left server-side as
            // it is rather than risking that.
            if (typeof groupId !== 'number') return

            try {
                await updateUser({
                    userId: user.userId,
                    body: {
                        userId: user.userId,
                        email: user.email,
                        userGroup: groupId,
                        userDetail: { ...user.userDetail, lang: next },
                    },
                }).unwrap()
            } catch {
                // The switch is already applied locally and baseQuery has put the
                // failure on errorBus — don't yank the UI back to the old language.
            }
        },
        [lang, setLang, session, dispatch, updateUser],
    )

    return { lang: normalizeLanguage(lang) ?? DEFAULT_LANGUAGE, changeLanguage, isSaving }
}
