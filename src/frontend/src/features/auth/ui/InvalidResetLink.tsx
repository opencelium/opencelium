import { Link } from 'react-router-dom'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Button } from '@shared/ui/primitives/Button'
import { Typography } from '@shared/ui/primitives/Typography'

export function InvalidResetLink() {
    const { t } = useI18n('auth')

    return (
        <div
            style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}
            data-testid="set-password-invalid-link"
        >
            <Typography variant="title" as="h2">
                {t('setPassword.invalidLink.title')}
            </Typography>
            <Typography variant="body" isSubtle>
                {t('setPassword.invalidLink.message')}
            </Typography>
            <Link to="/forgot-password" style={{ width: '100%' }}>
                <Button type="primary" style={{ width: '100%' }} testId="set-password-request-new-link">
                    {t('setPassword.invalidLink.requestNew')}
                </Button>
            </Link>
            <Link to="/login">
                <Button type="link">{t('setPassword.backToLogin')}</Button>
            </Link>
        </div>
    )
}
