import type { SliderProps } from './Slider.types';
import { useDynamicUI } from '@app/providers/ui/DynamicFacade';

export function Slider(props: SliderProps) {
    const { Slider: Impl } = useDynamicUI();
    return <Impl {...props} />;
}
