import { Slider as MuiSlider } from '@mui/material';
import type { SliderComponent } from '../Slider.types';

export const MaterialSlider: SliderComponent = ({
    value,
    min,
    max,
    step,
    onChange,
    tooltipFormatter,
    disabled,
    testId,
    style,
    className,
}) => {
    return (
        <MuiSlider
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(_, next) => onChange(Array.isArray(next) ? next[0] : next)}
            disabled={disabled}
            valueLabelDisplay="auto"
            valueLabelFormat={tooltipFormatter}
            style={style}
            className={className}
            data-testid={testId}
        />
    );
};
