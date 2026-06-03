import { useEffect, useState } from 'react'
import { Controller, FormProvider } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetchWithHeaders, ApiFetchError, API_TIMEOUT_ERROR_NAME } from '@shared/api/apiFetch'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { errorBus } from '@shared/errors/api/errorBus'
import { useSetPasswordForm } from '../model/useSetPasswordForm'
import type { SetPasswordFormValues } from '../model/setPassword.schema'
import { Button } from '@shared/ui/primitives/Button'
import { Card } from '@shared/ui/primitives/Card'
import { Input } from '@shared/ui/primitives/Input'
import { Typography } from '@shared/ui/primitives/Typography'

const FORM_WIDTH = 400
const REDIRECT_SECONDS = 5

type AuthKey = Parameters<ReturnType<typeof useI18n<'auth'>>['t']>[0]

function isInvalidToken(error: ApiFetchError): boolean {
    if (error.status !== 400) return false
    const code = (error.body as { error?: unknown } | null | undefined)?.error
    return code === 'INVALID_TOKEN'
}

export function SetPasswordForm() {
    const form = useSetPasswordForm()
    const { t } = useI18n('auth')
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token') ?? ''

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS)

    useEffect(() => {
        if (!isSent) return
        const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
        return () => clearInterval(id)
    }, [isSent])

    useEffect(() => {
        if (isSent && secondsLeft === 0) navigate('/login')
    }, [isSent, secondsLeft, navigate])

    const onSubmit = async ({ password, repeatPassword }: SetPasswordFormValues) => {
        setIsSubmitting(true)
        try {
            await apiFetchWithHeaders('/auth/reset-password', {
                method: 'POST',
                body: { token, newPassword: password, confirmPassword: repeatPassword },
                timeoutMs: 15_000,
            })
            setIsSent(true)
        } catch (e) {
            if (e instanceof ApiFetchError && isInvalidToken(e)) {
                errorBus.emit({ type: 'VALIDATION', messageKey: 'setPassword.invalidToken' })
            } else if (e instanceof Error && e.name === API_TIMEOUT_ERROR_NAME) {
                errorBus.emit({ type: 'NETWORK', messageKey: 'setPassword.network' })
            } else if (e instanceof TypeError) {
                errorBus.emit({ type: 'NETWORK', messageKey: 'setPassword.network' })
            } else {
                errorBus.emit({ type: 'UNKNOWN', messageKey: 'setPassword.failed' })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const { control, handleSubmit, formState: { errors } } = form
    const passwordErrorKey = errors.password?.message as AuthKey | undefined
    const repeatErrorKey = errors.repeatPassword?.message as AuthKey | undefined

    return (
        <Card style={{ width: FORM_WIDTH }}>
            {isSent ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                    <Typography variant="body">{t('setPassword.success.message')}</Typography>
                    <Typography variant="body" isSubtle>
                        {t('setPassword.success.redirect', { seconds: secondsLeft })}
                    </Typography>
                </div>
            ) : (
                <FormProvider {...form}>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Typography variant="title" as="h2">
                                {t('setPassword.title')}
                            </Typography>
                            <Typography variant="body" isSubtle>
                                {t('setPassword.description')}
                            </Typography>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <Typography variant="label" isBold>
                                {t('setPassword.fields.password.label')}
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
                                        placeholder={t('setPassword.fields.password.placeholder')}
                                        error={!!passwordErrorKey}
                                        autoFocus
                                    />
                                )}
                            />
                            {passwordErrorKey && (
                                <Typography variant="caption" isDanger>
                                    {t(passwordErrorKey)}
                                </Typography>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <Typography variant="label" isBold>
                                {t('setPassword.fields.repeatPassword.label')}
                            </Typography>
                            <Controller
                                name="repeatPassword"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="password"
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        placeholder={t('setPassword.fields.repeatPassword.placeholder')}
                                        error={!!repeatErrorKey}
                                    />
                                )}
                            />
                            {repeatErrorKey && (
                                <Typography variant="caption" isDanger>
                                    {t(repeatErrorKey)}
                                </Typography>
                            )}
                        </div>

                        <Button
                            htmlType="submit"
                            type="primary"
                            loading={isSubmitting}
                            style={{ width: '100%' }}
                        >
                            {t('setPassword.submit')}
                        </Button>

                        <Link to="/login" style={{ alignSelf: 'center' }}>
                            <Button type="link">{t('setPassword.backToLogin')}</Button>
                        </Link>
                    </form>
                </FormProvider>
            )}
        </Card>
    )
}
