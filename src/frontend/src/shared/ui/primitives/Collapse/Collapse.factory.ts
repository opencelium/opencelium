import type { CollapseComponent } from './Collapse.types';
import { AntCollapse } from './ant/Collapse.ant';
import { MaterialCollapse } from './material/Collapse.material';
import type { UIFactory } from '@shared/ui/primitives/types.ts';

export const CollapseFactory: UIFactory<CollapseComponent> = {
    default: AntCollapse,
    ant: AntCollapse,
    material: MaterialCollapse,
};
