import { useState } from 'react'
import { Controller, FormProvider } from 'react-hook-form'
import { message } from 'antd'
import { useLoginForm } from '../model/useLoginForm'
import { useAuth } from '@features/auth/useAuth'
import { API_TIMEOUT_ERROR_NAME } from '@shared/api/apiFetch'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext.tsx'
import type { LoginFormValues } from '../model/login.schema'
import { Alert } from '@shared/ui/primitives/Alert'
import { Button } from '@shared/ui/primitives/Button'
import { Card } from '@shared/ui/primitives/Card'
import { Checkbox } from '@shared/ui/primitives/Checkbox'
import { Input } from '@shared/ui/primitives/Input'
import { Typography } from '@shared/ui/primitives/Typography'

const FORM_WIDTH = 400

type AuthKey = Parameters<ReturnType<typeof useI18n<'auth'>>['t']>[0]

export function LoginForm() {
    const { form, constraints } = useLoginForm()
    const { login } = useAuth()
    const { t } = useI18n('auth')
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const onSubmit = async (data: LoginFormValues) => {
        setError(null)
        setIsSubmitting(true)
        try {
            await login(data)
        } catch (e) {
            const name = e instanceof Error ? e.name : ''
            const raw = e instanceof Error ? e.message : ''
            if (name === API_TIMEOUT_ERROR_NAME) {
                setError(t('errors.network'))
            } else {
                const isAuthFailure = /401|invalid|credentials|unauthor/i.test(raw)
                setError(t(isAuthFailure ? 'errors.invalidCredentials' : 'errors.failed'))
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleForgotPassword = () => {
        message.info(t('forgotPassword.notAvailable'))
    }

    const { control, handleSubmit, formState: { errors } } = form

    const emailErrorKey = errors.email?.message as AuthKey | undefined
    const passwordErrorKey = errors.password?.message as AuthKey | undefined

    return (
        <Card style={{ width: FORM_WIDTH }}>
            <FormProvider {...form}>
                <FormConstraintsProvider constraints={constraints}>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                    >
                        {error && (
                            <Alert
                                type="error"
                                message={error}
                                showIcon
                                closable
                                onClose={() => setError(null)}
                            />
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <Typography variant="label" isBold>
                                {t('fields.email.label')}
                            </Typography>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        placeholder={t('fields.email.placeholder')}
                                        error={!!emailErrorKey}
                                        autoFocus
                                    />
                                )}
                            />
                            {emailErrorKey && (
                                <Typography variant="caption" isDanger>
                                    {t(emailErrorKey)}
                                </Typography>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <Typography variant="label" isBold>
                                {t('fields.password.label')}
                            </Typography>
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="password"
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        placeholder={t('fields.password.placeholder')}
                                        error={!!passwordErrorKey}
                                    />
                                )}
                            />
                            {passwordErrorKey && (
                                <Typography variant="caption" isDanger>
                                    {t(passwordErrorKey)}
                                </Typography>
                            )}
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                            }}
                        >
                            <Controller
                                name="rememberMe"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        checked={!!field.value}
                                        onChange={field.onChange}
                                        label={t('fields.rememberMe.label')}
                                    />
                                )}
                            />
                            <Button type="link" onClick={handleForgotPassword}>
                                {t('actions.forgotPassword')}
                            </Button>
                        </div>

                        <Button
                            htmlType="submit"
                            type="primary"
                            loading={isSubmitting}
                            style={{ width: '100%' }}
                        >
                            {t('actions.signIn')}
                        </Button>
                    </form>
                </FormConstraintsProvider>
            </FormProvider>
        </Card>
    )
}
