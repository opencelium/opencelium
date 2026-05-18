import React from "react";
import type {PartialStepProps} from "@shared/ui/tour/Tour.tsx";
import type {StepRemoteProps} from "@shared/ui/form/FormControl/FormControl.type.ts";

export interface StepContext {
    currentStep: number
    next: () => void
    prev: () => void
    isLast: boolean
}

export interface StepForm {
    readOnly?: boolean
}

export interface StepDefinition {
    header: string
    subheader?: string
    render: (ctx?: StepContext) => React.ReactNode
    validate?: () => Promise<boolean>
    info?: PartialStepProps[],
    actions?: {
        nextLabel?: string
        submitLabel?: string
        prevLabel?: string
    }

    remote?: StepRemoteProps
}
export interface Recommendation {
    title: string
    link: string
}

export interface GenericStepFormProps {
    header: string
    subheader?: string
    steps: StepDefinition[]
    readOnly?: boolean
    onSubmit?: () => Promise<void> | void
    recommendations?: Recommendation[]
    image?: string | React.ReactNode | unknown
    successMessage?: string
    successContent?: React.ReactNode
    info?: PartialStepProps[],
    form: any,
    /**
     * When true, a successful submit toasts `successMessage` instead of swapping the
     * form for the SuccessState. Steps stay rendered so the user can keep editing.
     */
    skipSuccessState?: boolean
    /**
     * When true, hide the final-step submit button. Used by pages that apply form
     * changes live (no explicit submit).
     */
    hideSubmit?: boolean
}
