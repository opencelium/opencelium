import {IForm} from "@interface/application/core";
import {OptionProps} from "@atom/input/select/interfaces";
import {ConnectorState} from "@slice/ConnectorSlice";
import {InputTextProps} from "@atom/input/text/interfaces";
import {IInvoker} from "@interface/invoker/IInvoker";


export interface IConnectorFile{
    iconFile: FileList;
}

export interface IConnectorTextarea{
    description: string;
    invokerDescription: string;
}

export interface IConnectorSelect{
    invokerSelect: OptionProps;
}

export interface IConnectorSwitch{
    sslCert: boolean,
}

export interface IConnectorText{
    title: string;
    timeout: number;
}


export interface IConnectorForm extends IConnectorText, IConnectorTextarea, IConnectorSelect, IConnectorSwitch, IConnectorFile, IForm<IConnectorText, IConnectorSelect, {}, IConnectorFile, IConnectorTextarea, IConnectorSwitch>{
    getById: () => boolean;
    add: () => boolean;
    update: () => boolean;
    deleteById: () => boolean;
    reduxState?: ConnectorState;
    getCredentials: (props: InputTextProps) => any;
}

export interface IConnector extends IConnectorForm{
    id?: number;
    invoker?: IInvoker;
    connectorId?: number;
    requestData?: any;
    icon?: string;
    shouldDeleteIcon?: boolean,
}
