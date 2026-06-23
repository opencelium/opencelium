import React, {useEffect, useMemo} from 'react'
import type { Mode } from '../EntityDefinition'
import {entityRegistry} from "@/engine/entity/EntityRegistry.ts";
import {buildZodSchema} from "@/engine/entity/builders/buildZodSchema.ts";
import {buildDefaultValues} from "@/engine/entity/builders/buildDefaultValues.ts";
import {FormProvider, useForm} from "react-hook-form";
import {buildConstraintsFromSchema} from "@shared/form/zodConstraints.ts";
import type {StepDefinition} from "@shared/ui/step-form/types.ts";
import {SectionRenderer} from "@/engine/entity/runtime/SectionRenderer.tsx";
import {StepFormLayout} from "@shared/ui/step-form/StepFormLayout.tsx";
import {FormConstraintsProvider} from "@shared/form/FormConstraintsContext.tsx";
import {createPolicyContext, policyEngine, setUserPolicyContext} from "@/engine/policy";
import {useAuth} from "@features/auth/useAuth.ts";
import {PolicyProvider} from "@/engine/policy/PolicyReactContext.tsx";
import {TestScopeProvider} from "@shared/testing/TestScopeContext.tsx";
import NoAccess from "@shared/ui/feedback/NoAccess.tsx";
import {entityResolver} from "@/engine/entity/entityResolver.ts";
import {apiExecutor} from "@shared/api/apiExecutor.ts";

export type SubmitMeta = {
    /** Name of the field that triggered the change (live-update mode only). */
    changedField?: string
}

type Props<EntityFormValues> = {
    entityName: string
    mode: Mode
    onSubmit?: (data: unknown, meta?: SubmitMeta) => void
    initialValues?: Partial<EntityFormValues>
    readOnly?: boolean
    header?: string
    subheader?: string
    /**
     * When true, a successful submit toasts the wizard's success message instead of
     * navigating to the SuccessState. The step list stays visible so the user can
     * keep editing without losing context — used by settings-style pages (e.g. UI).
     */
    skipSuccessState?: boolean
    /**
     * When true, hide the submit button and call `onSubmit` on every form value
     * change instead. The final step has no submit; changes apply on the fly.
     */
    liveUpdate?: boolean
}

