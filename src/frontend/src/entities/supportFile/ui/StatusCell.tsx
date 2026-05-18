import { extractRunStatus } from '../model/supportFile.utils'
import type { SupportFile } from '../model/types'

type Props = {
    row: SupportFile
}

function resolveBackground(row: SupportFile): string {
    const status = extractRunStatus(row.supportFile)
    if (status === 'success') return '#c3f5c3'
    if (status === 'fail') return '#f5c3c3'
    return '#cccccc'
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
