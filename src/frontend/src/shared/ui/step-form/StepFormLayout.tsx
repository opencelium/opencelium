import {useEffect, useMemo, useRef, useState} from "react"
import { StepContent } from "./StepContent"
import { StepFormContext } from "./context"
import type {
    GenericStepFormProps,
    StepActionDefinition,
    StepContext, StepDefinition,
} from "./types"
import type {StepRemoteProps} from "@shared/ui/form/FormControl/FormControl.type.ts";
import {StepHeader} from "@shared/ui/step-form/StepHeader.tsx";
import {SuccessState} from "@shared/ui/step-form/SuccessState.tsx";
import {Steps} from "@shared/ui/primitives/Steps";
import {EntityText} from "@shared/ui/primitives/Text";
import {useBreakpoints} from "@app/hooks/useBreakpoints.tsx";
import {executeStepRemote} from "@/engine/entity/stepResolver.ts";
import {apiExecutor} from "@shared/api/apiExecutor.ts";
import {message} from "antd";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {useConfirm} from "@shared/ui/confirm/ConfirmDialogContext.tsx";

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
    hideHeader,
}: GenericStepFormProps) {
    const {isTabletOrMobile} = useBreakpoints();
    const {t: tEntities} = useI18n('entities')
    const confirm = useConfirm()
    const ref = useRef(null);
    const [currentStep, setCurrentStep] = useState(0)

    const [isSuccess, setIsSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [runningActionId, setRunningActionId] = useState<string | null>(null)
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
                        const confirmOnFailure = step.confirmOnRemoteFailure
                        // Without an explicit confirm-on-failure config, a failed remote
                        // blocks the submit (the historical behavior for every other step).
                        if (!confirmOnFailure) {
                            return;
                        }
                        const proceed = await confirm({
                            title: tEntities(confirmOnFailure.title as any),
                            message: tEntities(confirmOnFailure.message as any),
                        })
                        if (!proceed) return
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
    const runRemoteConfig = async (remote: StepRemoteProps) => {
        if (remote.shouldSkip?.(form.getValues())) {
            return {success: true, skipped: true}
        }
        return await executeStepRemote({
            remote,
            values: form.getValues(),
            apiExecutor: apiExecutor,
        })
    }
    const validateRemote = async (step: StepDefinition) => {
        if (!step.remote) return undefined
        setIsSubmitting(true)
        const result = await runRemoteConfig(step.remote)
        setIsSubmitting(false)
        return result
    }
    const runAction = async (action: StepActionDefinition) => {
        const step = steps[currentStep]
        // Validate the step's fields (e.g. required inputs) before firing the request —
        // a request against incomplete data is rarely meaningful. Opt out per-action.
        if (action.validateBeforeRun !== false && step.validate) {
            const isValid = await step.validate()
            if (!isValid) return
        }
        setRunningActionId(action.id)
        try {
            const result = await runRemoteConfig(action.remote)
            // A skipped remote (shouldSkip) and a failure (already surfaced by the remote's
            // handleResponse) both stay silent here; only a genuine pass earns the toast.
            if (result?.success && !(result as { skipped?: boolean }).skipped && action.successMessage) {
                message.success(tEntities(action.successMessage as any))
            }
        } finally {
            setRunningActionId(null)
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
    // Ctrl/Cmd+Enter advances the wizard: Next on intermediate steps, Submit on the last one.
    // Scoped to this container (not window) so it only fires while the form has focus.
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!(event.ctrlKey || event.metaKey) || event.key !== 'Enter') return
        if (isSuccess || isSubmitting || runningActionId != null) return
        event.preventDefault()
        if (isLast) {
            if (!readOnly && !hideSubmit) void handleSubmit()
        } else {
            void next()
        }
    }
    return (
        <StepFormContext.Provider value={ctx}>
            <div
                style={{
                    padding: 18,
                    borderRadius: 12,
                }}
                ref={ref}
                onKeyDown={handleKeyDown}
            >
                {!hideHeader && (
                    <StepHeader
                        containerRef={ref}
                        info={info}
                        header={header}
                        subheader={subheader}
                        image={image}
                    />
                )}

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
                                onRunAction={runAction}
                                isSubmitting={isSubmitting}
                                runningActionId={runningActionId}
                            />
                        )}
                    </div>
                </div>
            </div>
        </StepFormContext.Provider>
    )
}
