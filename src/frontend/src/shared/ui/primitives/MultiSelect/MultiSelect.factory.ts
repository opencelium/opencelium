import type { MultiSelectComponent } from './MultiSelect.types';
import { MaterialMultiSelect } from './MultiSelect.material';
import { AntMultiSelectImpl } from './MultiSelect.ant';
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const MultiSelectFactory: UIFactory<MultiSelectComponent> = {
    default: AntMultiSelectImpl,
    material: MaterialMultiSelect,
    ant: AntMultiSelectImpl,
};
