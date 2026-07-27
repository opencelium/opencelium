import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@features/auth/useAuth'
import { API_TIMEOUT_ERROR_NAME, ApiFetchError } from '@shared/api/apiFetch'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext'
import { getStringConstraints } from '@shared/form/zodConstraints'
import { totpCodeSchema, type TotpCodeValues } from '../model/totpCode.schema'
import type { TotpChallenge } from '@entities/auth/model/types'
import { Button } from '@shared/ui/primitives/Button'
import { Dialog } from '@shared/ui/primitives/Dialog'
import { FormInput } from '@shared/ui/form/FormInput'
import { Hint } from '@shared/ui/primitives/Hint'
import { Typography } from '@shared/ui/primitives/Typography'

type Props = {
    open: boolean
    challenge: TotpChallenge | null
    onClose: () => void
}

type AuthKey = Parameters<ReturnType<typeof useI18n<'auth'>>['t']>[0]

/** "2KAFAEEIYVGHAANU" → "2KAF AEEI YVGH AANU" — easier to copy by eye. */
function formatSecret(secret: string): string {
    return secret.match(/.{1,4}/g)?.join(' ') ?? secret
}

const constraints = { code: getStringConstraints(totpCodeSchema, 'code') }

export function TotpLoginDialog({ open, challenge, onClose }: Props) {
    const { validateTotp } = useAuth()
    const { t } = useI18n('auth')
    const form = useForm<TotpCodeValues>({
        resolver: zodResolver(totpCodeSchema),
        defaultValues: { code: '' },
    })

    // Only the first-time enrolment ('setup') carries a QR + secret to display.
    const setupChallenge = challenge?.mode === 'setup' ? challenge : null

    const onSubmit = async (data: TotpCodeValues) => {
        if (!challenge) return
        const {code} = data;
        try {
            // On success the session lands in Redux and LoginPage redirects away — the
            // dialog unmounts with the rest of the login screen, so there is nothing to close.
            await validateTotp({ code: code.trim(), sessionId: challenge.sessionId })
        } catch (e) {
            // Only a genuine fetch failure ("Failed to fetch") is a network error;
            // other TypeErrors are programming bugs and must not be hidden as such.
            const isNetworkError =
                (e instanceof Error && e.name === API_TIMEOUT_ERROR_NAME) ||
                (e instanceof TypeError && e.message === 'Failed to fetch')
            const messageKey: AuthKey = isNetworkError
                ? 'errors.network'
                : e instanceof ApiFetchError && e.status === 401
                  ? 'totp.errors.invalidCode'
                  : 'errors.failed'
            form.setError('code', { type: 'server', message: messageKey })
        }
    }

    // Both the zod 'required' message and the server errors above are auth-namespace keys;
    // resolve them here so FormControl renders the localized text rather than the raw key.
    const errorKey = form.formState.errors.code?.message as AuthKey | undefined
    const displayError = errorKey ? t(errorKey) : undefined

    const handleClose = () => {
        form.reset({ code: '' })
        onClose()
    }

    return (
        <Dialog open={open} onClose={handleClose} title={t('totp.title')} width={520} testId="totp-dialog">
            <FormProvider {...form}>
                <FormConstraintsProvider constraints={constraints}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
                    >
                        <Hint noPrefix>{setupChallenge ? t('totp.hint') : t('totp.verifyHint')}</Hint>

                        {setupChallenge && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 24,
                                }}
                            >
                                <img
                                    src={setupChallenge.qr}
                                    alt={t('totp.qrAlt')}
                                    style={{ width: 168, height: 168, borderRadius: 8 }}
                                />
                                <Typography variant="body" isSubtle>
                                    {t('totp.or')}
                                </Typography>
                                <div
                                    style={{
                                        border: '1px solid var(--color-border-default)',
                                        borderRadius: 8,
                                        padding: '14px 18px',
                                        fontFamily: 'monospace',
                                        letterSpacing: 1,
                                    }}
                                >
                                    <Typography variant="body" isBold>
                                        {formatSecret(setupChallenge.secretKey)}
                                    </Typography>
                                </div>
                            </div>
                        )}

                        <FormInput
                            name="code"
                            label={t('totp.codeLabel')}
                            placeholder={t('totp.codePlaceholder')}
                            error={displayError}
                            // readOnly, not disabled: a disabled RHF Controller unsets its
                            // value on submit, so `data.code` would arrive undefined.
                            readOnly={form.formState.isSubmitting}
                            autoFocus
                            testId="totp-code"
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                htmlType="submit"
                                type="primary"
                                loading={form.formState.isSubmitting}
                                testId="totp-submit"
                            >
                                {t('totp.submit')}
                            </Button>
                        </div>
                    </form>
                </FormConstraintsProvider>
            </FormProvider>
        </Dialog>
    )
}
