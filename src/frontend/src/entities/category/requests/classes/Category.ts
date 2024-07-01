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

import {AxiosResponse} from "axios";
import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {CategoryModel, CategoryModelCreate} from "../models/CategoryModel";
import { DeleteCategoriesByIdRequestProps, ICategoryRequest } from "../interfaces/ICategory";


export class CategoryRequest extends Request implements ICategoryRequest{

  constructor(settings?: Partial<IRequestSettings>) {
    super({url: 'category', ...settings});
  }

  async checkCategoryName(): Promise<AxiosResponse<IResponse>>{
    return super.get<IResponse>();
  }

  async getCategoryById(): Promise<AxiosResponse<CategoryModel>>{
    return super.get<CategoryModel>();
  }

  async getAllCategories(): Promise<AxiosResponse<CategoryModel[]>>{
    this.endpoint = '/all';
    return super.get<CategoryModel[]>();
  }

  async getAllSubCategories(): Promise<AxiosResponse<CategoryModel[]>>{
    this.endpoint = '/all/subcategories';
    return super.get<CategoryModel[]>();
  }

  async addCategory(category: CategoryModelCreate): Promise<AxiosResponse<CategoryModel>>{
    return super.post<CategoryModel>(category);
  }

  async updateCategory(category: CategoryModel): Promise<AxiosResponse<CategoryModel>>{
    return super.put<CategoryModel>(category);
  }

  async deleteCategoryById(): Promise<AxiosResponse<IResponse>>{
    return super.delete<IResponse>();
  }

  async deleteCategoriesById(data: DeleteCategoriesByIdRequestProps): Promise<AxiosResponse<IResponse>>{
    this.endpoint = '/list/delete';
    return super.put<IResponse>(data);
  }
}
