import React from 'react'
import { Link } from 'react-router-dom'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { ImpactEntry } from '../../model/types'
import { sourceLink } from '../../model/display'

type Props = {
    entries: ImpactEntry[]
}

export const ImpactList: React.FC<Props> = ({ entries }) => {
    const { t } = useI18n('entities')
    return (
        <ul style={{ margin: 0, paddingInlineStart: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {entries.map((entry, index) => {
                const link = sourceLink(entry.sourceType, entry.sourceId)
                return (
                    <li key={`${entry.sourceType}-${entry.sourceId}-${index}`} data-testid="global-variable-impact-entry">
                        <Typography variant="caption" isSubtle>
                            {t(`global-variable.usage.sourceType.${entry.sourceType}`)}
                        </Typography>{' '}
                        {link ? <Link to={link}>{entry.sourceTitle}</Link> : <strong>{entry.sourceTitle}</strong>}
                        {entry.elementLabel && <> · {entry.elementLabel}</>}
                        <div>
                            <Typography variant="caption">
                                {t(`global-variable.impact.reason.${entry.reason}`, { ref: entry.ref ?? '' })}
                            </Typography>
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
