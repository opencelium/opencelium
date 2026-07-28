import React, { useEffect, useMemo, useState } from 'react';
import { Trans } from 'react-i18next';
import { message } from 'antd';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getExpandedRowModel,
    type ColumnDef,
    type PaginationState,
    type Row,
    type RowSelectionState,
    type SortingState,
} from '@tanstack/react-table';

import { entityRegistry } from '@/engine/entity/EntityRegistry';
import { useFetchEntitiesQuery } from '@shared/api/genericApi';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { apiExecutor } from '@shared/api/apiExecutor';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { getValueByPath } from '@shared/utils/getValueByPath';
import { buildTestId } from '@shared/testing/testId';
import { useAuth } from '@features/auth/useAuth';
import { hasComponentPermission, type CrudAction } from '@/engine/policy';
import NoAccess from '@shared/ui/feedback/NoAccess';

import { Table } from '@shared/ui/primitives/Table';
import { tableDefaultColumn } from '@shared/ui/primitives/Table/Table.utils';
import { Input } from '@shared/ui/primitives/Input';
import { Icon } from '@shared/ui/primitives/Icon';
import { Button } from '@shared/ui/primitives/Button';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { Typography } from '@shared/ui/primitives/Typography';
import { useDialog } from '@shared/ui/dialog/useDialog';
import { EntityDialogContent } from './EntityDialogContent';

import type {
    BulkDeleteConfig,
    EntityDefinition,
    ListAction,
    ListFilterState,
    ListFilterValue,
    UpdateActionConfig,
} from '@/engine/entity/EntityDefinition';
import { useEntityUpdateOpener } from '@shared/ui/wizard-step/list/actions/useEntityUpdateOpener';
import { buildEntityColumns } from './buildEntityColumns';
import { buildRowActionsColumn } from './buildRowActionsColumn';
import { buildExpanderColumn } from './buildExpanderColumn';
import { BulkActionButton } from './BulkActionButton';
import {
    ListFilters,
    applyListFilters,
    buildInitialFilterState,
} from './ListFilters';

interface Props {
    entityName: string;
}

type EntityRow = Record<string, unknown>;

const normalizeRows = (data: unknown): EntityRow[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data as EntityRow[];
    if (typeof data === 'object') {
        const d = data as Record<string, unknown>;
        if (Array.isArray(d.items)) return d.items as EntityRow[];
        if (Array.isArray(d.data)) return d.data as EntityRow[];
        if (Array.isArray(d.content)) return d.content as EntityRow[];
    }
    return [];
};

const defaultActionsForEntity = (entity: EntityDefinition): ListAction[] => {
    const routes = entity.routes ?? [];
    const actions: ListAction[] = [];
    if (routes.some((r) => r.type === 'view')) actions.push({ type: 'view' });
    if (routes.some((r) => r.type === 'edit')) actions.push({ type: 'update' });
    if (entity.api) actions.push({ type: 'delete' });
    return actions;
};

const resolveBulkConfig = (entity: EntityDefinition): BulkDeleteConfig | null => {
    const cfg = entity.list?.bulkDelete;
    if (!cfg) return null;
    return cfg === true ? {} : cfg;
};

const EMPTY_ROW_DECORATION = {};
const emptyRowDecoration = () => EMPTY_ROW_DECORATION;

const IDENTITY_SUB_ROWS = (rows: EntityRow[]) => rows;
const noRowSubRows = () => IDENTITY_SUB_ROWS;

