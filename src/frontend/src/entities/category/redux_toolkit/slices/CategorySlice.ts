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

import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {IResponse, ResponseMessages} from "@application/requests/interfaces/IResponse";
import {ICommonState} from "@application/interfaces/core";
import {CommonState} from "@application/utils/store";
import {CategoryModel} from "@entity/category/requests/models/CategoryModel";
import {
  addCategory,
  checkCategoryName,
  deleteCategoryById,
  deleteCategoriesById,
  getAllCategories,
  getAllSubCategories,
  getCategoryById, 
  updateCategory,
  ALL_CATEGORIES,
} from "../action_creators/CategoryCreators";

export interface CategoryState extends ICommonState{
  categories: CategoryModel[],
  subCategories: CategoryModel[],
  isCurrentCategoryHasUniqueName: TRIPLET_STATE,
  checkingCategoryName: API_REQUEST_STATE,
  addingCategory: API_REQUEST_STATE,
  addingSubCategory: API_REQUEST_STATE,
  updatingCategory: API_REQUEST_STATE,
  gettingCategory: API_REQUEST_STATE,
  gettingCategories: API_REQUEST_STATE,
  gettingSubCategories: API_REQUEST_STATE,
  deletingCategoryById: API_REQUEST_STATE,
  deletingCategoriesById: API_REQUEST_STATE,
  currentCategory: CategoryModel,
  activeCategory: string,
}

const initialState: CategoryState = {
  categories: ALL_CATEGORIES,
  subCategories: [],
  isCurrentCategoryHasUniqueName: TRIPLET_STATE.INITIAL,
  checkingCategoryName: API_REQUEST_STATE.INITIAL,
  addingCategory: API_REQUEST_STATE.INITIAL,
  addingSubCategory: API_REQUEST_STATE.INITIAL,
  updatingCategory: API_REQUEST_STATE.INITIAL,
  gettingCategory: API_REQUEST_STATE.INITIAL,
  gettingCategories: API_REQUEST_STATE.INITIAL,
  gettingSubCategories: API_REQUEST_STATE.INITIAL,
  deletingCategoryById: API_REQUEST_STATE.INITIAL,
  deletingCategoriesById: API_REQUEST_STATE.INITIAL,
  currentCategory: null,
  activeCategory: null,
  ...CommonState,
}

export const categorySlice = createSlice({
    name: 'category',
    initialState,
    reducers: {
      setActiveCategory: (state, action: PayloadAction<any>) => {
        state.activeCategory = action.payload;
      },
    },
    extraReducers: {
      [checkCategoryName.pending.type]: (state) => {
        state.checkingCategoryName = API_REQUEST_STATE.START;
      },
      [checkCategoryName.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
        state.checkingCategoryName = API_REQUEST_STATE.FINISH;
        state.isCurrentCategoryHasUniqueName = action.payload.message === ResponseMessages.NOT_EXISTS ? TRIPLET_STATE.TRUE : TRIPLET_STATE.FALSE;
        state.error = null;
      },
      [checkCategoryName.rejected.type]: (state, action: PayloadAction<IResponse>) => {
        state.checkingCategoryName = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [addCategory.pending.type]: (state, action: PayloadAction<CategoryModel>) => {
        state.addingCategory = API_REQUEST_STATE.START;
      },
      [addCategory.fulfilled.type]: (state, action: PayloadAction<CategoryModel>) => {
        state.addingCategory = API_REQUEST_STATE.FINISH;
        const newCategory = action.payload;
        state.categories.push(newCategory);
  
        if (newCategory.parentCategory) {
          const existingCategory = state.categories.find(
            (item) => item.id === newCategory.parentCategory
          );
          if (existingCategory) {
            if (!existingCategory.subCategories) {
              existingCategory.subCategories = [];
            }
            // @ts-ignore
            existingCategory.subCategories.push(newCategory.id);
          }
        }
  
        state.error = null;
      },
      [addCategory.rejected.type]: (state, action: PayloadAction<IResponse>) => {
        state.addingCategory = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [updateCategory.pending.type]: (state) => {
        state.updatingCategory = API_REQUEST_STATE.START;
      },
      [updateCategory.fulfilled.type]: (state, action: PayloadAction<CategoryModel>) => {
        state.updatingCategory = API_REQUEST_STATE.FINISH;
        state.categories = state.categories.map(category => category.id === action.payload.id ? action.payload : category);
        if(state.currentCategory && state.currentCategory.id === action.payload.id){
          state.currentCategory = action.payload;
        }
        state.error = null;
      },
      [updateCategory.rejected.type]: (state, action: PayloadAction<IResponse>) => {
        state.updatingCategory = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [getCategoryById.pending.type]: (state) => {
        state.gettingCategory = API_REQUEST_STATE.START;
        state.currentCategory = null;
      },
      [getCategoryById.fulfilled.type]: (state, action: PayloadAction<CategoryModel>) => {
        state.gettingCategory = API_REQUEST_STATE.FINISH;
        state.currentCategory = action.payload;
        state.error = null;
      },
      [getCategoryById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
        state.gettingCategory = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [getAllCategories.pending.type]: (state) => {
        state.gettingCategories = API_REQUEST_STATE.START;
      },
      [getAllCategories.fulfilled.type]: (state, action: PayloadAction<CategoryModel[]>) => {
        state.gettingCategories = API_REQUEST_STATE.FINISH;
        state.categories = action.payload;
        state.error = null;
      },
      [getAllCategories.rejected.type]: (state, action: PayloadAction<IResponse>) => {
        state.gettingCategories = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [getAllSubCategories.pending.type]: (state) => {
        state.gettingSubCategories = API_REQUEST_STATE.START;
      },
      [getAllSubCategories.fulfilled.type]: (state, action: PayloadAction<CategoryModel[]>) => {
        state.gettingSubCategories = API_REQUEST_STATE.FINISH;
        state.subCategories = action.payload;
        state.error = null;
      },
      [getAllSubCategories.rejected.type]: (state, action: PayloadAction<IResponse>) => {
        state.gettingSubCategories = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [deleteCategoryById.pending.type]: (state) => {
        state.deletingCategoryById = API_REQUEST_STATE.START;
      },
      [deleteCategoryById.fulfilled.type]: (state, action: PayloadAction<number>) => {
        state.deletingCategoryById = API_REQUEST_STATE.FINISH;
        state.categories = state.categories.filter(category => category.id !== action.payload);
        if(state.currentCategory && state.currentCategory.id === action.payload){
          state.currentCategory = null;
        }
        state.error = null;
      },
      [deleteCategoryById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
        state.deletingCategoryById = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [deleteCategoriesById.pending.type]: (state) => {
        state.deletingCategoriesById = API_REQUEST_STATE.START;
      },
      [deleteCategoriesById.fulfilled.type]: (state, action: PayloadAction<number[]>) => {
        state.deletingCategoriesById = API_REQUEST_STATE.FINISH;
        state.categories = state.categories.filter(category => action.payload.findIndex(id => `${id}` === `${category.id}`) === -1);
        if(state.currentCategory && action.payload.findIndex(id => `${id}` === `${state.currentCategory.id}`) !== -1){
          state.currentCategory = null;
        }
        state.error = null;
      },
      [deleteCategoriesById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
        state.deletingCategoriesById = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
    }
})

export const {
  setActiveCategory
} = categorySlice.actions;

export default categorySlice.reducer;