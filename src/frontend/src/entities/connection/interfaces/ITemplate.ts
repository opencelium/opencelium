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
import {TemplateState} from "@entity/template/redux_toolkit/slices/TemplateSlice";
import {IConnection} from "../interfaces/IConnection";
import ModelTemplate from "../requests/models/Template";


export interface ITemplateText{
    name: string;
    description?: string;
}


export interface ITemplateForm extends ITemplateText, IForm<ITemplateText, {}, {}, {}, {}, {}>{
    reduxState?: TemplateState;
    deleteById: () => boolean;
}

export interface ITemplate extends ITemplateForm{
    id?: string;
    dispatch?(instance: any): void;
    templateId?: string;
    link?: string;
    version?: string;
    connection?: IConnection;
    templateContent?: any;
    getModel?: () => ModelTemplate,
}

export type TemplateProps = keyof ITemplate | string;