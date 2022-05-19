/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import { REQUEST_METHOD } from "@application/requests/interfaces/IApplication";
import {IBody} from "../interfaces/IBody";

export interface IRequestText{
    endpoint: string;
}

export interface IRequestRadios{
    method: REQUEST_METHOD,
}

export interface IRequest extends IRequestText, IRequestRadios, IForm<IRequestText, {}, IRequestRadios>{
    nodeId?: any;
    header?: any;
    body: IBody;
    getObject: () => any,
}