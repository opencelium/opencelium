import React from 'react';
import { Icon } from '@shared/ui/primitives/Icon';
import { Typography } from '@shared/ui/primitives/Typography';
import { useI18n } from '@shared/i18n/hooks/useI18n';

const NoAccess = ({ message }: { message?: string }) => {
    const { t } = useI18n('common');

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '48px 24px',
                gap: 8,
            }}
        >
            <Icon name="lock" size={40} isSubtle />
            <Typography variant="title" as="h2">
                {t('accessDenied.title')}
            </Typography>
            <div style={{ maxWidth: 360 }}>
                <Typography isSubtle>{message || t('accessDenied.subtitle')}</Typography>
            </div>
        </div>
    );
};

export default NoAccess;
