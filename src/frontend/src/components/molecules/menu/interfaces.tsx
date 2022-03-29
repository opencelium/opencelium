import {ITheme} from "../../general/Theme";
import {PermissionProps} from "@constants/permissions";

interface MenuLinkProps{
    theme?: ITheme,
    permission?: PermissionProps,
    label?: string,
    hasConfirmation?: boolean,
    confirmationText?: string,
}



export {
    MenuLinkProps,
}