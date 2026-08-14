import React from 'react';

export type SliderProps = {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    /** Renders custom tooltip text over the handle instead of the raw number. */
    tooltipFormatter?: (value?: number) => string;
    disabled?: boolean;
    testId?: string;
    style?: React.CSSProperties;
    className?: string;
};

export type SliderComponent = React.FC<SliderProps>;
