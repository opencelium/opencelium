import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";

export type FormType = 'add' | 'update' | 'view';

export interface AggregatorListProps {
    setFormType: (type: FormType, aggregator: ModelDataAggregator) => void,
}
