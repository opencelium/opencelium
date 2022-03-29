import {ITheme} from "../../general/Theme";
import {ISchedule} from "@interface/schedule/ISchedule";

interface LastFailExecutionStyledProps{
    isRefreshing?: boolean,
}

interface LastFailExecutionProps{
    theme?: ITheme,
    schedule: ISchedule,
    hasElasticSearch?: boolean,
}

export {
    LastFailExecutionProps,
    LastFailExecutionStyledProps,
}