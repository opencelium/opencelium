import { FormProvider } from 'react-hook-form'
import { StepFormLayout } from '@/shared/ui/step-form/StepFormLayout'
import {FormConstraintsProvider} from "@shared/form/FormConstraintsContext.tsx";
import type {StepDefinition} from "@shared/ui/step-form/types.ts";
import UserDetailsStep from "@entities/user/ui/UserDetailsStep.tsx";
import UserCredentialsStep from "@entities/user/ui/UserCredentialsStep.tsx";
import UserGroupStep from "@entities/user/ui/UserGroupStep.tsx";
import userWizardImage from '@/assets/images/wizard/user-wizard.gif'
import React, {useEffect} from "react";
import type {UserFormValues} from "@entities/user/form/userForm.types.ts";
import {useUserForm} from "@entities/user/form/useUserForm.ts";
interface Props {
    readOnly?: boolean
    onSubmit?: (data: Partial<UserFormValues>) => void
    header: string
    subheader?: string
    successMessage?: string
    initialValues?: Partial<UserFormValues>
}
export function UserWizard({
    readOnly,
    onSubmit,
    header,
    subheader,
    successMessage,
    initialValues,
    }: Props) {

    const { form, constraints } =
        useUserForm()

    const steps: StepDefinition[] = [
        {
            header: 'User Details',
            subheader: 'Personal information about user',
            render: () => <UserDetailsStep readOnly={readOnly} />,
            validate: async () => {
                return await form.trigger("userDetail")
            },
        },
        {
            header: 'Credentials',
            subheader: 'Authentication data',
            render: () => <UserCredentialsStep readOnly={readOnly} /> ,
            validate: async () => {
                return await form.trigger([
                    "email",
                    "password",
                    "repeatPassword",
                ])
            },
        },
        {
            header: 'Role',
            subheader: 'Define user role',
            render: () => <UserGroupStep readOnly={readOnly} /> ,
            validate: async () => {
                return await form.trigger([
                    "userGroup",
                ])
            },
        },
    ]

    useEffect(() => {
        if (initialValues) {
            form.reset(initialValues)
        }
    }, [initialValues, form])
    return (
        <FormProvider {...form}>
            <FormConstraintsProvider constraints={constraints}>
                <form onSubmit={onSubmit ? form.handleSubmit(onSubmit,
                    (errors) => {
                        console.log('❌ submit blocked, errors:', errors);
                    }) : () => {}}>
                    <StepFormLayout
                        header={header}
                        subheader={subheader || "Follow the simple 3 steps to complete user creation."}
                        steps={steps}
                        readOnly={readOnly}
                        onSubmit={onSubmit ? form.handleSubmit(onSubmit) : undefined}
                        successMessage={successMessage}
                        recommendations={[
                            {
                                title: 'Create Connector',
                                link: "/connector/create"
                            },
                            {
                                title: 'Create Role',
                                link: "/role/create"
                            }
                        ]}
                        image={userWizardImage}
                    />
                </form>
            </FormConstraintsProvider>
        </FormProvider>
    )
}
