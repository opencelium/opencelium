import React, {useMemo} from "react"
import HelpIcon from "@shared/ui/tour/HelpIcon.tsx";
import type {PartialStepProps} from "@shared/ui/tour/Tour.tsx";
import {EntityText} from "@shared/ui/primitives/Text";
import {useBreakpoints} from "@app/hooks/useBreakpoints.tsx";

interface Props {
    header: string
    subheader?: string
    image?: string | React.ReactNode | unknown
    info?: PartialStepProps[],
    containerRef: any,
}

export function StepHeader({
    header,
    subheader,
    image,
    info,
    containerRef,
    }: Props) {
    const {isTabletOrMobile, isMobile} = useBreakpoints();
    const infoSteps: PartialStepProps[] = useMemo(() => {
        if (!info) return [];
        return info.map(step => ({
            ...step,
            content: <EntityText i18nKey={step.content}/>,
            title: step.title || header,
            target: '',
            placement: 'bottom',
            disableBeacon: true,
        }));
    }, [info])
    const ImageComponent = <div
        style={{
            width: isMobile ? '100%' : 260,
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: isMobile ? 'center' : "right",
        }}
    >
        {typeof image === "string" ? (
            // Square frame keeps the radius a true circle regardless of the
            // gif's aspect ratio; the image sits slightly inset so it isn't cropped.
            <div
                style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'white',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <img
                    src={image}
                    alt="wizard"
                    style={{
                        width: "85%",
                        height: "85%",
                        objectFit: "contain",
                    }}
                />
            </div>
        ) : (
            image
        )}
    </div>;
    return (
        <div
            style={{
                display: isMobile ? "grid" : "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: isTabletOrMobile ? 30 : 20,
            }}
        >
            {image && isMobile && ImageComponent}
            <div style={{flex: 1}}>
                <h1 style={{marginBottom: 8}}>
                    <span style={{position: 'relative', textAlign: isMobile ? 'center' : 'left'}}>
                        <EntityText i18nKey={header} typoProps={{variant: 'headline'}}/>
                        {info && <div style={{position: 'absolute', right: -20, top: -20}}>
                            <HelpIcon steps={infoSteps} inputRef={containerRef}/>
                        </div>}</span>
                </h1>
                {subheader && (
                    <div style={{color: "var(--color-text-secondary)"}}>
                        <EntityText i18nKey={subheader}/>
                    </div>
                )}
            </div>

            {image && !isMobile && ImageComponent}
        </div>
    )
}
