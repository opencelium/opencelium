import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {buildStringConstraints} from "@shared/form/zodConstraints.ts";
import type {UserFormFieldPath, UserFormValues} from "@entities/user/form/userForm.types.ts";
import {EMPTY_USER_FORM} from "@entities/user/form/userForm.defaults.ts";
import {userFormSchema} from "@entities/user/form/schemas/userForm.schema.ts";
import type {StringConstraints} from "@shared/form/types.ts";

export function useUserForm() {
    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: EMPTY_USER_FORM as Partial<UserFormValues>,
    });

    const constraints: Partial<Record<UserFormFieldPath, StringConstraints>> = {
        email: buildStringConstraints<UserFormFieldPath>(userFormSchema, 'email'),
        password: buildStringConstraints<UserFormFieldPath>(userFormSchema, 'password'),
        repeatPassword: buildStringConstraints<UserFormFieldPath>(userFormSchema, 'repeatPassword'),
        'userDetail.name': buildStringConstraints<UserFormFieldPath>(userFormSchema, 'userDetail.name'),
        'userDetail.surname': buildStringConstraints<UserFormFieldPath>(userFormSchema, 'userDetail.surname'),
        'userDetail.department': buildStringConstraints<UserFormFieldPath>(userFormSchema, 'userDetail.department'),
        'userDetail.organization': buildStringConstraints<UserFormFieldPath>(userFormSchema, 'userDetail.organization'),
        'userDetail.phoneNumber': buildStringConstraints<UserFormFieldPath>(userFormSchema, 'userDetail.phoneNumber'),
        userGroup: buildStringConstraints<UserFormFieldPath>(userFormSchema , 'userGroup'),
    };

    return {
        form,
        constraints,
    };
}
