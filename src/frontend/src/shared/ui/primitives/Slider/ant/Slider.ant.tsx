import { Slider as AntSliderBase } from 'antd';
import type { SliderComponent } from '../Slider.types';

export const AntSlider: SliderComponent = ({
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
        <AntSliderBase
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={onChange}
            disabled={disabled}
            tooltip={tooltipFormatter ? { formatter: tooltipFormatter } : undefined}
            style={style}
            className={className}
            data-testid={testId}
        />
    );
};
