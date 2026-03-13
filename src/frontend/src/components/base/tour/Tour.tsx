import React, {FC, useEffect, useMemo, useRef, useState} from "react";
import Joyride, {ACTIONS, CallBackProps, EVENTS, STATUS, Step} from "react-joyride";
import DefaultText from "@app_component/base/text/DefaultText";
import BeaconComponent from "@app_component/base/tour/BeaconComponent";
import TourTooltip from "@app_component/base/tour/TourTooltip";
import {HeaderTextSize} from "@entity/application/utils/constants";
import {Text} from "@app_component/base/text/Text";

interface TourProps{
    steps: Step[],
    toggle: any,
    show: boolean,
}

const SPOTLIGHT_SELECTOR = ".react-joyride__spotlight";
const OVERLAY_SELECTOR = ".react-joyride__overlay";
const DEFAULT_SPOTLIGHT_PADDING = 10;

const Tour:FC<TourProps> =  ({
    steps,
    toggle,
    show,
}) => {
    const [stepIndex, setStepIndex] = useState<number>(0);
    const [run, setRun] = useState<boolean>(false);
    const [instanceKey, setInstanceKey] = useState<number>(0);

    const rafRef = useRef<number | null>(null);
    const lastNavigationActionRef = useRef<'start' | 'next' | 'prev'>('start');

    const preparedSteps = useMemo(() => {
        return steps
            .filter(step =>
                {
                    if (typeof step.target === "string") {
                        return !!document.querySelector(step.target);
                    }

                    if (step.target instanceof HTMLElement) {
                        return document.body.contains(step.target);
                    }

                    return false;
                }
            )
            .map((step) => ({
            ...step,
            data: {
                ...(step.data || {}),
                focusAction: lastNavigationActionRef.current,
            },
            title: <Text value={step.title} size={`${HeaderTextSize}px`} isBold/>,
        }))
    }, [steps]);

    const getTargetElement = (indexOverride?: number): {target: HTMLElement | null, step: (Step & { spotlightPadding?: number }) | null} => {
        const index = typeof indexOverride === "number" ? indexOverride : stepIndex;
        const step = preparedSteps[index] as Step & { spotlightPadding?: number };

        if (!step?.target) {
            return {target: null, step: null};
        }

        if (typeof step.target === "string") {
            return {
                target: document.querySelector(step.target) as HTMLElement | null,
                step,
            };
        }

        return {
            target: step.target as HTMLElement,
            step,
        };
    };

    const syncSpotlight = (hideFirst = false, indexOverride?: number): boolean => {
        const spotlight = document.querySelector(SPOTLIGHT_SELECTOR) as HTMLElement | null;
        const {target, step} = getTargetElement(indexOverride);

        if (!spotlight || !target || !step) return false;

        const rect = target.getBoundingClientRect();
        const padding =
            typeof step.spotlightPadding === "number"
                ? step.spotlightPadding
                : DEFAULT_SPOTLIGHT_PADDING;

        if (hideFirst) {
            spotlight.style.opacity = "0";
            spotlight.style.transition = "none";
        }

        spotlight.style.top = `${rect.top - padding}px`;
        spotlight.style.left = `${rect.left - padding}px`;
        spotlight.style.width = `${rect.width + padding * 2}px`;
        spotlight.style.height = `${rect.height + padding * 2}px`;
        spotlight.style.opacity = "1";
        spotlight.style.transition = "opacity 0.08s linear";

        return true;
    };

    const scheduleSync = (hideFirst = false, indexOverride?: number, retries = 6) => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }

        const trySync = (attempt: number) => {
            rafRef.current = requestAnimationFrame(() => {
                const synced = syncSpotlight(hideFirst && attempt === 0, indexOverride);

                if (!synced && attempt < retries) {
                    trySync(attempt + 1);
                }
            });
        };

        trySync(0);
    };

    const resetTour = () => {
        setRun(false);
        setStepIndex(0);
        lastNavigationActionRef.current = 'start';
    };

    useEffect(() => {
        if (!show) {
            resetTour();
            return;
        }

        resetTour();
        setInstanceKey((prev) => prev + 1);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setRun(true);

                setTimeout(() => scheduleSync(true, 0), 0);
                setTimeout(() => scheduleSync(false, 0), 60);
            });
        });
    }, [show]);

    useEffect(() => {
        if (!run) return;

        const onResizeOrScroll = () => {
            scheduleSync(false, stepIndex);
        };

        window.addEventListener("resize", onResizeOrScroll);
        window.addEventListener("scroll", onResizeOrScroll, true);

        return () => {
            window.removeEventListener("resize", onResizeOrScroll);
            window.removeEventListener("scroll", onResizeOrScroll, true);

            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [run, stepIndex, instanceKey]);

    useEffect(() => {
        if (!run) return;

        let overlay: HTMLElement | null = null;

        const onOverlayClick = () => {
            toggle(false);
            setStepIndex(0);
            setRun(false);
        };

        const timer = setTimeout(() => {
            overlay = document.querySelector(OVERLAY_SELECTOR) as HTMLElement | null;

            if (!overlay) return;

            overlay.addEventListener("click", onOverlayClick);
        }, 500);

        return () => {
            clearTimeout(timer);

            if (overlay) {
                overlay.removeEventListener("click", onOverlayClick);
            }
        };
    }, [run, toggle]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, action, index, type } = data;

        // ✅ Overlay click (and close button)
        if (action === ACTIONS.CLOSE) {
            toggle(false);
            setStepIndex(0);
            setRun(false);
            return;
        }

        if (type === EVENTS.TARGET_NOT_FOUND) {
            toggle(false);
            setStepIndex(0);
            setRun(false);
            return;
        }

        if (action === ACTIONS.NEXT && type === EVENTS.STEP_AFTER) {
            const nextIndex = index + 1;
            lastNavigationActionRef.current = 'next';
            setStepIndex(nextIndex);
            setTimeout(() => scheduleSync(true, nextIndex), 0);
            return;
        }

        if (action === ACTIONS.PREV && type === EVENTS.STEP_AFTER) {
            const prevIndex = index - 1;
            lastNavigationActionRef.current = 'prev';
            setStepIndex(prevIndex);
            setTimeout(() => scheduleSync(true, prevIndex), 0);
            return;
        }

        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            toggle(false);
            setStepIndex(0);
            setRun(false);
        }
    };

    const styles = preparedSteps.length > 0 ? (preparedSteps[0] as any)?.data?.styles : {};

    return (
        <Joyride
            key={`joyride-${instanceKey}-${show ? "on" : "off"}`}
            stepIndex={stepIndex}
            callback={handleJoyrideCallback}
            continuous
            tooltipComponent={TourTooltip}
            hideCloseButton
            disableOverlayClose={false}
            run={run}
            disableScrolling
            scrollToFirstStep={false}
            showProgress
            steps={preparedSteps}
            floaterProps={{
                disableAnimation: true,
            }}
            styles={{
                beacon: {
                    zIndex: 20000,
                },
                options: {
                    zIndex: 120000,
                },
                spotlight: {
                    transition: 'none',
                },
                ...styles,
            }}
        />
    );
}

export default Tour;
