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

    getObjectForBackend?(): any;
}
