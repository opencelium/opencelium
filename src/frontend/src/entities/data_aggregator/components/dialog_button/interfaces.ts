import CConnection from "@classes/content/connection/CConnection";
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";

export type FormType = 'add' | 'update' | 'view';

export interface DataAggregatorProps {
    connection: CConnection,
    updateConnection: any,
    readOnly?: boolean,
}
export interface AggregatorFormProps {
    readOnly?: boolean,
    allMethods: { value: string, label: string }[],
    allOperators: { value: string, label: string }[],
    aggregator: ModelDataAggregator,
    formType?: FormType,
    theme?: any,
    add: (aggregator: ModelDataAggregator) => void,
    update: (aggregator: ModelDataAggregator) => void,
    closeForm: () => void,
    dataAggregator: ModelDataAggregator[],
}

export interface DataAggregatorProps {
    connection: CConnection,
    updateConnection: any,
    readOnly?: boolean,
}
