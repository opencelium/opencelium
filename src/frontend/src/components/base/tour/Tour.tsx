import React, {FC, useEffect, useState} from "react";
import Joyride, {ACTIONS, CallBackProps, EVENTS, STATUS, Step} from "react-joyride";
import DefaultText from "@app_component/base/text/DefaultText";

interface TourProps{
    steps: Step[],
    toggle: any,
    show: boolean,
}

const Tour:FC<TourProps> =  ({
    steps,
    toggle,
    show,
}) => {
    const [stepIndex, setStepIndex] = useState<number>(0);
    steps = steps.map((step, index) => {
        return {
            ...step,
            title: <DefaultText value={step.title}/>,
        }
    });
    useEffect(() => {
        if (!show) return;
        let overlay: any = undefined;
        const onOverlayClick = () => {
            toggle(false);
            setStepIndex(0);
        };
        setTimeout(() => {

            overlay = document.querySelector(
                ".react-joyride__overlay"
            ) as HTMLElement | null;

            if (!overlay) return;


            overlay.addEventListener("click", onOverlayClick);

        }, 500)
        return () => {
            if (overlay) {
                overlay?.removeEventListener("click", onOverlayClick);
            }
        };
    }, [show]);
    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, action, index, type } = data;

        // ✅ Overlay click (and close button)
        if (action === ACTIONS.CLOSE) {
            toggle(false);
            setStepIndex(0);
            return;
        }

        if (action === ACTIONS.NEXT && type === EVENTS.STEP_AFTER) {
            setStepIndex(index + 1);
        }

        if (action === ACTIONS.PREV && type === EVENTS.STEP_AFTER) {
            setStepIndex(index - 1);
        }

        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            toggle(false);
            setStepIndex(0);
        }
    };
    return (
        <Joyride
            key={show ? 'joyride-on' : 'joyride-off'}
            stepIndex={stepIndex}
            callback={handleJoyrideCallback}
            continuous
            hideCloseButton
            disableOverlayClose={false}
            run={show}
            scrollToFirstStep
            showProgress
            steps={steps}
            styles={{
                beacon: {
                    zIndex: 20000,
                },
                options: {
                    zIndex: 20000,
                }
            }}
        />
    );
}

export default Tour;