export function EntityWizard<EntityFormValues>({
    entityName,
    mode,
    onSubmit,
    initialValues,
    readOnly,
    header,
    subheader,
    skipSuccessState,
    liveUpdate,
}: Props<EntityFormValues>) {

    const { user, normalizedUser } = useAuth()
    const entity = entityRegistry.get(entityName)

    if (!entity) {
        throw new Error(`Entity "${entityName}" not found in registry`)
    }

    const policyContext = useMemo(() =>
            createPolicyContext({
                user: setUserPolicyContext(user, normalizedUser),
                mode,
                entity: entity.name,
                record: initialValues
            }),
        [user, mode, entity.name, initialValues])
    const entityDecision = policyEngine.evaluate(
        entity.access,
        {
            ...policyContext,
            resource: `entity:${entity.name}`
        }
    )
    const schema = useMemo(
        () => buildZodSchema(entity, policyContext),
        [entity, policyContext]
    )

    const defaultValues = useMemo(
        () => buildDefaultValues(entity),
        [entity]
    )
    const form = useForm({
        resolver: entityResolver(schema, entity, apiExecutor, initialValues, mode),
        defaultValues,
        shouldFocusError: true,
    })

    useEffect(() => {
        if (initialValues) {
            form.reset(initialValues)
        }
    }, [initialValues])
    useEffect(() => {
        if (!liveUpdate || !onSubmit) return
        const sub = form.watch((values, {type, name}) => {
            if (type !== 'change') return
            onSubmit(values, {changedField: name})
        })
        return () => sub.unsubscribe()
    }, [form, liveUpdate, onSubmit])

    const WizardImageComponent = entity.wizard?.renderImage
    const wizardImage = WizardImageComponent ? <WizardImageComponent mode={mode} /> : entity.wizard?.image

    const constraints = buildConstraintsFromSchema(schema, entity)

    const wizardReadOnly =
        readOnly ||
        mode === 'view' ||
        (!entityDecision.allowed &&
            entityDecision.strategy === 'disable')
    const steps: StepDefinition[] =
        entity.wizard?.steps
            .filter(step => {
                const hasAccessibleSection = step.sectionIds.some(sectionId => {
                    const section = entity.sections.find(s => s.id === sectionId)

                    if (!section) return false

                    const decision = policyEngine.evaluate(
                        section.access,
                        {
                            ...policyContext,
                            resource: `section:${section.id}`
                        }
                    )

                    return decision.allowed || decision.strategy !== 'hide';
                })

                return hasAccessibleSection
            })
            .map(step => ({
                header: step.header,
                subheader: step.subheader,
                info: step.info,
                remote: step.remote,
                actions: step.actions,
                render: () => (
                    <>
                        {entity.sections
                            ?.filter(s => step.sectionIds.includes(s.id))
                            .map(section => (
                                <SectionRenderer
                                    key={section.id}
                                    section={section}
                                    entity={entity}
                                    mode={mode}
                                    forcedReadonly={wizardReadOnly}
                                />
                            ))}
                    </>
                ),
                validate: async () => {
                    if (!step.validateFields) {
                        return await form.trigger(undefined, { shouldFocus: true });
                    }

                    // Trigger validation for all fields in the current step.
                    // shouldFocus moves focus to the first invalid field on Next,
                    // instead of a render-driven effect that re-focuses on every keystroke.
                    const result = await form.trigger(step.validateFields as any, { shouldFocus: true });

                    // If step-level field validation passes, double-check if any
                    // cross-validation issues exist for these specific fields.
                    if (result) {
                        const currentErrors = form.formState.errors;
                        // If there's an error on any field we just validated, return false
                        const hasErrorInStep = step.validateFields.some(fieldPath => {
                            // Logic to check nested errors (e.g., userDetail.name)
                            const parts = fieldPath.split('.');
                            let error = currentErrors;
                            for (const part of parts) {
                                error = (error as any)?.[part];
                            }
                            return !!error;
                        });

                        return !hasErrorInStep;
                    }

                    return result;
                }
            }))
        ?? []
    const modeConfig =
        entity.wizard.modes?.[mode]
    if (!entityDecision.allowed) {

        switch (entityDecision.strategy) {

            case 'hide':
                return null

            case 'forbid':
                return <NoAccess message={`Access denied to form "${entityName}"`} />

            case 'disable':
                // allow rendering, but make it readOnly
                break
        }
    }
    if (steps.length === 0) {
        return <NoAccess/>;
    }
    return (
        <PolicyProvider value={policyContext}>
            <TestScopeProvider scope={entity.name}>
            <FormProvider key={entity.name} {...form}>
                <FormConstraintsProvider constraints={constraints}>
                    <form
                        onSubmit={
                            onSubmit
                                ? form.handleSubmit(onSubmit)
                                : () => {}
                        }
                    >
                        <StepFormLayout
                            info={modeConfig?.info}
                            header={header ?? modeConfig?.header  ?? entity.name}
                            subheader={
                                subheader ??
                                modeConfig?.subheader ??
                                'Follow the steps'
                            }
                            steps={steps}
                            readOnly={readOnly || wizardReadOnly}

                            onSubmit={(e) =>
                                form.handleSubmit((data) => onSubmit?.(data))(e)
                            }
                            successMessage={
                                entity.wizard.modes?.[mode]?.getSuccessMessage?.(form.getValues())
                                ?? entity.wizard.modes?.[mode]?.successMessage
                                ?? 'success'
                            }
                            recommendations={entity.wizard?.recommendations}
                            image={wizardImage}
                            form={form}
                            skipSuccessState={skipSuccessState}
                            hideSubmit={liveUpdate}
                        />
                    </form>
                </FormConstraintsProvider>
            </FormProvider>
            </TestScopeProvider>
        </PolicyProvider>
    )
}
