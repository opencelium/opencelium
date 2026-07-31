import React from 'react';
import { TooltipRenderProps } from 'react-joyride';
import './style.css';
import {Button} from "@shared/ui/primitives/Button";

function TourTooltip(props: TooltipRenderProps) {
    const { backProps, closeProps, continuous, index, primaryProps, step, tooltipProps } =
        props;

    return (
        <div className="tooltip__body" {...tooltipProps}>
            <button className="tooltip__close" {...closeProps}>
                &times;
            </button>
            {step.title && <h4 className="tooltip__title">{step.title}</h4>}
            <div className="tooltip__content">{step.content}</div>
            <div className="tooltip__footer">

                <div className="tooltip__spacer">
                    {index > 0 && (
                        <Button onClick={backProps.onClick} disabled={backProps.disabled}>{backProps.title}</Button>
                    )}
                    {continuous && (
                        <Button onClick={primaryProps.onClick} disabled={primaryProps.disabled}>{primaryProps.title === 'Last' ? 'Close' : 'Next'}</Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TourTooltip;
