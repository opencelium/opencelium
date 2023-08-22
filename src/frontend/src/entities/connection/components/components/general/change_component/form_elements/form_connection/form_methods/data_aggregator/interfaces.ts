import CConnection from "@classes/content/connection/CConnection";
import ModelDataAggregator from "@root/requests/models/DataAggregator";

export interface DataAggregatorProps {
    connection: CConnection,
    updateConnection: any,
}
export interface AggregatorListProps {
    connection: CConnection,
    updateConnection: any,
}
export interface AggregatorFormProps {
    readOnly?: boolean,
    allItems: {value: string, label: string}[],
    aggregator: ModelDataAggregator,
    isAdd?: boolean,
}
