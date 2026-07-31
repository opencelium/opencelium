import type {UserFormValues} from "@entities/user/form/userForm.types.ts";

export const EMPTY_USER_FORM: UserFormValues = {
    email: 'new@user.com',
    password: '1234qwerQ!',
    repeatPassword: '1234qwerQ!',
    userDetail: {
        name: 'new',
        surname: 'surname',
        department: '',
        organization: '',
        phoneNumber: '',
    },
    userGroup: 1,
};
