import React, {FC, useEffect, useMemo, useRef, useState} from "react";
import Joyride, {ACTIONS, CallBackProps, EVENTS, STATUS, Step} from "react-joyride";
import DefaultText from "@app_component/base/text/DefaultText";
import BeaconComponent from "@app_component/base/tour/BeaconComponent";
import TourTooltip from "@app_component/base/tour/TourTooltip";
import {HeaderTextSize} from "@entity/application/utils/constants";
import {Text} from "@app_component/base/text/Text";
import CSvg from "@entity/connection/components/classes/components/content/connection_overview_2/CSvg";

interface TourProps{
    steps: Step[],
    toggle: any,
    show: boolean,
}

const SPOTLIGHT_SELECTOR = ".react-joyride__spotlight";
const OVERLAY_SELECTOR = ".react-joyride__overlay";
const TOOLTIP_SELECTOR = ".tooltip__body";
const DEFAULT_SPOTLIGHT_PADDING = 10;

const SAFE_AREA_PADDING = {
    left: 160,
    right: 160,
    top: 120,
    bottom: 120,
};

const TECHNICAL_LAYOUT_ID = "technical_layout";
const TECHNICAL_LAYOUT_SVG_ID = "technical_layout_svg";
const MODAL_TECHNICAL_LAYOUT_ID = "modal_technical_layout";
const MODAL_TECHNICAL_LAYOUT_SVG_ID = "modal_technical_layout_svg";

type PreparedStep = Step & {
    spotlightPadding?: number;
    data?: Record<string, any>;
};

type TargetResult = {
    target: HTMLElement | null;
    step: PreparedStep | null;
};

type TechnicalLayoutContext = {
    layout: HTMLElement | null;
    svg: SVGSVGElement | null;
    layoutId: string;
    svgId: string;
};

