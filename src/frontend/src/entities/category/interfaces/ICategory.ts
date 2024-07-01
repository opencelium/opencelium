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
import { CategoryModel } from "../requests/models/CategoryModel";

export interface ICategoryText{
    name: string;
}

export interface ICategorySelect{
    parentSelect: OptionProps;
}

export interface ICategoryForm extends ICategoryText, ICategorySelect, IForm<ICategoryText, ICategorySelect, {}, {}, {}, {}>{
    getById: () => boolean;
    add: () => boolean;
    update: () => boolean;
    deleteById: () => boolean;
}

export interface ICategory extends CategoryModel, ICategoryForm {
    id?: number;
}

export type CategoryProps = keyof ICategory;
