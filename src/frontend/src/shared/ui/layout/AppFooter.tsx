import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Typography } from '@shared/ui/primitives/Typography';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useTheme } from '@shared/theme/hooks/useTheme.tsx';
import { useAuth } from '@features/auth/useAuth';
import { useGetAppVersionQuery } from '@entities/updateAssistant/api/updateAssistantApi';
import { useBreakpoints } from '@app/hooks/useBreakpoints.tsx';
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types';

const OPENCELIUM_URL = 'https://www.opencelium.io/';
const DOCS_URL = 'https://docs.opencelium.io/en/prod/';
const GIT_URL = 'https://github.com/opencelium';
// Stands in only where the running version can't be asked for: the login page,
// which renders this footer while `/assistant/oc/version` still requires auth.
const FALLBACK_APP_VERSION = '5.1';
// The onboarding checklist pill docks fixed at the viewport's bottom-right
// (ONBOARDING_Z_INDEX.checklist = 20300, see @features/onboarding/model/types.ts)
// — the same corner these tooltips pop up from. Without this, the pill's
// z-index wins by default and swallows the tooltip underneath it.
const FOOTER_TOOLTIP_Z_INDEX = 20301;

type AppFooterProps = {
    hasBorder?: boolean;
}
export const AppFooter = ({ hasBorder = true }: AppFooterProps) => {
    const { t } = useI18n('common');
    const { theme } = useTheme();
    const { isAuthenticated } = useAuth();
    const { isMobile } = useBreakpoints();
    const { data: appVersion } = useGetAppVersionQuery(undefined, { skip: !isAuthenticated });
    const year = new Date().getFullYear();
    const version = appVersion?.version?.trim() || FALLBACK_APP_VERSION;

    const links: { icon: IconName; url: string; label: string; testId: string }[] = [
        { icon: 'docs', url: DOCS_URL, label: t('footer.docsLink'), testId: 'footer-docs-link' },
        { icon: 'git', url: GIT_URL, label: t('footer.gitLink'), testId: 'footer-git-link' },
        { icon: 'globe', url: OPENCELIUM_URL, label: t('footer.landingPageLink'), testId: 'footer-landing-page-link' },
    ];

    const linkIcons = (
        <div style={{ display: 'flex', gap: 4 }}>
            {links.map(({ icon, url, label, testId }) => (
                <Tooltip key={icon} content={label} zIndex={FOOTER_TOOLTIP_Z_INDEX}>
                    <IconButton
                        size="xs"
                        type="text"
                        iconProps={{ name: icon, isSubtle: true }}
                        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                        testId={testId}
                    />
                </Tooltip>
            ))}
        </div>
    );

    // Mobile drops the "OpenCelium GmbH" link text — there isn't room beside the
    // icons — and stacks the icons under it instead of right-aligning them, so
    // neither ever competes for width on a narrow screen.
    if (isMobile) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderTop: hasBorder ? `1px solid ${theme.color.border.default}` : 'none',
                }}
            >
                <Typography variant="caption" isSubtle>
                    {t('footer.copyrightMobile', { year, version })}
                </Typography>
                {linkIcons}
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                padding: '12px 16px',
                borderTop: hasBorder ? `1px solid ${theme.color.border.default}` : 'none',
            }}
        >
            <Typography variant="caption" isSubtle>
                <Trans t={t} i18nKey="footer.copyright" values={{ year, version }}>
                    {'© Copyright {{year}} '}
                    <a href={OPENCELIUM_URL} target="_blank" rel="noopener noreferrer">
                        OpenCelium GmbH
                    </a>
                    {' | version {{version}}'}
                </Trans>
            </Typography>
            <div style={{ position: 'absolute', right: 16 }}>{linkIcons}</div>
        </div>
    );
};
