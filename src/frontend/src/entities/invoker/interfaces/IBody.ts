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

import {IForm} from "@application/interfaces/core";
import {ReactElement} from "react";
import {InputElementProps} from "@app_component/base/input/interfaces";
import {DataType, ResponseFormat, ResponseType} from "../requests/models/Body";


export interface IBodyRadios{
    format: ResponseFormat,
}

export interface IBodyText{
}

export interface IBody extends IBodyText, IBodyRadios, IForm<IBodyText, {}, IBodyRadios>{
    nodeId?: any;
    type: ResponseType,
    fields: any;
    data: DataType;
    getFields: (props?: InputElementProps) => ReactElement;
    getObject: () => any,
    setType: (type: ResponseType) => void,
}