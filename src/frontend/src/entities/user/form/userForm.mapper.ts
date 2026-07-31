import type {User} from "@entities/user/model/types.ts";
import type {UserFormValues} from "@entities/user/form/userForm.types.ts";

export function mapUserToForm(user: User): UserFormValues {
    return {
        email: user.email,
        userDetail: user.userDetail,
        userGroup: user.userGroup?.groupId,
    };
}
