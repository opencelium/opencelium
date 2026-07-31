import { extractRunStatus } from '../model/supportFile.utils'
import type { SupportFile } from '../model/types'

type Props = {
    row: SupportFile
}

function resolveBackground(row: SupportFile): string {
    const status = extractRunStatus(row.supportFile)
    if (status === 'success') return 'var(--color-status-success-bg)'
    if (status === 'fail') return 'var(--color-status-error-bg)'
    return 'var(--color-background-disabled)'
}

export function StatusCell({ row }: Props) {
    return (
        <div
            style={{
                width: '100%',
                minHeight: 32,
                backgroundColor: resolveBackground(row),
            }}
        />
    )
}
