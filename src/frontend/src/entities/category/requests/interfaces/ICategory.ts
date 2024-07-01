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
import {IResponse} from "@application/requests/interfaces/IResponse";
import {CategoryModel, CategoryModelCreate} from "../models/CategoryModel";

export interface DeleteCategoriesByIdRequestProps{
    identifiers: number[],
}

export interface ICategoryRequest{

    //to check if category with such name already exists
    checkCategoryName(): Promise<AxiosResponse<IResponse>>,

    //to get category by id
    getCategoryById(): Promise<AxiosResponse<CategoryModel>>,

    //to get all categories by authorized user
    getAllCategories(): Promise<AxiosResponse<CategoryModel[]>>,

    //to get all subcategories by authorized user
    getAllSubCategories(): Promise<AxiosResponse<CategoryModel[]>>,

    //to add category
    addCategory(category: CategoryModelCreate): Promise<AxiosResponse<CategoryModel>>,

    //to update category
    updateCategory(category: CategoryModel): Promise<AxiosResponse<CategoryModel>>,

    //to delete category by id
    deleteCategoryById(): Promise<AxiosResponse<IResponse>>,

    //to delete category with subcategories and connections by id
    deleteCategoryCascadeById(): Promise<AxiosResponse<IResponse>>,

    //to delete categories by id
    deleteCategoriesById(args: DeleteCategoriesByIdRequestProps): Promise<AxiosResponse<IResponse>>,

    //to delete categories with subcategories and connections by id
    deleteCategoriesCascadeById(args: DeleteCategoriesByIdRequestProps): Promise<AxiosResponse<IResponse>>,
}
