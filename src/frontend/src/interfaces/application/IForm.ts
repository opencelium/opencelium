import {PermissionProps} from "@constants/permissions";
import {ITheme} from "../../components/general/Theme";

export interface FormDataButtonProps{
    label?: string,
    icon?: string,
}

export interface FormDataProps{
    formTitle: string,
    actionButton?: FormDataButtonProps,
    listButton?: FormDataButtonProps,
}

export interface IForm{
    isUpdate?: boolean,
    isAdd?: boolean,
    isView?: boolean,
    theme?: ITheme,
    permission?: PermissionProps,

    getFormData?: (entityName: string) => FormDataProps,
}