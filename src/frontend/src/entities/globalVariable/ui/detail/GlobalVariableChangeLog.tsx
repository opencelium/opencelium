import React, { useMemo, useState } from 'react'
import { Pagination } from 'antd'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Table } from '@shared/ui/primitives/Table'
import { Empty } from '@shared/ui/primitives/Empty'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetGlobalVariableChangesQuery } from '../../api/globalVariableApi'
import type { GlobalVariable } from '../../model/types'
import { buildChangeLogColumns } from './changeLogColumns'
import { useRestoreChange } from './useRestoreChange'

const PAGE_SIZE = 20

export const GlobalVariableChangeLog: React.FC<{ variable: GlobalVariable }> = ({ variable }) => {
    const { t, lang } = useI18n('entities')
    const [page, setPage] = useState(0)
    const { restore, restoringId } = useRestoreChange(variable)

    const { data, isFetching } = useGetGlobalVariableChangesQuery({ id: variable.id, page, size: PAGE_SIZE })
    const rows = useMemo(() => data?.content ?? [], [data])
    const columns = useMemo(
        () => buildChangeLogColumns({ t, lang, canRestore: variable.myPermissions.includes('EDIT'), restoringId, onRestore: restore }),
        [t, lang, variable.myPermissions, restoringId, restore],
    )
    const tableInstance = useReactTable({ data: rows, columns, enableRowSelection: false, getCoreRowModel: getCoreRowModel() })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-testid="global-variable-changes">
            <Table
                data={rows}
                columns={columns}
                tableInstance={tableInstance}
                isLoading={isFetching}
                emptyState={<Empty description={t('global-variable.changes.empty')} />}
            />
            {(data?.totalItems ?? 0) > PAGE_SIZE && (
                <Pagination
                    align="end"
                    current={page + 1}
                    pageSize={PAGE_SIZE}
                    total={data?.totalItems ?? 0}
                    showSizeChanger={false}
                    onChange={(next) => setPage(next - 1)}
                />
            )}
        </div>
    )
}
