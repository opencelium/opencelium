import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Typography } from '@shared/ui/primitives/Typography';
import { useTheme } from '@shared/theme/hooks/useTheme.tsx';

const BECON_URL = 'https://www.becon.de/';
const APP_VERSION = '5.0';

type AppFooterProps = {
    hasBorder?: boolean;
}
export const AppFooter = ({ hasBorder = true }: AppFooterProps) => {
    const { t } = useI18n('common');
    const { theme } = useTheme();
    const year = new Date().getFullYear();

    return (
        <div style={{ textAlign: 'center', padding: '12px 0', borderTop: hasBorder ? `1px solid ${theme.color.border.default}` : 'none' }}>
            <Typography variant="caption" isSubtle>
                <Trans t={t} i18nKey="footer.copyright" values={{ year, version: APP_VERSION }}>
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
