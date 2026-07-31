export interface DataAggregatorArg {
    id?: number
    name: string
    description: string
}

export interface DataAggregator {
    id: number
    name: string
    active: boolean
    script: string
    args: DataAggregatorArg[]
}

export interface DataAggregatorDto {
    id?: number
    name: string
    active: boolean
    args: DataAggregatorArg[]
    script: string
}
