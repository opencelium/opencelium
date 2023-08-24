import {ModelArgument} from "@root/requests/models/DataAggregator";

export interface ArgumentsProps {
    add: (arg: ModelArgument) => void,
    update?: (index: number, arg: ModelArgument) => void,
    deleteArg?: (index: number) => void,
    args: ModelArgument[],
    readOnly?: boolean,
}
export interface ArgumentProps {
    argument: ModelArgument,
    id: string | number,
    isAdd?: boolean,
    isUpdate?: boolean,
    isView?: boolean,
    add: (arg: ModelArgument) => void,
    update?: (arg: ModelArgument) => void,
    deleteArg?: () => void,
    args: ModelArgument[],
    argIndex?: number,
}
export interface AddArgumentProps{
    add: (arg: ModelArgument) => void,
    args: ModelArgument[],
}
