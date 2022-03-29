import {ITheme} from "../../../general/Theme";
import {ElementProps, InputElementProps} from "../../../atoms/input/interfaces";
import {OptionProps} from "@atom/input/select/interfaces";

export enum PERMISSION_TYPES {
    CREATE= 'CREATE',
    READ= 'READ',
    UPDATE= 'UPDATE',
    DELETE= 'DELETE',
}

interface PermissionsStyledProps extends ElementProps{
    hasLabel?: boolean,
}

export interface ComponentProps{
    componentId: number,
    name: string,
    permissions: PERMISSION_TYPES[],
}

export interface PermissionProps{
    [key: string]: PERMISSION_TYPES[],
}

interface PermissionsProps extends InputElementProps, PermissionsStyledProps{
    theme?: ITheme,
    id?: string,
    permissions: PermissionProps,
    components: OptionProps[],
    onChange: any,
}


export {
    PermissionsProps,
    PermissionsStyledProps,
}