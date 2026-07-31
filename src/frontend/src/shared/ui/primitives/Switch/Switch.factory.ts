import type { SwitchComponent } from './Switch.types';
import { MaterialSwitch } from './Switch.material';
import { AntSwitchImpl } from './Switch.ant';
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const SwitchFactory: UIFactory<SwitchComponent> = {
    default: AntSwitchImpl,
    material: MaterialSwitch,
    ant: AntSwitchImpl,
};
