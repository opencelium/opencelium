import type { SplitterComponent } from './Splitter.types';
import { AntSplitter } from './ant/Splitter.ant';
import { MaterialSplitter } from './material/Splitter.material';
import type { UIFactory } from '@shared/ui/primitives/types';

export const SplitterFactory: UIFactory<SplitterComponent> = {
    default: AntSplitter,
    ant: AntSplitter,
    material: MaterialSplitter,
};
