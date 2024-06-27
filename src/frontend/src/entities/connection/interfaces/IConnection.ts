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
import {OptionProps} from "@app_component/base/input/select/interfaces";
import {ConnectionState} from "../redux_toolkit/slices/ConnectionSlice";


export interface IConnectionTextarea{
    description: string;
}

export interface IConnectionSelect{
    fromConnector: OptionProps | any;
    toConnector: OptionProps | any;
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
    dataAggregator?: any,
    categoryId?: OptionProps;
    getObjectForBackend?(): any;
}

export enum ConnectionLogType{
    ERROR = 'ERROR',
    INFO = 'INFO',
    WARNING = 'WARNING',
}

export interface ConnectionLogProps{
    isOperator: boolean,
    isMethod: boolean,
    message: string,
    index?: string,
    connectorType?: string,
    backgroundColor?: string,
    hasNextItem?: boolean,
    methodData?: {
        color?: string,
    },
    operatorData?: {
        isNextMethodOutside?: boolean,
        conditionResult?: boolean,
    },
    shouldDraw?: boolean,
    type: ConnectionLogType,
}

export type ConnectionProps = keyof IConnection | string;
