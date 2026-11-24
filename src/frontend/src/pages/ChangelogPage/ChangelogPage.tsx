import { useMemo } from 'react'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { Collapse } from '@shared/ui/primitives/Collapse'
import { Empty } from '@shared/ui/primitives/Empty'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetAppVersionQuery } from '@entities/updateAssistant/api/updateAssistantApi'
import { CHANGELOG } from '@features/changelog/model/changelog.data'
import { buildChangelogView } from '@features/changelog/model/changelog.utils'
import { ReleaseHeader } from '@features/changelog/ui/ReleaseHeader'
import { ReleaseNotes } from '@features/changelog/ui/ReleaseNotes'
import '@features/changelog/ui/changelog.css'

export function ChangelogPage() {
    const { t } = useI18n('entities')
    const { data: appVersion, isLoading } = useGetAppVersionQuery()
    // Wait for the version so the "installed" release doesn't jump in after a "latest" one rendered.
    const { current, previous } = useMemo(
        () => buildChangelogView(CHANGELOG, isLoading ? undefined : appVersion?.version),
        [appVersion?.version, isLoading],
    )

    return (
        <PageWrapper>
            <div className="changelog-page" data-testid="changelog-page">
                <header className="changelog-page__header">
                    <Typography variant="headline" as="h1">{t('changelog.title')}</Typography>
                    <Typography variant="body" isSubtle>{t('changelog.subtitle')}</Typography>
                </header>

                {current ? (
                    <article className="changelog-current" data-testid="changelog-current">
                        <ReleaseHeader release={current.release} currentKind={current.kind} />
                        <ReleaseNotes release={current.release} />
                    </article>
                ) : (
                    <Empty description={t('changelog.empty')} />
                )}

                {previous.length > 0 && (
                    <section className="changelog-previous">
                        <Typography variant="section-label" as="h2">{t('changelog.previous')}</Typography>
                        <Collapse
                            items={previous.map((release) => ({
                                key: release.version,
                                label: <ReleaseHeader release={release} hasSummary />,
                                content: <ReleaseNotes release={release} />,
                                testId: `changelog-release-${release.version}`,
                            }))}
                        />
                    </section>
                )}
            </div>
        </PageWrapper>
    )
}

export default ChangelogPage
