import type {UserDetail} from "@entities/user/model/types.ts";
import type {Path} from "react-hook-form";

export type UserFormValues = {
    email: string
    password: string
    repeatPassword: string
    userDetail: UserDetail
    userGroup: number | undefined
}
export type UserFormFieldPath = Path<UserFormValues>;
