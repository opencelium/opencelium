import {ITheme} from "@style/Theme";
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";

export interface AggregatorActiveProps{
    theme?: ITheme,
    aggregator: ModelDataAggregator,
    onClick: any,
    readOnly?: boolean,
}
