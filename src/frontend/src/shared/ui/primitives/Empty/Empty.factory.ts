import type { EmptyComponent } from './Empty.types';
import { AntEmpty } from './ant/Empty.ant';
import { MaterialEmpty } from './material/Empty.material';
import type { UIFactory } from '@shared/ui/primitives/types';

export const EmptyFactory: UIFactory<EmptyComponent> = {
    default: AntEmpty,
    ant: AntEmpty,
    material: MaterialEmpty,
};
