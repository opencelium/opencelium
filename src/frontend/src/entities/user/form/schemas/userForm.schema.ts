import {userCredentialsSchema} from "./userForm.userCrendentials.schema.ts";
import {userDetailSchema} from "./userForm.userDetail.schema.ts";
import {userGroupSchema} from "./userForm.userGroup.schema.ts";
export const userFormSchema =
    userCredentialsSchema
        .extend(
            {
                userDetail: userDetailSchema,
                userGroup: userGroupSchema,
            }
        );
