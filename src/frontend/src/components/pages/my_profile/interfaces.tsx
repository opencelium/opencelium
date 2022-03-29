import {ITheme} from "../../general/Theme";
import {PermissionProps} from "@constants/permissions";

interface MyProfileListProps{
    theme?: ITheme,
    permission?: PermissionProps;
}

export {
    MyProfileListProps,
}