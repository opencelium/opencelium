import {ITheme} from "../../general/Theme";
import {PermissionProps} from "@constants/permissions";

interface ConnectorListProps{
    theme?: ITheme,
    permission?: PermissionProps;
}

interface ConnectorOverviewProps{
    theme?: ITheme,
}

export {
    ConnectorListProps,
    ConnectorOverviewProps,
}