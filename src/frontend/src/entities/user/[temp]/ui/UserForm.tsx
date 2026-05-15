import {FormProvider} from "react-hook-form";
import {FormConstraintsProvider} from "@shared/form/FormConstraintsContext.tsx";
import React from "react";
import {Button} from "@shared/ui/primitives/Button";
import UserDetailsStep from "@entities/user/ui/UserDetailsStep.tsx";
import UserCredentialsStep from "@entities/user/ui/UserCredentialsStep.tsx";
import UserGroupStep from "@entities/user/ui/UserGroupStep.tsx";
import {useUserForm} from "@entities/user/form/useUserForm.ts";
import type {UserFormValues} from "@entities/user/form/userForm.types.ts";

interface Props {
    readOnly?: boolean
    onSubmit?: (data: Partial<UserFormValues>) => void
}

export function UserForm({
    readOnly = false,
    onSubmit,
    }: Props) {
    const {form, constraints} = useUserForm();

    return (
        <FormProvider {...form}>
            <FormConstraintsProvider constraints={constraints}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                    }}
                >
                    <UserDetailsStep readOnly={readOnly}/>
                    <UserCredentialsStep readOnly={readOnly}/>
                    <UserGroupStep readOnly={readOnly}/>
                    {!readOnly && <Button htmlType={'submit'}>{"Submit"}</Button>}
                </form>
            </FormConstraintsProvider>
        </FormProvider>
    )
}
