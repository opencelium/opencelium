import type { SelectComponent } from './Select.types';
import { MaterialSelect } from './Select.material';
import { AntSelectImpl } from './Select.ant';
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const SelectFactory: UIFactory<SelectComponent> = {
    default: AntSelectImpl,
    material: MaterialSelect,
    ant: AntSelectImpl,
};
