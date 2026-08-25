import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Typography } from '@shared/ui/primitives/Typography';
import { useTheme } from '@shared/theme/hooks/useTheme.tsx';
import { useAuth } from '@features/auth/useAuth';
import { useGetAppVersionQuery } from '@entities/updateAssistant/api/updateAssistantApi';

const BECON_URL = 'https://www.becon.de/';
// Stands in only where the running version can't be asked for: the login page,
// which renders this footer while `/assistant/oc/version` still requires auth.
const FALLBACK_APP_VERSION = '5.1';

type AppFooterProps = {
    hasBorder?: boolean;
}
export const AppFooter = ({ hasBorder = true }: AppFooterProps) => {
    const { t } = useI18n('common');
    const { theme } = useTheme();
    const { isAuthenticated } = useAuth();
    const { data: appVersion } = useGetAppVersionQuery(undefined, { skip: !isAuthenticated });
    const year = new Date().getFullYear();
    const version = appVersion?.version?.trim() || FALLBACK_APP_VERSION;

    return (
        <div style={{ textAlign: 'center', padding: '12px 0', borderTop: hasBorder ? `1px solid ${theme.color.border.default}` : 'none' }}>
            <Typography variant="caption" isSubtle>
                <Trans t={t} i18nKey="footer.copyright" values={{ year, version }}>
                    {'© Copyright {{year}} '}
                    <a href={BECON_URL} target="_blank" rel="noopener noreferrer">
                        becon GmbH
                    </a>
                    {' | version {{version}}'}
                </Trans>
            </Typography>
        </div>
    );
};
