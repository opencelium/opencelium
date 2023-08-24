//api description of data aggregator
export default interface ModelDataAggregator{
    id?: string,
    name: string,
    assignedItems: ModelAssignedItem[],
    args: ModelArgument[],
    script: string,
}

export interface ModelAssignedItem{
    name: string,
    isPartial?: boolean,
}

export interface ModelArgument{
    name: string,
    description?: string,
}
