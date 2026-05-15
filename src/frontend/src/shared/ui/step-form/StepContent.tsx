import { useStepForm } from "./context"
import type {StepDefinition} from "./types"
import { Button } from "@shared/ui/primitives/Button"
import HelpIcon from "@shared/ui/tour/HelpIcon.tsx";
import React, {useMemo, useRef} from "react";
import type {PartialStepProps} from "@shared/ui/tour/Tour.tsx";
import {CommonText, EntityText} from "@shared/ui/primitives/Text";
import {useBreakpoints} from "@app/hooks/useBreakpoints.tsx";

interface Props {
    steps: StepDefinition[]
    onSubmit?: () => void
    isSubmitting: boolean
    readOnly?: boolean
}

export function StepContent({
    steps,
    onSubmit,
    isSubmitting,
    readOnly,
}: Props) {
    const {isTabletOrMobile} = useBreakpoints();
    const containerRef = useRef(null);
    const { currentStep, next: nextStep, prev, isLast } =
        useStepForm()

    const step = steps[currentStep]

    const infoSteps: PartialStepProps[] = useMemo(() => {
        if (!step.info) return [];
        return step.info.map(s => ({
            ...s,
            content: <EntityText i18nKey={s.content} />,
            title: <EntityText i18nKey={s.title || step.header} />,
            target: '',
            placement: 'bottom',
            disableBeacon: true,
        }));
    }, [currentStep, steps])
    const next = async () => {
        const step = steps[currentStep]

        if (step.stepSchema && form) {
            const values = form.getValues()

            const result = step.stepSchema.safeParse(values)

            if (!result.success) {
                result.error.errors.forEach((err) => {
                    form.setError(
                        err.path.join('.') as any,
                        { message: err.message }
                    )
                })
                return
            }
        }
        nextStep();
    }
    return (
        <div style={{ flex: 1, paddingLeft: isTabletOrMobile ? 0 : 48 }} ref={containerRef}>
            {/*<h2 style={{marginBottom: 28, marginTop: 0}}>
                <span style={{position: 'relative'}}>
                    <EntityText i18nKey={step.header} variant={'title'} />
                    {step.info && <div style={{position: 'absolute', right: -20, top: -20}}>
                        <HelpIcon steps={infoSteps} inputRef={containerRef}/>
                    </div>}
                </span>
            </h2>
*/}
            <div style={{display: 'grid', gap: 15}}>
                {step.render({
                    currentStep,
                    next,
                    prev,
                    isLast,
                })}
            </div>
            <div
                style={{
                    marginTop: 48,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                }}
            >
                {currentStep > 0 && <Button
                    onClick={prev}
                    disabled={currentStep === 0}
                >
                    <CommonText i18nKey={step.actions?.prevLabel || 'actions.prev'} />
                </Button>
                }

                {isLast ? onSubmit && !readOnly ? (
                    <Button onClick={onSubmit} loading={isSubmitting}>
                        {!!step?.actions?.submitLabel ? <EntityText i18nKey={step.actions?.submitLabel} /> : <CommonText i18nKey={'actions.submit'} />}
                    </Button>
                ) : null : (
                    <Button onClick={next} loading={isSubmitting}>
                        {step.actions?.nextLabel ? <EntityText i18nKey={step.actions.nextLabel} /> : <CommonText i18nKey={'actions.next'} />}
                    </Button>
                )}
            </div>
        </div>
    )
}
