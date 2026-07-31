
import type { TableComponent } from './Table.types';
import { MaterialTable } from './Table.material';
import { AntTable } from './Table.ant';
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const TableFactory: UIFactory<TableComponent<unknown>> = {
    default: AntTable,
    material: MaterialTable,
    ant: AntTable,
};
