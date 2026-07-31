import type { TooltipComponent } from './Tooltip.types';

import { MaterialTooltip } from './Tooltip.material';
import {AntTooltip} from "@shared/ui/primitives/Tooltip/Ant.tooltip.tsx";
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const TooltipFactory: UIFactory<TooltipComponent> = {
    default: AntTooltip,
    material: MaterialTooltip,
    ant: AntTooltip,
};
