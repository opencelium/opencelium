import React, { useMemo, useCallback } from 'react'
import { FormProvider } from 'react-hook-form'
import { message } from 'antd'
import { Card } from '@shared/ui/primitives/Card'
import { Button } from '@shared/ui/primitives/Button'
import { FormInput } from '@shared/ui/form/FormInput'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext'
import { EntityText } from '@shared/ui/primitives/Text'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useAuth } from '@features/auth/useAuth'
import { useAppDispatch, useAppSelector } from '@/shared/lib/storeHooks'
import { authActions } from '@entities/auth/model/authSlice'
import { selectAuthSession } from '@entities/auth/model/authSelectors'
import {
    useUpdateProfileMutation,
    type UpdateProfilePayload,
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
        email: user.email,
    }
}

export function UserDetailsCard({ style }: { style?: React.CSSProperties }) {
    const { user } = useAuth()
    const session = useAppSelector(selectAuthSession)
    const dispatch = useAppDispatch()
    const { t } = useI18n('entities')
    const [updateProfile, { isLoading }] = useUpdateProfileMutation()

    const initialValues = useMemo<ProfileDetailsValues>(
        () => (user ? toFormValues(user) : ({} as ProfileDetailsValues)),
        [user],
    )

    const { form, constraints } = useProfileDetailsForm(initialValues)

    const onSubmit = useCallback(
        async (values: ProfileDetailsValues) => {
            if (!user || !session) return
            const payload: UpdateProfilePayload = {
                email: values.email,
                userDetail: {
                    ...user.userDetail,
                    userTitle: values.userTitle,
                    name: values.name,
                    surname: values.surname,
                    department: values.department || null,
                    organization: values.organization || null,
                    phoneNumber: values.phoneNumber || null,
                },
            }
            const updated = await updateProfile({
                identifier: user.email,
                body: payload,
            }).unwrap()

            dispatch(
                authActions.setSession({
                    ...session,
                    user: updated ?? { ...user, ...payload, userDetail: { ...user.userDetail, ...payload.userDetail } },
                }),
            )
            message.success(t('profile.messages.detailsUpdated'))
        },
        [user, session, updateProfile, dispatch, t],
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
                        <UserTitleField />
                        <FormInput name="name" label="profile.fields.name.label" autoFocus />
                        <FormInput name="surname" label="profile.fields.surname.label" />
                        <FormInput name="department" label="profile.fields.department.label" />
                        <FormInput name="organization" label="profile.fields.organization.label" />
                        <FormInput name="phoneNumber" label="profile.fields.phoneNumber.label" />
                        <FormInput name="email" label="profile.fields.email.label" />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button htmlType="submit" type="primary" loading={isLoading}>
                                {t('profile.actions.save')}
                            </Button>
                        </div>
                    </form>
                </FormConstraintsProvider>
            </FormProvider>
        </Card>
    )
}
