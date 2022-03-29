import {PermissionProps} from "@molecule/form_section/permissions/interfaces";

export interface IComponent{
    componentId: number,
    name: string,
    permissions?: PermissionProps,
}