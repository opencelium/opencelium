//api description of data aggregator

export default interface ModelDataAggregator{
    id?: string,
    name: string,
    assignedItems?: ModelAssignedItem[],
    args: ModelArgument[],
    active?: boolean,
    script: string,
}

export type ModelDataAggregatorProps = keyof ModelDataAggregator;

export interface ModelAssignedItem{
    name: string,
    isPartial?: boolean,
}

export interface ModelArgument{
    id?: string,
    name: string,
    description?: string,
}
