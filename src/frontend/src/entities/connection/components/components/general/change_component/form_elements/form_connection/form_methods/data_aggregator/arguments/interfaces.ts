import {ModelArgument} from "@root/requests/models/DataAggregator";

export interface ArgumentsProps {
    args: ModelArgument[],
    readOnly?: boolean,
}
export interface ArgumentProps {
    argument: ModelArgument,
    id: string | number,
    readOnly?: boolean,
    isAdd?: boolean,
}
export interface AddArgumentProps{

}
