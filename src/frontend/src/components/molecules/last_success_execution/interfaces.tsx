import {ITheme} from "../../general/Theme";
import {ISchedule} from "@interface/schedule/ISchedule";

interface LastSuccessExecutionStyledProps{
    isRefreshing?: boolean,
}

interface LastSuccessExecutionProps{
    theme?: ITheme,
    schedule: ISchedule,
    hasElasticSearch?: boolean,
}

export {
    LastSuccessExecutionProps,
    LastSuccessExecutionStyledProps,
}