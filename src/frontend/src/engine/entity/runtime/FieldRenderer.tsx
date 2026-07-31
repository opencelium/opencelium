import React from 'react'
import { overrideRegistry } from '../overrides/overrideRegistry'
import type { FieldDefinition, Mode } from '../EntityDefinition'

import { FormInput } from '@/shared/ui/form/FormInput'
import { FormSelect } from '@/shared/ui/form/FormSelect'
import { FormCheckbox } from '@/shared/ui/form/FormCheckbox'
import { FormFileDropZone } from "@shared/ui/form/FormFileDropZone"
import {policyEngine} from "@/engine/policy";
import {usePolicyContext} from "@/engine/policy/PolicyReactContext.tsx";
import {FormTextarea} from "@shared/ui/form/FormTextarea";
import {FormSwitch} from "@shared/ui/form/FormSwitch";
import {useTestScope} from "@shared/testing/TestScopeContext.tsx";
import {buildTestId} from "@shared/testing/testId.ts";



type Props = {
    field: FieldDefinition
    mode: Mode
    forcedReadOnly?: boolean
}

export function FieldRenderer({
    field,
    mode,
    forcedReadOnly,
}: Props) {


    const policyContext = usePolicyContext()
    const testScope = useTestScope()
    // Entity-scoped, auto-derived selector. Override per-field via ui.props.testId.
    const fieldTestId =
        (field.ui.props?.testId as string | undefined) ??
        buildTestId(testScope, 'field', field.name)
    /* ===============================
       2️⃣ EVALUATE POLICY
    ============================== */

    const decision = policyEngine.evaluate(
        field.access,
        {
            ...policyContext,
            resource: field.name
        }
    )

    /* ===============================
       3️⃣ HANDLE STRATEGY
    ============================== */

    if (!decision.allowed) {

        switch (decision.strategy) {

            case 'hide':
                return null

            case 'disable':
                break

            case 'forbid':
                return <span>{`Access denied to field "${field.name}"`}</span>
            default:
                return null
        }
    }

    /* ===============================
       4️⃣ DETERMINE READONLY
    ============================== */

    const readOnly =
        !field.interactive &&
        (forcedReadOnly ||
            mode === 'view' ||
            (!decision.allowed && decision.strategy === 'disable'))

    /* ===============================
       5️⃣ OVERRIDE SUPPORT
    ============================== */

    const FieldOverride =
        overrideRegistry.getField(field.ui.overrideKey)

    const defaultRender = () => {

        switch (field.ui.component) {

            case 'switch':
                return (
                    <FormSwitch
                        name={field.name}
                        label={field.label}
                        readOnly={readOnly}
                        {...field.ui.props}
                        testId={fieldTestId}
                    />
                )


            case 'textarea':
                return (
                    <FormTextarea
                        name={field.name}
                        label={field.label}
                        readOnly={readOnly}
                        {...field.ui.props}
                        testId={fieldTestId}
                    />
                )

            case 'password':
                return (
                    <FormInput
                        name={field.name}
                        label={field.label}
                        type="password"
                        readOnly={readOnly}
                        {...field.ui.props}
                        testId={fieldTestId}
                    />
                )

            case 'select':
                return (
                    <FormSelect
                        name={field.name}
                        label={field.label}
                        readOnly={readOnly}
                        options={field.ui.props?.options ?? []}
                        {...field.ui.props}
                        testId={fieldTestId}
                    />
                )

            case 'checkbox':
                return (
                    <FormCheckbox
                        name={field.name}
                        label={field.label}
                        disabled={readOnly}
                        {...field.ui.props}
                        testId={fieldTestId}
                    />
                )

            case 'date':
                return (
                    <FormInput
                        name={field.name}
                        label={field.label}
                        type="date"
                        readOnly={readOnly}
                        {...field.ui.props}
                        testId={fieldTestId}
                    />
                )

            case 'file-dropzone':
                return (
                    <FormFileDropZone
                        name={field.name}
                        label={field.label}
                        disabled={readOnly}
                        {...field.ui.props}
                        testId={fieldTestId}
                    />
                )

            default:
                return (
                    <FormInput
                        name={field.name}
                        label={field.label}
                        readOnly={readOnly}
                        {...field.ui.props}
                        testId={fieldTestId}
                    />
                )
        }
    }

    if (FieldOverride) {
        return (
            <FieldOverride
                field={field}
                mode={mode}
                defaultRender={defaultRender}
            />
        )
    }

    return defaultRender()
}
