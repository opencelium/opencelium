import type { CheckboxComponent } from './Checkbox.types';
import { MaterialCheckbox } from './Checkbox.material';
import { AntCheckbox } from './Checkbox.ant';
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const CheckboxFactory: UIFactory<CheckboxComponent> = {
    default: AntCheckbox,
    material: MaterialCheckbox,
    ant: AntCheckbox,
};
