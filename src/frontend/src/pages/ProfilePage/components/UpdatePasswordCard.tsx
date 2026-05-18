import { useCallback } from 'react'
import { FormProvider } from 'react-hook-form'
import { message } from 'antd'
import { Card } from '@shared/ui/primitives/Card'
import { Button } from '@shared/ui/primitives/Button'
import { FormInput } from '@shared/ui/form/FormInput'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext'
import { Hint } from '@shared/ui/primitives/Hint'
import { EntityText } from '@shared/ui/primitives/Text'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useAuth } from '@features/auth/useAuth'
import { useChangePasswordMutation } from '@entities/user/api/userApi'
import { useChangePasswordForm } from '@pages/ProfilePage/hooks/useChangePasswordForm'
import type { ChangePasswordValues } from '@pages/ProfilePage/schemas/changePassword.schema'

export function UpdatePasswordCard() {
    const { t } = useI18n('entities')
    const { logout } = useAuth()
    const { form, constraints } = useChangePasswordForm()
    const [changePassword, { isLoading }] = useChangePasswordMutation()

    const onSubmit = useCallback(
        async (values: ChangePasswordValues) => {
            const res = await changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
                confirmPassword: values.repeatNewPassword,
            })
            if ('error' in res && res.error) {
                const err = res.error as { status?: number; data?: { status?: number; message?: string } }
                const status = err.status ?? err.data?.status
                const apiMessage = err.data?.message
                if (status === 400 && apiMessage === 'WRONG_PASSWORD') {
                    form.setError('currentPassword', {
                        type: 'server',
                        message: 'profile.fields.currentPassword.wrong',
                    })
                    return
                }
                message.error(apiMessage ?? 'Unknown error')
                return
            }
            message.success(t('profile.messages.passwordUpdated'))
            await logout()
        },
        [changePassword, form, logout, t],
    )

    return (
        <Card title={<EntityText i18nKey="profile.sections.updatePassword" typoProps={{ isBold: true }} />}>
            <FormProvider {...form}>
                <FormConstraintsProvider constraints={constraints}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                    >
                        <FormInput
                            name="currentPassword"
                            label="profile.fields.currentPassword.label"
                            type="password"
                        />
                        <FormInput
                            name="newPassword"
                            label="profile.fields.newPassword.label"
                            type="password"
                        />
                        <FormInput
                            name="repeatNewPassword"
                            label="profile.fields.repeatNewPassword.label"
                            type="password"
                        />
                        <Hint>
                            <EntityText i18nKey="profile.hints.sessionWillExpire" />
                        </Hint>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button htmlType="submit" type="primary" loading={isLoading}>
                                {t('profile.actions.update')}
                            </Button>
                        </div>
                    </form>
                </FormConstraintsProvider>
            </FormProvider>
        </Card>
    )
}
