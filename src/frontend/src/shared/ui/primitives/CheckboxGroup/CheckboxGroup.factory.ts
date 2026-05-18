import { BaseCheckboxGroup } from './CheckboxGroup.base';
import type {UIFactory} from "@shared/ui/primitives/types.ts";
import type {CheckboxGroupComponent} from "@shared/ui/primitives/CheckboxGroup/CheckboxGroup.types.ts";

export const CheckboxGroupFactory: UIFactory<CheckboxGroupComponent> = {
    default: BaseCheckboxGroup,
    material: BaseCheckboxGroup,
    ant: BaseCheckboxGroup,
};
