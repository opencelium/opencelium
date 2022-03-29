import {ITheme} from "../../general/Theme";
import {PermissionProps} from "@constants/permissions";
export type ConnectionViewType = 'COLUMN' | 'DIAGRAM';

export enum ConnectionViewProps{
    Column= 'COLUMN',
    Diagram= 'DIAGRAM',
}
interface ConnectionListProps{
    theme?: ITheme,
    permission?: PermissionProps;
}

interface TemplateListProps{
    theme?: ITheme,
    permission?: PermissionProps;
}

export {
    ConnectionListProps,
    TemplateListProps,
}