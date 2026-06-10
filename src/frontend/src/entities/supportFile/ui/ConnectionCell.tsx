import { Link } from 'react-router-dom'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { SupportFile } from '../model/types'

type Props = {
    row: SupportFile
}

export function ConnectionCell({ row }: Props) {
    const { t: tEntities } = useI18n('entities')

    if (row.status === 'CONNECTION_FOUND' && row.connectionTitle) {
        return <Link to={`/workflow/update/${row.connectionId}`}>{row.connectionTitle}</Link>
    }

    if (!row.connectionTitle) {
        return <span style={{ color: 'var(--color-text-disabled)' }}>{tEntities('support-file.list.deletedConnection')}</span>
    }

    return <span>{row.connectionTitle}</span>
}
