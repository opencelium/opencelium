import type { SliderComponent } from './Slider.types';
import { AntSlider } from './ant/Slider.ant';
import { MaterialSlider } from './material/Slider.material';
import type { UIFactory } from '@shared/ui/primitives/types';

export const SliderFactory: UIFactory<SliderComponent> = {
    default: AntSlider,
    ant: AntSlider,
    material: MaterialSlider,
};
