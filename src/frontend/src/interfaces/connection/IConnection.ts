import {IForm} from "@interface/application/core";
import {OptionProps} from "@atom/input/select/interfaces";
import {ConnectionState} from "@slice/connection/ConnectionSlice";


export interface IConnectionTextarea{
    description: string;
}

export interface IConnectionSelect{
    fromConnector: OptionProps;
    toConnector: OptionProps;
}

export interface IConnectionText{
    title: string;
}

export interface IConnectionForm extends IConnectionText, IConnectionTextarea, IConnectionSelect,  IForm<IConnectionText, IConnectionSelect, {}, {}, IConnectionTextarea, {}>{
    add: () => boolean;
    reduxState?: ConnectionState;
    deleteById: () => boolean;
}

export interface IConnection extends IConnectionForm{
    id?: number;
    connectionId?: number;
    mode?: boolean;
    fieldBinding?: any;
}
