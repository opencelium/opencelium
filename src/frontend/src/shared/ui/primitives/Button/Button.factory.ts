import { MaterialButton } from './material/Button.material';
import { AntButton } from './ant/Button.ant.tsx';
import type {ButtonComponent} from "@shared/ui/primitives/Button/Button.types.ts";
import {CustomButton} from "@shared/ui/primitives/Button/custom/Button.custom.tsx";
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const ButtonFactory: UIFactory<ButtonComponent> = {
    default: AntButton,
    material: MaterialButton,
    ant: AntButton,
    custom: CustomButton,
};
