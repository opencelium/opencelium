import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { Card } from '@shared/ui/primitives/Card'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetOidcConfigQuery } from '@entities/oidc/api/oidcApi'
import type { OidcConfig } from '@entities/oidc/model/types'

type Row = {
    label: string
    value: string
}

export function OidcConfigPage() {
    const { t } = useI18n('entities')
    const { data, isLoading, isError } = useGetOidcConfigQuery()

    if (isLoading) {
        return (
            <PageWrapper>
                <Loading />
            </PageWrapper>
        )
    }

    if (isError || !data) {
        return (
            <PageWrapper>
                <Card>
                    <Typography variant="body" isDanger>
                        {t('oidc.loadFailed')}
                    </Typography>
                </Card>
            </PageWrapper>
        )
    }

    const optionally = (value: string | null) => value || t('oidc.values.notConfigured')
    const onOff = (value: boolean) => t(value ? 'oidc.values.enabled' : 'oidc.values.disabled')

    const rows: Row[] = [
        { label: t('oidc.fields.enabled.label'), value: onOff(data.enabled) },
        { label: t('oidc.fields.displayName.label'), value: data.displayName },
        { label: t('oidc.fields.issuerUri.label'), value: optionally(data.issuerUri) },
        { label: t('oidc.fields.clientId.label'), value: optionally(data.clientId) },
        {
            label: t('oidc.fields.clientSecret.label'),
            value: t(data.clientSecretConfigured ? 'oidc.values.configured' : 'oidc.values.notConfigured'),
        },
        { label: t('oidc.fields.scopes.label'), value: data.scopes.join(', ') },
        { label: t('oidc.fields.redirectUri.label'), value: optionally(data.redirectUri) },
        { label: t('oidc.fields.frontendRedirectUri.label'), value: optionally(data.frontendRedirectUri) },
        { label: t('oidc.fields.userInfoUri.label'), value: optionally(data.userInfoUri) },
        { label: t('oidc.fields.emailClaim.label'), value: data.emailClaim },
        { label: t('oidc.fields.groupClaim.label'), value: data.groupClaim },
        { label: t('oidc.fields.defaultRole.label'), value: optionally(data.defaultRole) },
        { label: t('oidc.fields.jitProvisioning.label'), value: onOff(data.jitProvisioning) },
        { label: t('oidc.fields.groupRoleMapping.label'), value: formatGroupMapping(data, t) },
    ]

    return (
        <PageWrapper>
            <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <Typography variant="label" isBold>
                            {t('oidc.header')}
                        </Typography>
                        <Typography variant="body" isSubtle>
                            {t('oidc.subheader')}
                        </Typography>
                    </div>

                    {!data.enabled && (
                        <Typography variant="body" isSubtle>
                            {t('oidc.empty')}
                        </Typography>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {rows.map((row) => (
                            <div
                                key={row.label}
                                style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}
                            >
                                <div style={{ minWidth: 200 }}>
                                    <Typography variant="body" isSubtle>
                                        {row.label}
                                    </Typography>
                                </div>
                                <Typography variant="body">{row.value}</Typography>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </PageWrapper>
    )
}

function formatGroupMapping(config: OidcConfig, t: (key: string, options?: Record<string, unknown>) => string): string {
    if (config.groupRoleMapping.length === 0) {
        return t('oidc.values.notConfigured')
    }

    return config.groupRoleMapping
        .map((mapping) => t('oidc.groupMappingRow', { group: mapping.group, role: mapping.ocRole }))
        .join(', ')
}
