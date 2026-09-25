import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppDispatch } from '@shared/lib/storeHooks'
import { authActions } from '@entities/auth/model/authSlice'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Button } from '@shared/ui/primitives/Button'
import { Card } from '@shared/ui/primitives/Card'
import { Typography } from '@shared/ui/primitives/Typography'
import { completeOidcLogin } from '@features/auth/oidc/oidcLogin'
import { TotpLoginDialog } from './TotpLoginDialog'
import type { TotpChallenge } from '@entities/auth/model/types'

const FORM_WIDTH = 400

type AuthKey = Parameters<ReturnType<typeof useI18n<'auth'>>['t']>[0]

/** Error codes the backend appends to the frontend redirect that deserve their own message. */
const ERROR_KEYS: Record<string, AuthKey> = {
    user_not_provisioned: 'oidc.errors.notProvisioned',
    access_denied: 'oidc.errors.accessDenied',
}

export function OidcCallback() {
    const [searchParams] = useSearchParams()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { t } = useI18n('auth')
    const [totp, setTotp] = useState<TotpChallenge | null>(null)
    const [errorKey, setErrorKey] = useState<AuthKey | null>(null)
    const started = useRef(false)

    const code = searchParams.get('code')
    const error = searchParams.get('error')

    useEffect(() => {
        // The effect runs twice under StrictMode in development and the one-time code is
        // consumed by the first exchange, so the second attempt would fail with a valid code.
        if (started.current) return
        started.current = true

        if (error || !code) {
            setErrorKey(ERROR_KEYS[error ?? ''] ?? 'oidc.errors.failed')
            return
        }

        completeOidcLogin(code)
            .then((result) => {
                // A 2FA-enabled account gets a challenge instead of a session, exactly like /login.
                if (result.status === 'totp-required') {
                    setTotp(result.challenge)
                    return
                }
                dispatch(authActions.setSession(result.session))
            })
            .catch(() => setErrorKey('oidc.errors.failed'))
    }, [code, error, dispatch])

    if (errorKey) {
        return (
            <Card style={{ width: FORM_WIDTH }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Typography variant="body" isDanger>
                        {t(errorKey)}
                    </Typography>
                    <Button
                        type="primary"
                        onClick={() => navigate('/login', { replace: true })}
                        testId="oidc-back-to-login"
                    >
                        {t('oidc.backToLogin')}
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <>
            <Card style={{ width: FORM_WIDTH }}>
                <Typography variant="body" isSubtle>
                    {t('oidc.completing')}
                </Typography>
            </Card>
            <TotpLoginDialog
                open={!!totp}
                challenge={totp}
                onClose={() => navigate('/login', { replace: true })}
            />
        </>
    )
}
