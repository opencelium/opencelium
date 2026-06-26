import React from "react";
import type {PartialStepProps} from "@shared/ui/tour/Tour.tsx";
import type {StepRemoteProps} from "@shared/ui/form/FormControl/FormControl.type.ts";
import type {ButtonProps} from "@shared/ui/primitives/Button/Button.types.ts";

export interface StepContext {
    currentStep: number
    next: () => void
    prev: () => void
    isLast: boolean
}

export interface StepForm {
    readOnly?: boolean
}

/**
 * An entity-defined button rendered in the wizard step footer that fires its own remote
 * request — the connector "test connection" check is the canonical case, but any entity can
 * add a button for any request (resend, validate, dry-run, …). The request reuses the same
 * `remote` machinery as step validation, so a failure surfaces through `remote.handleResponse`
 * (e.g. an error toast) exactly like the submit-time gate; a pass optionally toasts
 * `successMessage`. Every string field except `id` is an `entities`-namespace i18n key.
 */
export interface StepActionDefinition {
    /** Stable identifier; also the `…-wizard-action-<id>` test id suffix. */
    id: string
    label: string
    remote: StepRemoteProps
    /** Button style; defaults to 'primary'. */
    type?: ButtonProps['type']
    successMessage?: string
    /** Validate the step's fields before firing the request. Defaults to true. */
    validateBeforeRun?: boolean
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
    /** Extra request-driven buttons shown in the step footer. */
    actionButtons?: StepActionDefinition[]
    /**
     * When the step's `remote` validation fails at submit time, ask the user to proceed
     * anyway (translated confirm) instead of blocking. Without it, a failed remote blocks.
     */
    confirmOnRemoteFailure?: {
        title: string
        message: string
    }
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