const Tour:FC<TourProps> =  ({
    steps,
    toggle,
    show,
}) => {
    const [stepIndex, setStepIndex] = useState<number>(0);
    const [run, setRun] = useState<boolean>(false);
    const [instanceKey, setInstanceKey] = useState<number>(0);

    const rafRef = useRef<number | null>(null);
    const isTransitioningRef = useRef<boolean>(false);
    const lastNavigationActionRef = useRef<'start' | 'next' | 'prev'>('start');
    const closeTourRef = useRef<() => void>(() => {});

    const waitFrame = (): Promise<void> => {
        return new Promise((resolve) => {
            requestAnimationFrame(() => resolve());
        });
    };

    const waitFrames = async (count = 1): Promise<void> => {
        for (let i = 0; i < count; i++) {
            await waitFrame();
        }
    };

    const hideTourUi = () => {
        const spotlight = document.querySelector(SPOTLIGHT_SELECTOR) as HTMLElement | null;
        const tooltip = document.querySelector(TOOLTIP_SELECTOR) as HTMLElement | null;
        const overlay = document.querySelector(OVERLAY_SELECTOR) as HTMLElement | null;

        if (spotlight) {
            spotlight.style.opacity = "0";
            spotlight.style.pointerEvents = "none";
            spotlight.style.transition = "none";
        }

        if (tooltip) {
            tooltip.style.opacity = "0";
            tooltip.style.pointerEvents = "none";
            tooltip.style.transition = "none";
        }

        if (overlay) {
            overlay.style.opacity = "0";
            overlay.style.pointerEvents = "none";
            overlay.style.transition = "none";
        }
    };

    const setTourVisibility = (isVisible: boolean) => {
        const spotlight = document.querySelector(SPOTLIGHT_SELECTOR) as HTMLElement | null;
        const tooltip = document.querySelector(TOOLTIP_SELECTOR) as HTMLElement | null;
        const overlay = document.querySelector(OVERLAY_SELECTOR) as HTMLElement | null;

        if (spotlight) {
            spotlight.style.opacity = isVisible ? "1" : "0";
            spotlight.style.transition = "none";
            spotlight.style.pointerEvents = isVisible ? "auto" : "none";
        }

        if (tooltip) {
            tooltip.style.opacity = isVisible ? "1" : "0";
            tooltip.style.transition = "none";
            tooltip.style.pointerEvents = isVisible ? "auto" : "none";
        }

        if (overlay) {
            overlay.style.opacity = isVisible ? "1" : "0";
            overlay.style.transition = "none";
            overlay.style.pointerEvents = isVisible ? "auto" : "none";
        }
    };

    const closeTour = () => {
        hideTourUi();
        isTransitioningRef.current = false;
        lastNavigationActionRef.current = "start";
        setRun(false);
        setStepIndex(0);
        setInstanceKey((prev) => prev + 1);
        toggle(false);
    };

    closeTourRef.current = closeTour;

    const preparedSteps = useMemo<PreparedStep[]>(() => {
        return steps
            .filter((step) => {
                if (typeof step.target === "string") {
                    return !!document.querySelector(step.target);
                }

                if (step.target instanceof HTMLElement) {
                    return document.body.contains(step.target);
                }

                return false;
            })
            .map((step) => ({
                ...step,
                data: {
                    ...(step.data || {}),
                    focusAction: lastNavigationActionRef.current,
                    onCustomClose: () => closeTourRef.current(),
                },
                title: <Text value={step.title} size={`${HeaderTextSize}px`} isBold />,
            }));
    }, [steps, stepIndex, instanceKey]);

    const getTargetElement = (indexOverride?: number): TargetResult => {
        const index = typeof indexOverride === "number" ? indexOverride : stepIndex;
        const step = preparedSteps[index] as PreparedStep;

        if (!step?.target) {
            return { target: null, step: null };
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

    const getTechnicalLayoutContext = (target: HTMLElement | null): TechnicalLayoutContext => {
        const regularLayout = document.getElementById(TECHNICAL_LAYOUT_ID) as HTMLElement | null;
        const modalLayout = document.getElementById(MODAL_TECHNICAL_LAYOUT_ID) as HTMLElement | null;

        const regularSvgElement = document.getElementById(TECHNICAL_LAYOUT_SVG_ID);
        const modalSvgElement = document.getElementById(MODAL_TECHNICAL_LAYOUT_SVG_ID);

        const regularSvg =
            regularSvgElement instanceof SVGSVGElement ? regularSvgElement : null;

        const modalSvg =
            modalSvgElement instanceof SVGSVGElement ? modalSvgElement : null;

        if (target && modalLayout && modalSvg && modalLayout.contains(target)) {
            return {
                layout: modalLayout,
                svg: modalSvg,
                layoutId: MODAL_TECHNICAL_LAYOUT_ID,
                svgId: MODAL_TECHNICAL_LAYOUT_SVG_ID,
            };
        }

        if (target && regularLayout && regularSvg && regularLayout.contains(target)) {
            return {
                layout: regularLayout,
                svg: regularSvg,
                layoutId: TECHNICAL_LAYOUT_ID,
                svgId: TECHNICAL_LAYOUT_SVG_ID,
            };
        }

        return {
            layout: null,
            svg: null,
            layoutId: "",
            svgId: "",
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

    const scheduleSync = (hideFirst = false, indexOverride?: number, retries = 10) => {
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

    const forceFloaterRecalc = async () => {
        window.dispatchEvent(new Event("resize"));
        await waitFrames(1);
        window.dispatchEvent(new Event("resize"));
        await waitFrames(1);
    };

    const ensureTargetInSafeArea = async (indexOverride?: number): Promise<boolean> => {
        const { target, step } = getTargetElement(indexOverride);

        if (!target || !step) {
            return false;
        }

        const { layout, svg, svgId } = getTechnicalLayoutContext(target);

        if (!layout || !svg || !svgId) {
            return false;
        }

        const targetSelector = typeof step.target === "string" ? step.target : "";
        const isFromConnectorStep = targetSelector.includes("#fromConnector_panel");
        const isToConnectorStep = targetSelector.includes("#toConnector_panel");
        const isConnectorPanelStep = isFromConnectorStep || isToConnectorStep;

        const readRects = () => {
            const currentTarget = getTargetElement(indexOverride).target ?? target;
            const currentViewBox = svg.viewBox?.baseVal;

            return {
                targetRect: currentTarget.getBoundingClientRect(),
                layoutRect: layout.getBoundingClientRect(),
                svgRect: svg.getBoundingClientRect(),
                viewBox: currentViewBox,
            };
        };

        const applyViewBoxShiftByPixels = (deltaPixelsX: number, deltaPixelsY: number) => {
            const { svgRect, viewBox } = readRects();

            if (!viewBox || !svgRect.width || !svgRect.height) {
                return false;
            }

            const scaleX = viewBox.width / svgRect.width;
            const scaleY = viewBox.height / svgRect.height;

            const nextViewBoxX = viewBox.x + (deltaPixelsX * scaleX);
            const nextViewBoxY = viewBox.y + (deltaPixelsY * scaleY);

            CSvg.setViewBox(svgId, {
                x: nextViewBoxX,
                y: nextViewBoxY,
            });

            return true;
        };

        const getInitialDeltas = () => {
            const { targetRect, layoutRect } = readRects();

            const safeLeft = layoutRect.left + SAFE_AREA_PADDING.left;
            const safeRight = layoutRect.right - SAFE_AREA_PADDING.right;
            const safeTop = layoutRect.top + SAFE_AREA_PADDING.top;
            const safeBottom = layoutRect.bottom - SAFE_AREA_PADDING.bottom;

            let deltaPixelsX = 0;
            let deltaPixelsY = 0;

            if (isConnectorPanelStep) {
                const desiredLeft = layoutRect.left + (layoutRect.width * 0.25);
                deltaPixelsX = targetRect.left - desiredLeft;
            } else {
                if (targetRect.left < safeLeft) {
                    deltaPixelsX = targetRect.left - safeLeft;
                } else if (targetRect.right > safeRight) {
                    deltaPixelsX = targetRect.right - safeRight;
                }
            }

            if (targetRect.top < safeTop) {
                deltaPixelsY = targetRect.top - safeTop;
            } else if (targetRect.bottom > safeBottom) {
                deltaPixelsY = targetRect.bottom - safeBottom;
            }

            return { deltaPixelsX, deltaPixelsY };
        };

        const getCorrectiveDeltas = () => {
            const { targetRect, layoutRect } = readRects();

            const finalVisibleLeftReserve = layoutRect.left + 24;
            const finalVisibleRightReserve = layoutRect.right - 24;
            const finalVisibleTopReserve = layoutRect.top + 16;
            const finalVisibleBottomReserve = layoutRect.bottom - 16;

            let correctiveDeltaX = 0;
            let correctiveDeltaY = 0;

            if (isConnectorPanelStep) {
                const correctedDesiredLeft = layoutRect.left + (layoutRect.width * 0.25);
                correctiveDeltaX = targetRect.left - correctedDesiredLeft;
            } else {
                if (targetRect.left < finalVisibleLeftReserve) {
                    correctiveDeltaX = targetRect.left - finalVisibleLeftReserve;
                } else if (targetRect.right > finalVisibleRightReserve) {
                    correctiveDeltaX = targetRect.right - finalVisibleRightReserve;
                }
            }

            if (targetRect.top < finalVisibleTopReserve) {
                correctiveDeltaY = targetRect.top - finalVisibleTopReserve;
            } else if (targetRect.bottom > finalVisibleBottomReserve) {
                correctiveDeltaY = targetRect.bottom - finalVisibleBottomReserve;
            }

            return { correctiveDeltaX, correctiveDeltaY };
        };

        let hasMoved = false;

        const { deltaPixelsX, deltaPixelsY } = getInitialDeltas();

        if (Math.abs(deltaPixelsX) > 0.5 || Math.abs(deltaPixelsY) > 0.5) {
            hasMoved = applyViewBoxShiftByPixels(deltaPixelsX, deltaPixelsY) || hasMoved;
            await waitFrames(2);
        }

        const { correctiveDeltaX, correctiveDeltaY } = getCorrectiveDeltas();

        if (Math.abs(correctiveDeltaX) > 0.5 || Math.abs(correctiveDeltaY) > 0.5) {
            hasMoved = applyViewBoxShiftByPixels(correctiveDeltaX, correctiveDeltaY) || hasMoved;
            await waitFrames(2);
        }

        return hasMoved;
    };

    const goToStep = async (nextIndex: number, hideFirst = true) => {
        if (isTransitioningRef.current) {
            return;
        }

        isTransitioningRef.current = true;

        try {
            setTourVisibility(false);

            await ensureTargetInSafeArea(nextIndex);
            await waitFrames(2);

            setStepIndex(nextIndex);
            await waitFrames(2);

            await forceFloaterRecalc();
            scheduleSync(hideFirst, nextIndex);
            await waitFrames(1);

            await forceFloaterRecalc();
            scheduleSync(false, nextIndex);
            await waitFrames(1);

            setTourVisibility(true);
            scheduleSync(false, nextIndex);
        } finally {
            isTransitioningRef.current = false;
        }
    };

    const resetTour = () => {
        setRun(false);
        setStepIndex(0);
        isTransitioningRef.current = false;
        lastNavigationActionRef.current = 'start';
        hideTourUi();
    };

    useEffect(() => {
        if (!show) {
            resetTour();
            return;
        }

        resetTour();
        setInstanceKey((prev) => prev + 1);

        let isMounted = true;

        const startTour = async () => {
            await waitFrames(2);

            if (!isMounted) return;

            setRun(true);
            await waitFrames(2);

            if (!isMounted) return;

            await goToStep(0, true);
        };

        startTour();

        return () => {
            isMounted = false;
        };
    }, [show]);

    useEffect(() => {
        if (!run) {
            hideTourUi();
            return;
        }

        const onResizeOrScroll = async () => {
            if (isTransitioningRef.current) return;

            setTourVisibility(false);

            await ensureTargetInSafeArea(stepIndex);
            await waitFrames(2);

            await forceFloaterRecalc();
            scheduleSync(true, stepIndex);
            await waitFrames(1);

            setTourVisibility(true);
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
            closeTour();
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

    const handleJoyrideCallback = async (data: CallBackProps) => {
        const { status, index, type } = data;

        if ((data.action as string) === ACTIONS.CLOSE) {
            closeTour();
            return;
        }

        if (isTransitioningRef.current) {
            return;
        }

        if (type === EVENTS.TARGET_NOT_FOUND) {
            closeTour();
            return;
        }

        if (data.action === ACTIONS.NEXT && type === EVENTS.STEP_AFTER) {
            const nextIndex = index + 1;

            if (nextIndex >= preparedSteps.length) {
                closeTour();
                return;
            }

            lastNavigationActionRef.current = "next";
            await goToStep(nextIndex, true);
            return;
        }

        if (data.action === ACTIONS.PREV && type === EVENTS.STEP_AFTER) {
            const prevIndex = index - 1;

            if (prevIndex < 0) {
                return;
            }

            lastNavigationActionRef.current = "prev";
            await goToStep(prevIndex, true);
            return;
        }

        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            closeTour();
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