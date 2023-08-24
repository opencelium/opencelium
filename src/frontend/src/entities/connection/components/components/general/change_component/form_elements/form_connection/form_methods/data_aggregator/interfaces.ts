import CConnection from "@classes/content/connection/CConnection";
import ModelDataAggregator from "@root/requests/models/DataAggregator";

export interface DataAggregatorProps {
    connection: CConnection,
    updateConnection: any,
    readOnly?: boolean,
}
export interface AggregatorListProps {
    connection: CConnection,
    updateConnection: any,
}
export interface AggregatorFormProps {
    readOnly?: boolean,
    allMethods: {value: string, label: string}[],
    allOperators: {value: string, label: string}[],
    aggregator: ModelDataAggregator,
    isAdd?: boolean,
    theme?: any,
    add: (aggregator: ModelDataAggregator) => void,
}
export interface DialogTitleProps {
    isForm: boolean,
    setIsForm: (isForm: boolean) => void,
}
