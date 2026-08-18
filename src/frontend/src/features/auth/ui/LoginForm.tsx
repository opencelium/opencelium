import { useState } from 'react'
import { Controller, FormProvider } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useLoginForm } from '../model/useLoginForm'
import { useAuth } from '@features/auth/useAuth'
import { SessionHydrationError } from '@features/auth/strategies/PasswordStrategy'
import { API_TIMEOUT_ERROR_NAME, ApiFetchError } from '@shared/api/apiFetch'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext.tsx'
import { errorBus } from '@shared/errors/api/errorBus'
import type { LoginFormValues } from '../model/login.schema'
import type { TotpChallenge } from '@entities/auth/model/types'
import { TotpLoginDialog } from './TotpLoginDialog'
import { Button } from '@shared/ui/primitives/Button'
import { Card } from '@shared/ui/primitives/Card'
import { Input } from '@shared/ui/primitives/Input'
import { Typography } from '@shared/ui/primitives/Typography'

const FORM_WIDTH = 400

type AuthKey = Parameters<ReturnType<typeof useI18n<'auth'>>['t']>[0]

/**
 * Treat any 401 as bad credentials, but also accept other statuses (some
 * backends return 400 + a "Bad credentials" body message instead of 401).
 */
function isBadCredentials(error: ApiFetchError): boolean {
    if (error.status === 401) return true
    const body = error.body as { message?: unknown } | null | undefined
    return typeof body?.message === 'string' && /bad\s*credentials/i.test(body.message)
}

export function LoginForm() {
    const { form, constraints } = useLoginForm()
    const { login } = useAuth()
    const { t } = useI18n('auth')
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [totp, setTotp] = useState<TotpChallenge | null>(null)

    const onSubmit = async (data: LoginFormValues) => {
        setIsSubmitting(true)
        try {
            const result = await login(data)
            if (result.status === 'totp-required') {
                setTotp(result.challenge)
            }
        } catch (e) {
            if (e instanceof Error && e.name === API_TIMEOUT_ERROR_NAME) {
                errorBus.emit({ type: 'NETWORK', messageKey: 'login.network' })
            } else if (e instanceof TypeError) {
                errorBus.emit({ type: 'NETWORK', messageKey: 'login.network' })
            } else if (e instanceof SessionHydrationError) {
                // The credentials were correct — /login already succeeded — this is a
                // separate failure to load the account, so don't report it as bad
                // credentials (see PasswordStrategy.completeLogin).
                errorBus.emit({ type: 'UNKNOWN', messageKey: 'login.sessionLoadFailed' })
            } else if (e instanceof ApiFetchError && isBadCredentials(e)) {
                errorBus.emit({ type: 'VALIDATION', messageKey: 'login.invalidCredentials' })
            } else {
                errorBus.emit({ type: 'UNKNOWN', messageKey: 'login.failed' })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleForgotPassword = () => {
        navigate('/forgot-password')
    }

    const { control, handleSubmit, formState: { errors } } = form

    const emailErrorKey = errors.email?.message as AuthKey | undefined
    const passwordErrorKey = errors.password?.message as AuthKey | undefined

    return (
        <>
        <Card style={{ width: FORM_WIDTH }}>
            <FormProvider {...form}>
                <FormConstraintsProvider constraints={constraints}>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <Typography variant="label" isBold>
                                {t('fields.emailOrUsername.label')}
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
                                        placeholder={t('fields.emailOrUsername.placeholder')}
                                        error={!!emailErrorKey}
                                        autoFocus
                                        testId="login-email"
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
                                        testId="login-password"
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
                                justifyContent: 'flex-end',
                                gap: 12,
                            }}
                        >
                            <Button type="link" onClick={handleForgotPassword} testId="login-forgot-password">
                                {t('actions.forgotPassword')}
                            </Button>
                        </div>

                        <Button
                            htmlType="submit"
                            type="primary"
                            loading={isSubmitting}
                            style={{ width: '100%' }}
                            testId="login-submit"
                        >
                            {t('actions.signIn')}
                        </Button>
                    </form>
                </FormConstraintsProvider>
            </FormProvider>
        </Card>
        <TotpLoginDialog
            open={!!totp}
            challenge={totp}
            onClose={() => setTotp(null)}
        />
        </>
    )
}
