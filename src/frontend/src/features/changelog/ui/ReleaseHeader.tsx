import { useI18n } from '@shared/i18n/hooks/useI18n'
import { countItems, formatReleaseDate } from '@features/changelog/model/changelog.utils'
import type { ChangelogRelease, CurrentReleaseKind } from '@features/changelog/model/types'
import { getReleaseDocs } from '@features/changelog/model/releaseDocs'
import { DocsLink } from '@shared/ui/actions/DocsLink'

type Props = {
    release: ChangelogRelease
    currentKind?: CurrentReleaseKind
    hasSummary?: boolean
}

export function ReleaseHeader({ release, currentKind, hasSummary = false }: Props) {
    const { t, lang } = useI18n('entities')
    const featureCount = countItems(release, 'features')
    const fixCount = countItems(release, 'fixes')
    const docs = getReleaseDocs(release.version)

    return (
        <div className="changelog-release-header">
            <span className="changelog-release-header__version">{release.version}</span>
            {currentKind && (
                <span className="changelog-badge changelog-badge--current">
                    {t(`changelog.badges.${currentKind}`)}
                </span>
            )}
            {release.isMajor && <span className="changelog-badge changelog-badge--major">{t('changelog.badges.major')}</span>}
            <span className="changelog-release-header__date">{formatReleaseDate(release.date, lang)}</span>
            {docs && (
                <DocsLink page={docs.page} testId={`changelog-whats-new-${release.version}`}>
                    {t('changelog.docs.whatsNew', { version: release.version })}
                </DocsLink>
            )}
            {docs?.upgradeAnchor && !hasSummary && (
                <DocsLink page={docs.page} anchor={docs.upgradeAnchor} testId={`changelog-upgrade-${release.version}`}>
                    {t('changelog.docs.upgrade')}
                </DocsLink>
            )}
            {hasSummary && (
                <span className="changelog-release-header__summary">
                    {[
                        featureCount > 0 && t('changelog.summary.features', { count: featureCount }),
                        fixCount > 0 && t('changelog.summary.fixes', { count: fixCount }),
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                </span>
            )}
        </div>
    )
}
