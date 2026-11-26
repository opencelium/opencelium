import { useState } from 'react'
import { Controller, FormProvider } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetchWithHeaders, ApiFetchError, API_TIMEOUT_ERROR_NAME } from '@shared/api/apiFetch'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { errorBus } from '@shared/errors/api/errorBus'
import { useSetPasswordForm } from '../model/useSetPasswordForm'
import type { SetPasswordFormValues } from '../model/setPassword.schema'
import { Button } from '@shared/ui/primitives/Button'
import { Card } from '@shared/ui/primitives/Card'
import { Input } from '@shared/ui/primitives/Input'
import { Typography } from '@shared/ui/primitives/Typography'
import { InvalidResetLink } from './InvalidResetLink'
import { PasswordResetDone } from './PasswordResetDone'

const FORM_WIDTH = 400

type AuthKey = Parameters<ReturnType<typeof useI18n<'auth'>>['t']>[0]
type ResetStatus = 'editing' | 'done' | 'invalidLink'

function isInvalidToken(error: ApiFetchError): boolean {
    if (error.status !== 400) return false
    const code = (error.body as { error?: unknown } | null | undefined)?.error
    return code === 'INVALID_TOKEN'
}

export function SetPasswordForm() {
    const form = useSetPasswordForm()
    const { t } = useI18n('auth')
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')?.trim() ?? ''

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [status, setStatus] = useState<ResetStatus>(token ? 'editing' : 'invalidLink')

    const onSubmit = async ({ password, repeatPassword }: SetPasswordFormValues) => {
        setIsSubmitting(true)
        try {
            await apiFetchWithHeaders('/auth/reset-password', {
                method: 'POST',
                body: { token, newPassword: password, confirmPassword: repeatPassword },
                timeoutMs: 15_000,
            })
            setStatus('done')
        } catch (e) {
            if (e instanceof ApiFetchError && isInvalidToken(e)) {
                setStatus('invalidLink')
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
            {status === 'done' && <PasswordResetDone />}
            {status === 'invalidLink' && <InvalidResetLink />}
            {status === 'editing' && (
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
                                        testId="set-password-password"
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
                                        testId="set-password-repeat"
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
                            testId="set-password-submit"
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
