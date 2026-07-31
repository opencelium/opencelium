import React from 'react';
import { useFormDialog } from '@/shared/ui/form-dialog/useFormDialog';
import {UserEditorDialogContent} from "@features/user/user-update/UserEditorDialogContent.tsx";
import {userFormSchema} from "@entities/user/form/schemas/userForm.schema.ts";
import type {UserFormValues} from "@entities/user/form/userForm.types.ts";

export function useUserEditorDialog(user) {
    return useFormDialog<UserFormValues>({
        title: 'Edit profile',
        schema: userFormSchema,
        initialValues: {
            email: user.email,
            firstname: user.firstname,
        },
        confirmOptions: {
            title: 'Are you sure?',
            message: 'Message',
        },
        fullscreen: true,
        onSubmit: async (values) => {
            console.log('Edit Profile', values)
        },
        render: () => ( <UserEditorDialogContent /> ),
    });
}
