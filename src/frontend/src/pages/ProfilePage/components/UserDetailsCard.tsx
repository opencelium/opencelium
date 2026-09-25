import React, { useMemo, useCallback } from 'react'
import { FormProvider } from 'react-hook-form'
import { message } from 'antd'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { Card } from '@shared/ui/primitives/Card'
import { Button } from '@shared/ui/primitives/Button'
import { FormInput } from '@shared/ui/form/FormInput'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext'
import { EntityText } from '@shared/ui/primitives/Text'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useAuth } from '@features/auth/useAuth'
import { hasComponentPermission } from '@/engine/policy'
import { useAppDispatch, useAppSelector } from '@/shared/lib/storeHooks'
import { authActions } from '@entities/auth/model/authSlice'
import { selectAuthSession } from '@entities/auth/model/authSelectors'
import {
    useUpdateUserMutation,
    type UserUpdateRequestDTO,
} from '@entities/user/api/userApi'
import type { AuthUser } from '@entities/auth/model/types'
import { useProfileDetailsForm } from '@pages/ProfilePage/hooks/useProfileDetailsForm'
import type { ProfileDetailsValues } from '@pages/ProfilePage/schemas/profileDetails.schema'
import { UserTitleField } from '@pages/ProfilePage/components/UserTitleField'

function toFormValues(user: AuthUser): ProfileDetailsValues {
    const raw = user.userDetail?.userTitle?.toLowerCase() ?? null
    return {
        userTitle: raw === 'mr' || raw === 'mrs' ? raw : null,
        name: user.userDetail?.name ?? '',
        surname: user.userDetail?.surname ?? '',
        department: user.userDetail?.department ?? '',
        organization: user.userDetail?.organization ?? '',
        phoneNumber: user.userDetail?.phoneNumber ?? '',
        email: user.email ?? '',
        username: user.username ?? '',
    }
}

export function UserDetailsCard({ style }: { style?: React.CSSProperties }) {
    const { user, normalizedUser } = useAuth()
    const canUpdate = hasComponentPermission(normalizedUser?.permissions ?? [], 'MYPROFILE', 'UPDATE')
    const session = useAppSelector(selectAuthSession)
    const dispatch = useAppDispatch()
    const { t } = useI18n('entities')
    const [updateUser, { isLoading }] = useUpdateUserMutation()

    const initialValues = useMemo<ProfileDetailsValues>(
        () => (user ? toFormValues(user) : ({} as ProfileDetailsValues)),
        [user],
    )

    const { form, constraints } = useProfileDetailsForm(initialValues)

    const onSubmit = useCallback(
        async (values: ProfileDetailsValues) => {
            if (!user || !session) return
            const groupId = user.userGroup?.groupId
            // PUT /user/{id} rebuilds the record from the body and reads userGroup as
            // an int, so a missing one deserializes to 0, matches no role and strips
            // the user's group. Without a hydrated group there is no safe body to
            // send, and this is a Save the user pressed — so it says so rather than
            // quietly doing nothing (the language switch, which nobody asked for,
            // does bail silently).
            if (typeof groupId !== 'number') {
                notifyError(t('profile.messages.detailsUpdateFailed'))
                return
            }

            const userDetail = {
                ...user.userDetail,
                userTitle: values.userTitle,
                name: values.name,
                surname: values.surname,
                department: values.department || null,
                organization: values.organization || null,
                phoneNumber: values.phoneNumber || null,
            }
            // The whole fetched record with the edited fields laid over it, never a
            // patch of the changed ones.
            const body: UserUpdateRequestDTO = {
                userId: user.userId,
                email: values.email.trim() || null,
                username: values.username.trim() || null,
                userGroup: groupId,
                userDetail,
            }
            await updateUser({ userId: user.userId, body }).unwrap()

            // The response echoes the request resource back — flat userGroup, no
            // widgetSettings — so the session takes the local merge instead, keeping
            // the group and widget settings this form never touched.
            dispatch(
                authActions.setSession({
                    ...session,
                    user: { ...user, email: body.email, username: body.username, userDetail },
                }),
            )
            message.success(t('profile.messages.detailsUpdated'))
        },
        [user, session, updateUser, dispatch, t],
    )

    if (!user) return null

    return (
        <Card style={style} title={<EntityText i18nKey="profile.sections.userDetails" typoProps={{ isBold: true }} />}>
            <FormProvider {...form}>
                <FormConstraintsProvider constraints={constraints}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                    >
                        <UserTitleField readOnly={!canUpdate} />
                        <FormInput name="name" label="profile.fields.name.label" autoFocus readOnly={!canUpdate} />
                        <FormInput name="surname" label="profile.fields.surname.label" readOnly={!canUpdate} />
                        <FormInput name="department" label="profile.fields.department.label" readOnly={!canUpdate} />
                        <FormInput name="organization" label="profile.fields.organization.label" readOnly={!canUpdate} />
                        <FormInput name="phoneNumber" label="profile.fields.phoneNumber.label" readOnly={!canUpdate} />
                        <FormInput name="email" label="profile.fields.email.label" readOnly={!canUpdate} />
                        <FormInput name="username" label="profile.fields.username.label" readOnly={!canUpdate} />
                        {canUpdate && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button htmlType="submit" type="primary" loading={isLoading}>
                                    {t('profile.actions.save')}
                                </Button>
                            </div>
                        )}
                    </form>
                </FormConstraintsProvider>
            </FormProvider>
        </Card>
    )
}
