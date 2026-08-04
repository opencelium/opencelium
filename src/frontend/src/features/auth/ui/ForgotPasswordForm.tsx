import { useState } from 'react'
import { Controller, FormProvider } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { apiFetchWithHeaders, ApiFetchError, API_TIMEOUT_ERROR_NAME } from '@shared/api/apiFetch'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext.tsx'
import { errorBus } from '@shared/errors/api/errorBus'
import type { AppErrorType } from '@shared/errors/types'
import { useForgotPasswordForm } from '../model/useForgotPasswordForm'
import type { ForgotPasswordFormValues } from '../model/forgotPassword.schema'
import { Button } from '@shared/ui/primitives/Button'
import { Card } from '@shared/ui/primitives/Card'
import { Input } from '@shared/ui/primitives/Input'
import { Typography } from '@shared/ui/primitives/Typography'

const FORM_WIDTH = 400

type AuthKey = Parameters<ReturnType<typeof useI18n<'auth'>>['t']>[0]
type ForgotPasswordErrorCode = 'EMAIL_NOT_EXISTS' | 'TOO_MANY_ATTEMPTS' | 'EMAIL_RECOVERY_FAILED'

const ERROR_TYPE_MAP: Record<ForgotPasswordErrorCode, AppErrorType> = {
    EMAIL_NOT_EXISTS: 'VALIDATION',
    TOO_MANY_ATTEMPTS: 'VALIDATION',
    EMAIL_RECOVERY_FAILED: 'SERVER',
}

const ERROR_MESSAGE_KEY_MAP: Record<ForgotPasswordErrorCode, string> = {
    EMAIL_NOT_EXISTS: 'forgotPassword.emailNotExists',
    TOO_MANY_ATTEMPTS: 'forgotPassword.tooManyAttempts',
    EMAIL_RECOVERY_FAILED: 'forgotPassword.emailRecoveryFailed',
}

function extractErrorCode(body: unknown): ForgotPasswordErrorCode | null {
    if (!body || typeof body !== 'object') return null
    const code = (body as { error?: unknown }).error
    if (code === 'EMAIL_NOT_EXISTS' || code === 'TOO_MANY_ATTEMPTS' || code === 'EMAIL_RECOVERY_FAILED') {
        return code
    }
    return null
}

export function ForgotPasswordForm() {
    const { form, constraints } = useForgotPasswordForm()
    const { t } = useI18n('auth')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const onSubmit = async ({ email }: ForgotPasswordFormValues) => {
        setIsSubmitting(true)
        try {
            await apiFetchWithHeaders('/auth/forgot-password', {
                method: 'POST',
                body: { email },
                timeoutMs: 15_000,
            })
            setIsSent(true)
        } catch (e) {
            if (e instanceof ApiFetchError) {
                const code = extractErrorCode(e.body)
                if (code) {
                    errorBus.emit({
                        type: ERROR_TYPE_MAP[code],
                        messageKey: ERROR_MESSAGE_KEY_MAP[code],
                        ...(code === 'EMAIL_RECOVERY_FAILED' && { durationSec: 12 }),
                    })
                } else {
                    errorBus.emit({ type: 'UNKNOWN', messageKey: 'forgotPassword.failed' })
                }
            } else if (e instanceof Error && e.name === API_TIMEOUT_ERROR_NAME) {
                errorBus.emit({ type: 'NETWORK', messageKey: 'forgotPassword.network' })
            } else if (e instanceof TypeError) {
                errorBus.emit({ type: 'NETWORK', messageKey: 'forgotPassword.network' })
            } else {
                errorBus.emit({ type: 'UNKNOWN', messageKey: 'forgotPassword.failed' })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const { control, handleSubmit, formState: { errors } } = form
    const emailErrorKey = errors.email?.message as AuthKey | undefined

    return (
        <Card style={{ width: FORM_WIDTH }}>
            {isSent ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                    <Typography variant="body">{t('forgotPassword.success')}</Typography>
                    <Link to="/login">
                        <Button type="link">{t('forgotPassword.backToLogin')}</Button>
                    </Link>
                </div>
            ) : (
                <FormProvider {...form}>
                    <FormConstraintsProvider constraints={constraints}>
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <Typography variant="title" as="h2">
                                    {t('forgotPassword.title')}
                                </Typography>
                                <Typography variant="body" isSubtle>
                                    {t('forgotPassword.description')}
                                </Typography>
                            </div>

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
                                            testId="forgot-password-email"
                                        />
                                    )}
                                />
                                {emailErrorKey && (
                                    <Typography variant="caption" isDanger>
                                        {t(emailErrorKey)}
                                    </Typography>
                                )}
                            </div>

                            <Button
                                htmlType="submit"
                                type="primary"
                                loading={isSubmitting}
                                style={{ width: '100%' }}
                                testId="forgot-password-submit"
                            >
                                {t('forgotPassword.submit')}
                            </Button>

                            <Link to="/login" style={{ alignSelf: 'center' }}>
                                <Button type="link">{t('forgotPassword.backToLogin')}</Button>
                            </Link>
                        </form>
                    </FormConstraintsProvider>
                </FormProvider>
            )}
        </Card>
    )
}
