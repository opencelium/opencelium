import {useEffect, useMemo, useRef, useState} from "react"
import { StepContent } from "./StepContent"
import { StepFormContext } from "./context"
import type {
    GenericStepFormProps,
    StepContext, StepDefinition,
} from "./types"
import {StepHeader} from "@shared/ui/step-form/StepHeader.tsx";
import {SuccessState} from "@shared/ui/step-form/SuccessState.tsx";
import {Steps} from "@shared/ui/primitives/Steps";
import {EntityText} from "@shared/ui/primitives/Text";
import {useBreakpoints} from "@app/hooks/useBreakpoints.tsx";
import {executeStepRemote} from "@/engine/entity/stepResolver.ts";
import {apiExecutor} from "@shared/api/apiExecutor.ts";
import {message} from "antd";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";

export function StepFormLayout({
    header,
    subheader,
    steps,
    onSubmit,
    recommendations,
    image,
    readOnly,
    successMessage,
    successContent,
    info,
    form,
    skipSuccessState,
    hideSubmit,
}: GenericStepFormProps) {
    const {isTabletOrMobile} = useBreakpoints();
    const {t: tEntities} = useI18n('entities')
    const ref = useRef(null);
    const [currentStep, setCurrentStep] = useState(0)

    const [isSuccess, setIsSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const items = useMemo(() => {
        return steps.map((s, key) => ({
            ...s,
            header: <EntityText i18nKey={s.header}/>,
            subheader: s.subheader ? <EntityText typoProps={{isSubtle: currentStep !== key}} i18nKey={s.subheader}/> : '',
            status: readOnly ? 'process' : isSuccess ? 'finish' : s.status,
            onClick: currentStep === key ? undefined : async () => {
                if ((!readOnly || steps[currentStep].remote) && currentStep < key) {
                    const step = steps[currentStep]
                    if (step.validate) {
                        const isValid = await step.validate()
                        if (isValid) {
                            setCurrentStep(key)
                        }
                    }
                } else {
                    setCurrentStep(key)
                }
            },
        }));
    }, [steps, isSuccess, currentStep]);
    const isLast = currentStep === steps.length - 1
    const handleSubmit = async () => {
        try {
            const step = steps[currentStep]
            if (step.validate) {
                const isValid = await step.validate()
                if (isValid) {
                    const remoteResult = await validateRemote(step);
                    if (typeof remoteResult !== 'undefined' && !remoteResult.success) {
                        return;
                    }
                    setIsSubmitting(true)
                    await onSubmit?.()
                    if (skipSuccessState) {
                        message.success(
                            successMessage
                                ? tEntities(successMessage as any)
                                : 'Success'
                        )
                    } else {
                        setIsSuccess(true)
                    }
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsSubmitting(false)
        }
    }
    const next = async () => {
        const step = steps[currentStep]

        if ((!readOnly || step.remote) && step.validate) {
            const isValid = await step.validate()

            if (!isValid) return
        }
        await validateRemote(step);
        if (!isLast) {
            setCurrentStep((s) => s + 1)
        }
    }
    const validateRemote = async (step: StepDefinition) => {
        if (step.remote) {
            if (step.remote.shouldSkip?.()) {
                return {success: true}
            }
            setIsSubmitting(true)
            const result = await executeStepRemote({
                remote: step.remote,
                values: form.getValues(),
                apiExecutor: apiExecutor,
            })
            setIsSubmitting(false)
            return result;
        }
    }
    const ctx: StepContext = {
        currentStep,
        next,
        prev: () =>
            currentStep > 0 &&
            setCurrentStep((s) => s - 1),
        isLast,
    }
    return (
        <StepFormContext.Provider value={ctx}>
            <div
                style={{
                    padding: 18,
                    borderRadius: 12,
                }}
                ref={ref}
            >
                <StepHeader
                    containerRef={ref}
                    info={info}
                    header={header}
                    subheader={subheader}
                    image={image}
                />

                <div
                    style={{
                        display: isTabletOrMobile ? "grid" : "flex",
                    }}
                >
                    {!isSuccess && <div style={{flex: 1, marginBottom: isTabletOrMobile ? 30 : 0}}>
                        <div
                            style={{
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            <Steps
                                items={items}
                                status="process"
                                current={currentStep}
                            />
                        </div>
                    </div>}
                    <div style={{flex: 3}}>

                        {isSuccess ? (
                            <SuccessState
                                message={successMessage}
                                content={successContent}
                                recommendations={recommendations}
                            />
                        ) : (
                            <StepContent
                                readOnly={readOnly}
                                steps={steps}
                                onSubmit={hideSubmit ? undefined : handleSubmit}
                                isSubmitting={isSubmitting}
                            />
                        )}
                    </div>
                </div>
            </div>
        </StepFormContext.Provider>
    )
}
