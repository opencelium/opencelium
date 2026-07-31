import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";
import type {TableProps} from "@shared/ui/primitives/Table/Table.types.ts";

export function Table<TData>(props: TableProps<TData>) {
    const { Table } = useDynamicUI();
    return <Table {...props} />;
}