export const GenericEntityList: React.FC<Props> = ({ entityName }) => {
    const entity = entityRegistry.get(entityName);
    const dialog = useDialog();
    const openUpdate = useEntityUpdateOpener();
    const confirm = useConfirm();
    const { t: tEntities } = useI18n('entities');
    const { t: tCommon } = useI18n('common');
    const { normalizedUser } = useAuth();
    const permissions = normalizedUser?.permissions ?? [];
    const canForAction = (action: CrudAction) =>
        !entity.permissionComponent || hasComponentPermission(permissions, entity.permissionComponent, action);
    const hasReadAccess = !entity.permissionComponent || hasComponentPermission(permissions, entity.permissionComponent, 'READ');

    const fetchUrl = entity.list?.fetchUrl ?? `${entity.api?.baseUrl ?? `/${entity.name}`}/all`;
    const { data, isLoading } = useFetchEntitiesQuery(fetchUrl, { skip: !entity.api || !hasReadAccess });

    const useRowDecoration = entity.list?.useRowDecoration ?? emptyRowDecoration;
    const { rowClassName } = useRowDecoration();

    const useRowSubRows = entity.list?.useRowSubRows ?? noRowSubRows;
    const attachSubRows = useRowSubRows();
    const hasSubRows = !!entity.list?.useRowSubRows;

    // List rows use the raw API shape — `api.mapToForm` is meant for form rendering,
    // not for table cells. Use FieldDefinition.table.mapToValue for per-column shaping.
    // `list.mapToRows` overrides the default array normalization for keyed-object responses.
    const rows = useMemo(() => {
        const mapToRows = entity.list?.mapToRows;
        if (mapToRows) return (mapToRows(data) ?? []) as EntityRow[];
        return normalizeRows(data);
    }, [data, entity.list?.mapToRows]);

    const actions: ListAction[] = (entity.list?.actions ?? defaultActionsForEntity(entity)).filter((a) => {
        if (a.type === 'update') return canForAction('UPDATE');
        if (a.type === 'delete') return canForAction('DELETE');
        if (a.type === 'custom') return !a.permissionAction || canForAction(a.permissionAction);
        return true;
    });
    const hasCreateRoute = (entity.routes ?? []).some((r) => r.type === 'create') && canForAction('CREATE');
    const searchable = entity.list?.searchable ?? entity.fields.some((f) => f.table?.searchable);
    const bulkConfig = resolveBulkConfig(entity);
    const bulkActions = (entity.list?.bulkActions ?? []).filter(
        (a) => !a.permissionAction || canForAction(a.permissionAction),
    );
    const headerActions = (entity.list?.headerActions ?? []).filter(
        (a) => !a.permissionAction || canForAction(a.permissionAction),
    );
    const filters = entity.list?.filters ?? [];
    const hasFilters = filters.length > 0;
    const selectable = (!!bulkConfig && canForAction('DELETE')) || bulkActions.length > 0 || !!entity.list?.selectable;
    const rowKey = entity.list?.rowKey ?? entity.api?.primaryKey ?? 'id';
    const bulkField = bulkConfig?.field ?? rowKey;

    // A row is clickable only when the list exposes an update action — clicking
    // it opens the same update flow as the row's edit action.
    const updateAction = actions.find((a): a is UpdateActionConfig => a.type === 'update');
    const handleRowClick = updateAction
        ? (row: EntityRow) =>
              openUpdate(entity, updateAction, row, String(getValueByPath(row, rowKey) ?? ''))
        : undefined;

    const columns = useMemo<ColumnDef<EntityRow>[]>(() => {
        const cols = buildEntityColumns<EntityRow>(entity, { tEntities });
        if (hasSubRows) {
            const expanderLabel = entity.list?.subRowsColumnLabelKey
                ? tEntities(entity.list.subRowsColumnLabelKey)
                : undefined;
            cols.unshift(buildExpanderColumn<EntityRow>(entity, expanderLabel));
        }
        if (actions.length > 0) {
            cols.push(buildRowActionsColumn<EntityRow>(entity, actions));
        }
        return cols;
    }, [entity, actions, tEntities, hasSubRows]);

    const initialSorting: SortingState = entity.list?.defaultSort
        ? [{ id: entity.list.defaultSort.field, desc: entity.list.defaultSort.direction === 'desc' }]
        : [];

    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    // Controlled (not left to tanstack's uncontrolled default) — see the
    // `autoResetPageIndex: false` note below for why this alone isn't enough
    // to keep the page put across a row-action refetch.
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: entity.list?.pageSize ?? 10,
    });
    const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
    const [filterState, setFilterState] = useState<ListFilterState>(() =>
        buildInitialFilterState(filters),
    );
    const [areFiltersOpen, setAreFiltersOpen] = useState(false);

    const filteredRows = useMemo(
        () => applyListFilters(rows, filters, filterState) as EntityRow[],
        [rows, filters, filterState],
    );

    // Attach live sub-rows (e.g. running executions) just before the table reads
    // the data, so a new array identity invalidates the row model when they change.
    const tableRows = useMemo(
        () => attachSubRows(filteredRows),
        [attachSubRows, filteredRows],
    );

    const resetToFirstPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }));

    // With autoResetPageIndex disabled (below), deleting the last row(s) on the
    // current page would otherwise leave the user stranded on a now-empty page —
    // clamp back to the new last valid page instead.
    useEffect(() => {
        const lastPageIndex = Math.max(0, Math.ceil(filteredRows.length / pagination.pageSize) - 1);
        if (pagination.pageIndex > lastPageIndex) {
            setPagination((prev) => ({ ...prev, pageIndex: lastPageIndex }));
        }
    }, [filteredRows.length, pagination.pageIndex, pagination.pageSize]);

    const handleFilterChange = (key: string, value: ListFilterValue) => {
        setFilterState((prev) => ({ ...prev, [key]: value }));
        resetToFirstPage();
    };

    const handleGlobalFilterChange = (value: string) => {
        setGlobalFilter(value);
        resetToFirstPage();
    };

    const handleSortingChange: typeof setSorting = (updater) => {
        setSorting(updater);
        resetToFirstPage();
    };

    const table = useReactTable({
        data: tableRows,
        columns,
        defaultColumn: tableDefaultColumn,
        state: { sorting, globalFilter, rowSelection, pagination },
        // Sub-rows (depth > 0) are decorative children of their parent and never selectable.
        enableRowSelection: selectable
            ? hasSubRows
                ? (row: Row<EntityRow>) => row.depth === 0
                : true
            : false,
        enableSorting: true,
        enableGlobalFilter: true,
        onSortingChange: handleSortingChange,
        onGlobalFilterChange: handleGlobalFilterChange,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        // Tanstack's row-pagination feature resets to page 0 on its own whenever the
        // filtered/sorted row model recomputes — which fires on every `data` reference
        // change, including a same-content refetch after a row action (update, delete,
        // a schedule start/stop toggle, etc.) invalidates the entity query. Controlling
        // `pagination` state isn't enough to stop that internal auto-reset, so it's
        // disabled here and re-triggered explicitly only for the user-driven cases
        // (search, filters, sorting) where jumping back to page 1 is actually wanted.
        autoResetPageIndex: false,
        getRowId:
            selectable || hasSubRows
                ? (row, index, parent) => {
                      const explicit = (row as EntityRow).__rowId;
                      if (typeof explicit === 'string') return explicit;
                      const base = String(getValueByPath(row, rowKey) ?? index);
                      return parent ? `${parent.id}.${base}` : base;
                  }
                : undefined,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        ...(hasSubRows
            ? {
                  getSubRows: (row: EntityRow) => row.__subRows as EntityRow[] | undefined,
                  getExpandedRowModel: getExpandedRowModel(),
                  // Keep sub-rows attached to their parent's page instead of counting
                  // toward page size or splitting across page boundaries.
                  paginateExpandedRows: false,
                  autoResetExpanded: false,
              }
            : {}),
    });

    const selectedRows = selectable ? table.getSelectedRowModel().rows : [];
    const selectedIds = selectedRows
        .map((r) => String(getValueByPath(r.original, bulkField) ?? ''))
        .filter(Boolean);

    const handleBulkDelete = async () => {
        if (!bulkConfig || !entity.api || selectedIds.length === 0) return;

        const url = bulkConfig.url ?? `${entity.api.baseUrl}/list/delete`;
        const body = bulkConfig.buildPayload
            ? bulkConfig.buildPayload(selectedIds)
            : { identifiers: selectedIds };

        const confirmed = await confirm({
            title: tCommon('list.confirmDelete.title'),
            message: tCommon('list.confirmDelete.bulkMessage', {
                count: selectedIds.length,
                name: entity.name,
            }),
            onConfirm: async () => {
                setPendingDeleteIds(selectedIds);
                try {
                    await apiExecutor({
                        url,
                        method: bulkConfig.method ?? 'PUT',
                        body,
                    });
                    await bulkConfig.afterDelete?.(selectedIds);
                    setRowSelection({});
                } finally {
                    setPendingDeleteIds([]);
                }
            },
        });
        if (!confirmed) return;

        message.success(
            tCommon('list.deleteSelectedSuccess', { count: selectedIds.length }),
        );
    };

    const titleText = entity.list?.titleKey
        ? tEntities(entity.list.titleKey)
        : entity.plural ?? `${entity.name}s`;
    const subtitleComponents = entity.list?.subtitleComponents;
    const subtitleNode: React.ReactNode = entity.list?.subtitleKey
        ? subtitleComponents
            ? <Trans i18nKey={`entities:${entity.list.subtitleKey}`} components={subtitleComponents} />
            : tEntities(entity.list.subtitleKey)
        : tCommon('list.manage', { name: entity.name });

    const showBulkDeleteButton = !!bulkConfig && canForAction('DELETE');
    const isBulkDeleteDisabled = selectedIds.length === 0;
    const isBulkDeleting = pendingDeleteIds.length > 0;

    if (!hasReadAccess) {
        return <NoAccess />;
    }

    return (
        <div data-testid={buildTestId(entity.name, 'list')} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <header style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h1 style={{ margin: 0 }}>
                        <Typography variant="headline" as="span">{titleText}</Typography>
                    </h1>
                    <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
                        {bulkActions.map((action) => {
                            const field = action.field ?? rowKey;
                            const ids = selectedRows
                                .map((r) => String(getValueByPath(r.original, field) ?? ''))
                                .filter(Boolean);
                            const rows = selectedRows.map((r) => r.original);
                            return (
                                <BulkActionButton
                                    key={action.key}
                                    action={action}
                                    entity={entity}
                                    rows={rows}
                                    ids={ids}
                                    clearSelection={() => setRowSelection({})}
                                />
                            );
                        })}
                        {showBulkDeleteButton && (
                            <Button
                                type="primary"
                                loading={isBulkDeleting}
                                disabled={isBulkDeleteDisabled}
                                onClick={handleBulkDelete}
                                testId={buildTestId(entity.name, 'bulk-delete')}
                            >
                                {tCommon('list.deleteSelected', { count: selectedIds.length })}
                            </Button>
                        )}
                        {headerActions.map((action) => (
                            <React.Fragment key={action.key}>
                                {action.render({ entity })}
                            </React.Fragment>
                        ))}
                        {hasCreateRoute && (
                            <Button
                                type="primary"
                                testId={buildTestId(entity.name, 'create')}
                                onClick={() => {
                                    const id = dialog.open({
                                        width: 1000,
                                        top: 18,
                                        testId: buildTestId(entity.name, 'create-dialog'),
                                        content: (
                                            <EntityDialogContent
                                                entityName={entity.name}
                                                mode="create"
                                                onSuccess={() => dialog.closeById(id)}
                                            />
                                        ),
                                    });
                                }}
                            >
                                {tCommon('actions.create')}
                            </Button>
                        )}
                    </div>
                </div>
                <div style={{ color: 'var(--color-text-secondary)' }}>
                    <Typography variant="body">{subtitleNode}</Typography>
                </div>
            </header>

            {(searchable || hasFilters) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {searchable && (
                            <div style={{ flex: 1 }}>
                                <Input
                                    placeholder={
                                        entity.list?.searchPlaceholderKey
                                            ? tEntities(entity.list.searchPlaceholderKey)
                                            : tCommon('list.searchPlaceholder')
                                    }
                                    value={globalFilter}
                                    onChange={(e) => handleGlobalFilterChange(e.target.value)}
                                    leftSlot={<Icon name="search" size={16} isSubtle />}
                                    testId={buildTestId(entity.name, 'search')}
                                />
                            </div>
                        )}
                        {hasFilters && (
                            <Tooltip content={tCommon('list.filtersTooltip')}>
                                <IconButton
                                    type={areFiltersOpen ? 'primary' : 'default'}
                                    iconProps={{ name: 'filter', color: 'secondary' }}
                                    onClick={() => setAreFiltersOpen((v) => !v)}
                                    testId={buildTestId(entity.name, 'filters-toggle')}
                                />
                            </Tooltip>
                        )}
                    </div>
                    {hasFilters && areFiltersOpen && (
                        <ListFilters
                            filters={filters}
                            state={filterState}
                            onChange={handleFilterChange}
                        />
                    )}
                </div>
            )}

            <Table
                data={tableRows}
                columns={columns}
                tableInstance={table}
                isLoading={isLoading}
                emptyState={entity.list?.emptyKey ? tEntities(entity.list.emptyKey) : tCommon('list.empty')}
                disabledRowIds={pendingDeleteIds}
                rowClassName={rowClassName}
                onRowClick={handleRowClick}
            />
        </div>
    );
};
