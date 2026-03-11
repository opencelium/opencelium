import React from 'react';
import { TooltipRenderProps } from 'react-joyride';
import './style.css';
import Button from "@basic_components/buttons/Button";
import {Text} from "@app_component/base/text/Text";
import {HeaderTextSize} from "@entity/application/utils/constants";
import DefaultText from "@app_component/base/text/DefaultText";

function TourTooltip(props: TooltipRenderProps) {
    const { backProps, closeProps, continuous, index, primaryProps, skipProps, step, tooltipProps } =
        props;

    const width = (step.data as any)?.width || 360;
    return (
        <div className="tooltip__body"
             {...tooltipProps}
             style={{ maxWidth: width }}
        >
            <button className="tooltip__close" {...closeProps}>
                &times;
            </button>
            {step.title && <p className="tooltip__title">{step.title}</p>}
            <div className="tooltip__content"><DefaultText value={step.content}/></div>
            <div className="tooltip__footer">

                <div className="tooltip__spacer">
                    {index > 0 && (
                        <Button {...backProps} label={backProps.title}/>
                    )}
                    {continuous && (
                        <Button {...primaryProps} label={primaryProps.title === 'Last' ? 'Close' : 'Next'}/>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TourTooltip;
