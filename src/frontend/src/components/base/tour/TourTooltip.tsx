import React, {useEffect, useRef} from 'react';
import { TooltipRenderProps } from 'react-joyride';
import './style.css';
import Button from "@basic_components/buttons/Button";
import {Text} from "@app_component/base/text/Text";
import {HeaderTextSize} from "@entity/application/utils/constants";
import DefaultText from "@app_component/base/text/DefaultText";

function TourTooltip(props: TooltipRenderProps) {
    const { backProps, continuous, index, primaryProps, step, tooltipProps } = props;

    const tooltipRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const tooltip = tooltipRef.current;

                if (!tooltip) return;

                const footer = tooltip.querySelector('.tooltip__footer') as HTMLElement | null;

                if (!footer) return;

                const footerButtons = Array.from(
                    footer.querySelectorAll('button:not([disabled])')
                ) as HTMLButtonElement[];

                if (!footerButtons.length) return;

                const focusAction = (step.data as any)?.focusAction;

                let buttonToFocus: HTMLButtonElement | null = null;

                if (focusAction === 'prev' && footerButtons.length > 1) {
                    buttonToFocus = footerButtons[0];
                } else {
                    buttonToFocus = footerButtons[footerButtons.length - 1];
                }

                buttonToFocus?.focus();
            });
        });
    }, [index, step, continuous]);

    const width = (step.data as any)?.width || 360;
    const onCustomClose = (step.data as any)?.onCustomClose as (() => void) | undefined;
    const isLastStepButton = primaryProps?.title === 'Last';

    return (
        <div
            className="tooltip__body"
            {...tooltipProps}
            ref={tooltipRef}
            style={{ maxWidth: width }}
        >
            <button
                type="button"
                className="tooltip__close"
                aria-label="Close"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCustomClose?.();
                }}
            >
                &times;
            </button>

            {step.title && <p className="tooltip__title">{step.title}</p>}

            <div className="tooltip__content">
                <DefaultText value={step.content} />
            </div>

            <div className="tooltip__footer">
                <div className="tooltip__spacer">
                    {index > 0 && (
                        <Button {...backProps} label={backProps.title} />
                    )}

                    {continuous && !isLastStepButton && (
                        <Button
                            {...primaryProps}
                            label="Next"
                        />
                    )}

                    {continuous && isLastStepButton && (
                        <Button
                            label="Close"
                            onClick={() => {
                                onCustomClose?.();
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default TourTooltip;
