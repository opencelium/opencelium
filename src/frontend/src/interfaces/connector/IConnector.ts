/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {IForm} from "@interface/application/core";
import {OptionProps} from "@atom/input/select/interfaces";
import {ConnectorState} from "@slice/ConnectorSlice";
import {InputTextProps} from "@atom/input/text/interfaces";
import {IInvoker} from "@interface/invoker/IInvoker";
import ModelConnectorPoust from "@model/connector/ConnectorPoust";


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
    getPoustModel: () => ModelConnectorPoust;
}

export interface IConnector extends IConnectorForm{
    id?: number;
    invoker?: IInvoker;
    connectorId?: number;
    requestData?: any;
    icon?: string;
    shouldDeleteIcon?: boolean,
}
