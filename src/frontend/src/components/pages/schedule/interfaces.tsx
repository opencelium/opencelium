import {ITheme} from "../../general/Theme";
import {PermissionProps} from "@constants/permissions";
import React from "react";

interface ScheduleListProps{
    theme?: ITheme,
    permission?: PermissionProps;
    hasTopBar?: boolean,
    isReadonly?: boolean,
    hasTitle?: boolean,
}

export {
    ScheduleListProps,
}