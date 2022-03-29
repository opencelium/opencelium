import {ITheme} from "../../general/Theme";
import {ISchedule} from "@interface/schedule/ISchedule";

interface LastDurationExecutionStyledProps{
    isRefreshing?: boolean,
}

interface LastDurationExecutionProps{
    theme?: ITheme,
    schedule: ISchedule,
    hasElasticSearch?: boolean,
}

export {
    LastDurationExecutionProps,
    LastDurationExecutionStyledProps,
}