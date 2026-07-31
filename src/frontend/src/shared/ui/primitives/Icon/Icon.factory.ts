import type { IconComponent } from './Icon.types';

import { MaterialIcon } from './Icon.material';
import { AntIcon } from './Icon.ant';
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const IconFactory: UIFactory<IconComponent> = {
    default: AntIcon,
    material: MaterialIcon,
    ant: AntIcon,
};
