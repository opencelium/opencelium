import { useI18n } from '@shared/i18n/hooks/useI18n'
import { countItems, formatReleaseDate } from '@features/changelog/model/changelog.utils'
import type { ChangelogRelease, CurrentReleaseKind } from '@features/changelog/model/types'

type Props = {
    release: ChangelogRelease
    currentKind?: CurrentReleaseKind
    hasSummary?: boolean
}

export function ReleaseHeader({ release, currentKind, hasSummary = false }: Props) {
    const { t, lang } = useI18n('entities')
    const featureCount = countItems(release, 'features')
    const fixCount = countItems(release, 'fixes')

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
