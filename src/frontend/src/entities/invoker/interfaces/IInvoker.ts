/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {IForm} from "@application/interfaces/core";
import {InvokerState} from "../redux_toolkit/slices/InvokerSlice";
import {Operation} from "../classes/Operation";
import {ReactElement} from "react";
import {OptionProps} from "@app_component/base/input/select/interfaces";


export enum AuthType{
    ApiKey= 'apikey',
    Basic= 'basic',
    EndpointAuth= 'endpointAuth',
    Token= 'token',
}

export interface IInvokerSelect{
    authTypeSelect: OptionProps,
}

export interface IInvokerFile{
    iconFile: FileList;
}

export interface IInvokerTextarea{
    description: string;
}

export interface IInvokerText{
    name: string;
    hint: string;
}


export interface IInvokerForm extends IInvokerText, IInvokerTextarea, IInvokerFile, IInvokerSelect, IForm<IInvokerText, IInvokerSelect, {}, IInvokerFile, IInvokerTextarea, {}>{
    getByName: () => boolean;
    add: (operations: Operation[]) => boolean;
    update: (operations: Operation[]) => boolean;
    deleteByName: () => boolean;
    uploadImage: () => boolean;
    deleteImage: () => boolean;
    checkName: () => boolean;
    reduxState?: InvokerState;
}

export interface IInvoker extends IInvokerForm{
    id?: number;
    invokerId?: number;
    icon?: string;
    operations: Operation[];
    authType: AuthType,
    requiredData: any;
    shouldDeletePicture?: boolean,
    getRequiredDataComponent: () => ReactElement,
    getObject: () => any,
    getXml: () => string,
    getConnection: () => Operation,
}

export type InvokerProps = keyof IInvoker | string;