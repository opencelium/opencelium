import {ITheme} from "../../general/Theme";
import {ISchedule} from "@interface/schedule/ISchedule";

interface ExecutionStatusStyledProps{
    isRefreshing?: boolean,
}

interface ExecutionStatusProps{
    theme?: ITheme,
    schedule: ISchedule,
    hasActions?: boolean,
    onClick: any,
}

export {
    ExecutionStatusProps,
    ExecutionStatusStyledProps,
}