import { Tag } from 'antd'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@shared/ui/primitives/Button'
import { Typography } from '@shared/ui/primitives/Typography'
import type { GlobalVariableChange } from '../../model/types'
import { ActorCell, WhatCell, type Translate } from './ChangeLogCells'

type Args = {
    t: Translate
    lang: string
    canRestore: boolean
    restoringId: number | null
    onRestore: (change: GlobalVariableChange) => void
}

export const buildChangeLogColumns = ({ t, lang, canRestore, restoringId, onRestore }: Args): ColumnDef<GlobalVariableChange>[] => [
    {
        id: 'changedAt',
        header: () => t('global-variable.changes.columns.changedAt'),
        cell: ({ row: { original } }) => new Date(original.changedAt).toLocaleString(lang),
    },
    {
        id: 'changeType',
        header: () => t('global-variable.changes.columns.changeType'),
        cell: ({ row: { original } }) => t(`global-variable.changes.type.${original.changeType}`),
    },
    {
        id: 'actor',
        header: () => t('global-variable.changes.columns.actor'),
        cell: ({ row: { original } }) => <ActorCell change={original} t={t} />,
    },
    {
        id: 'what',
        header: () => t('global-variable.changes.columns.what'),
        cell: ({ row: { original } }) => <WhatCell change={original} t={t} />,
    },
    {
        id: 'result',
        header: () => t('global-variable.changes.columns.result'),
        cell: ({ row: { original } }) => (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 }}>
                <Tag color={original.result === 'SAVED' ? 'success' : 'error'}>{t(`global-variable.changes.result.${original.result}`)}</Tag>
                {original.reason && (
                    <span style={{ overflowWrap: 'anywhere' }}><Typography variant="caption" isSubtle>{original.reason}</Typography></span>
                )}
            </div>
        ),
    },
    {
        id: 'restore',
        header: () => '',
        meta: { align: 'right' },
        cell: ({ row: { original } }) => canRestore && original.restorable && (
            <Button type="link" loading={restoringId === original.id} onClick={() => onRestore(original)}
                testId={`global-variable-change-restore-${original.id}`}>
                {t('global-variable.changes.restore')}
            </Button>
        ),
    },
]
