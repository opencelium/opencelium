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

import { OptionProps } from "@app_component/base/input/select/interfaces";

export interface CategoryModel{
  id?: number;
  name: string;
  parentCategory: ParentCategoryModel | null;
  subCategories: number[];
}

export interface ParentCategoryModel {
  id: number,
  name: string,
}

export interface CategoryModelCreate {
  name: string,
  parentCategory: number | null,
}
export interface CategoryModelUpdate extends CategoryModelCreate {
  id: number;
}

// export interface SubCategoryModel{
//   id?: string;
//   name: string;
//   parentCategory?: string;
//   subcategories?: SubCategoryModel[] | string[];
// }
