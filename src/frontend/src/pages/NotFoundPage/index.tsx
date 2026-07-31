import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/primitives/Button'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'

export default function NotFoundPage() {
    const { t } = useI18n('common')
    const navigate = useNavigate()

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '70vh',
                padding: 24,
                gap: 8,
            }}
        >
            <span
                style={{
                    fontSize: 'clamp(96px, 22vw, 180px)',
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    color: 'var(--color-action-primary)',
                    userSelect: 'none',
                }}
            >
                {t('notFound.code')}
            </span>

            <Typography variant="headline" as="h1">
                {t('notFound.title')}
            </Typography>

            <div style={{ maxWidth: 420, marginTop: 4 }}>
                <Typography isSubtle>{t('notFound.subtitle')}</Typography>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button type="default" iconLeft="arrow-left" onClick={() => navigate(-1)}>
                    {t('notFound.goBack')}
                </Button>
                <Button type="primary" onClick={() => navigate('/')}>
                    {t('notFound.goHome')}
                </Button>
            </div>
        </div>
    )
}
