import type { InputComponent } from './Input.types';
import { MaterialInput } from './Input.material';
import { AntInput } from './Input.ant';
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const InputFactory: UIFactory<InputComponent> = {
    default: AntInput,
    material: MaterialInput,
    ant: AntInput,
};
