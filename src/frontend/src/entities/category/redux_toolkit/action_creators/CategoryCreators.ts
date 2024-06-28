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

import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import { CategoryRequest } from "@entity/category/requests/classes/Category";
import { CategoryModel } from "@entity/category/requests/models/CategoryModel";


export const checkCategoryName = createAsyncThunk(
    'category/exist/name',
    async(category: CategoryModel, thunkAPI) => {
        try {
            const request = new CategoryRequest({endpoint: `/exists/${category.name}`});
            const response = await request.checkCategoryName();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addCategory = createAsyncThunk(
    'category/add',
    async(category: CategoryModel, thunkAPI) => {
        try {
            /*
            * TODO: uncomment when backend has check name method
            */
            /*
            const checkNameRequest = new CategoryRequest({endpoint: `/exists/${category.name}`});
            const responseNameRequest = await checkNameRequest.checkCategoryName();
            if(responseNameRequest.data.message === ResponseMessages.EXISTS){
                return thunkAPI.rejectWithValue(responseNameRequest.data);
            }
             */
            const request = new CategoryRequest();
            const response = await request.addCategory(category);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateCategory = createAsyncThunk(
    'category/update',
    async(category: CategoryModel, thunkAPI) => {
        try {
            /*
            * TODO: uncomment when backend has check name method
            */

            /* const categoryState = thunkAPI.getState().categoryReducer;
            if(categoryState.currentCategory.name !== category.name){
                const checkNameRequest = new CategoryRequest({endpoint: `/exists/${category.name}`});
                const responseNameRequest = await checkNameRequest.checkCategoryName();
                if(responseNameRequest.data.message === ResponseMessages.EXISTS){
                    return thunkAPI.rejectWithValue(responseNameRequest.data);
                }
            } */

            const request = new CategoryRequest({endpoint: `/${category.id}`});
            const response = await request.updateCategory(category);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getCategoryById = createAsyncThunk(
    'category/get/byId',
    async(categoryId: number, thunkAPI) => {
        try {
            const request = new CategoryRequest({endpoint: `/${categoryId}`});
            const response = await request.getCategoryById();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllCategories = createAsyncThunk(
    'category/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new CategoryRequest();
            const response = await request.getAllCategories();
            // @ts-ignore
            return response.data || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllSubCategories = createAsyncThunk(
    'category/get/all/subcategories',
    async(data: never, thunkAPI) => {
        try {
            const request = new CategoryRequest();
            const response = await request.getAllSubCategories();
            // @ts-ignore
            return response.data || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteCategoryById = createAsyncThunk(
    'category/delete/byId',
    async(id: number, thunkAPI) => {
        try {
            const request = new CategoryRequest({endpoint: `/${id}`});
            await request.deleteCategoryById();
            return id;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteCategoriesById = createAsyncThunk(
    'category/delete/selected/byId',
    async(identifiers: number[], thunkAPI) => {
        try {
            const request = new CategoryRequest();
            await request.deleteCategoriesById({identifiers});
            return identifiers;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    checkCategoryName,
    addCategory,
    updateCategory,
    getCategoryById,
    getAllCategories,
    getAllSubCategories,
    deleteCategoryById,
    deleteCategoriesById,
}
