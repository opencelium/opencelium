import { Icon } from '@shared/ui/primitives/Icon'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { splitTicket } from '@features/changelog/model/changelog.utils'
import type { ChangelogRelease, ChangelogSectionKind } from '@features/changelog/model/types'
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types'

const SECTION_ICON: Record<ChangelogSectionKind, IconName> = {
    features: 'flash',
    fixes: 'check-circle',
}

type Props = {
    release: ChangelogRelease
}

export function ReleaseNotes({ release }: Props) {
    const { t } = useI18n('entities')

    return (
        <div className="changelog-notes">
            {release.sections.map((section) => (
                <section key={section.kind} className={`changelog-notes__section changelog-notes__section--${section.kind}`}>
                    <h4 className="changelog-notes__heading">
                        <Icon name={SECTION_ICON[section.kind]} size={16} />
                        <span>{t(`changelog.sections.${section.kind}`)}</span>
                        <span className="changelog-notes__count">{section.items.length}</span>
                    </h4>
                    <ul className="changelog-notes__list">
                        {section.items.map((item) => {
                            const { text, ticket } = splitTicket(item)
                            return (
                                <li key={item} className="changelog-notes__item">
                                    <span>{text}</span>
                                    {ticket && <span className="changelog-notes__ticket">{ticket}</span>}
                                </li>
                            )
                        })}
                    </ul>
                </section>
            ))}
        </div>
    )
}
