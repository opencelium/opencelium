import { useStepForm } from "./context"
import type {StepActionDefinition, StepDefinition} from "./types"
import { Button } from "@shared/ui/primitives/Button"
import { Tooltip } from "@shared/ui/primitives/Tooltip"
import {useRef} from "react";
import {useBreakpoints} from "@app/hooks/useBreakpoints.tsx";
import {useTestScope} from "@shared/testing/TestScopeContext.tsx";
import {buildTestId} from "@shared/testing/testId.ts";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {IS_MAC} from "@shared/utils/platform.ts";

interface Props {
    steps: StepDefinition[]
    onSubmit?: () => void
    onRunAction?: (action: StepActionDefinition) => void
    isSubmitting: boolean
    runningActionId?: string | null
    readOnly?: boolean
    form: any
}

export function StepContent({
    steps,
    onSubmit,
    onRunAction,
    isSubmitting,
    runningActionId,
    readOnly,
    form,
}: Props) {
    const {isTabletOrMobile} = useBreakpoints();
    const {t: tCommon} = useI18n('common')
    const {t: tEntities} = useI18n('entities')
    const containerRef = useRef(null);
    const testScope = useTestScope();
    const { currentStep, next: nextStep, prev, isLast } =
        useStepForm()

    const step = steps[currentStep]
    // Subscribes to every field so action-button `disabled` predicates (and anything
    // else derived from form values) re-evaluate on any change, including programmatic
    // setValue calls made outside this component (e.g. after unlocking the master password).
    const values = form?.watch ? form.watch() : undefined

    const next = async () => {
        const step = steps[currentStep]

        if (step.stepSchema && form) {
            const values = form.getValues()

            const result = step.stepSchema.safeParse(values)

            if (!result.success) {
                result.error.issues.forEach((err) => {
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
            <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 15}}>
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
                    testId={buildTestId(testScope, 'wizard', 'prev')}
                >
                    {tCommon((step.actions?.prevLabel || 'actions.prev') as any)}
                </Button>
                }

                {!readOnly && onRunAction && step.actionButtons?.map((action) => (
                    <Button
                        key={action.id}
                        type={action.type ?? 'primary'}
                        onClick={() => onRunAction(action)}
                        loading={runningActionId === action.id}
                        disabled={
                            isSubmitting ||
                            (runningActionId != null && runningActionId !== action.id) ||
                            !!action.disabled?.(values)
                        }
                        testId={buildTestId(testScope, 'wizard', `action-${action.id}`)}
                    >
                        {tEntities(action.label as any)}
                    </Button>
                ))}

                {isLast ? onSubmit && !readOnly ? (
                    <Tooltip content={tCommon(IS_MAC ? 'actions.cmdEnterHint' : 'actions.ctrlEnterHint')}>
                        <Button type="primary" onClick={onSubmit} loading={isSubmitting} disabled={runningActionId != null} testId={buildTestId(testScope, 'wizard', 'submit')}>
                            {step?.actions?.submitLabel ? tEntities(step.actions.submitLabel as any) : tCommon('actions.submit')}
                        </Button>
                    </Tooltip>
                ) : null : (
                    <Tooltip content={tCommon(IS_MAC ? 'actions.cmdEnterHint' : 'actions.ctrlEnterHint')}>
                        <Button onClick={next} loading={isSubmitting} testId={buildTestId(testScope, 'wizard', 'next')}>
                            {step.actions?.nextLabel ? tEntities(step.actions.nextLabel as any) : tCommon('actions.next')}
                        </Button>
                    </Tooltip>
                )}
            </div>
        </div>
    )
}
