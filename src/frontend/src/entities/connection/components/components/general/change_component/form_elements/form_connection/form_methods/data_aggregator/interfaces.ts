import CConnection from "@classes/content/connection/CConnection";
import ModelDataAggregator from "@root/requests/models/DataAggregator";

export type FormType = 'add' | 'update' | 'view';

export interface DataAggregatorProps {
    connection: CConnection,
    updateConnection: any,
    readOnly?: boolean,
}
export interface AggregatorListProps {
    dataAggregator: ModelDataAggregator[],
    updateConnection: any,
    setFormType: (type: FormType, aggregator: ModelDataAggregator) => void,
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
}

export interface DialogTitleProps {
    hasList: boolean,
    isForm: boolean,
    setIsForm: (isForm: boolean) => void,
}
