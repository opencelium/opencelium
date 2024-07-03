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

import React, {ReactElement, ReactNode} from "react";
import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import {IInput} from "@application/interfaces/core";
import {RootState} from "@application/utils/store";
import {useAppSelector} from "@application/utils/store";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {InputSelectProps, OptionProps} from "@app_component/base/input/select/interfaces";
import {
    ICategory,
    ICategoryText,
    ICategorySelect
} from "@entity/category/interfaces/ICategory";
import {
    addCategory,
    getCategoryById,
    updateCategory,
    deleteCategoryById
} from "@entity/category/redux_toolkit/action_creators/CategoryCreators";
import {
    CategoryModel,
    CategoryModelCreate,
    CategoryModelUpdate,
    ParentCategoryModel
} from "@entity/category/requests/models/CategoryModel";
import { capitalize } from "@application/utils/utils";
import { useAppDispatch } from "@application/utils/store";
import category from "@entity/category/translations/interpolations/category";


export class Category extends HookStateClass implements ICategory{
    id: number;

    @App.inputType
    name: string;

    @App.inputType
    parentSelect: OptionProps;

    categories: CategoryModel[];

    subCategories: number[] = [];

    parentCategory: ParentCategoryModel | null = null;

    subcategories: CategoryModel[] | string[];

    constructor(category?: Partial<ICategory> | null) {
        // @ts-ignore
        super(category?.validations || {}, category?._readOnly, category?.wholeInstance);
        this.id = category?.id || 0;
        this.name = category?.name || '';
        this.parentSelect = category?.parentSelect || null;
        this.parentCategory = category?.parentCategory || null;
        if(!this.parentSelect && this.parentCategory){
            this.parentSelect = {label: this.parentCategory.name, value: this.parentCategory.id};
        }
        // @ts-ignore
        this.dispatch = category?.dispatch ? category?.dispatch : useAppDispatch();
    }

    static getOptionsForCategorySelect(categories: CategoryModel[], hasFilter: boolean = true, currentCategory: CategoryModel = null) {
        function transformCategory(category: any) {
            if(category){
                return {
                    label: category.name,
                    value: category.id,
                    isChild: !!category.parentCategory,
                    subCategories: category.subCategories
                    ? category.subCategories.map((subCategoryId: any) =>
                        transformCategory(categories.find(subCategory => subCategory.id === subCategoryId))
                        )
                    : null,
                };
            }
        }

        let transformedCategories: any = categories;
        if(hasFilter) {
            transformedCategories = transformedCategories.filter((category: CategoryModel) => !category.parentCategory)
        }
        if(currentCategory) {
            transformedCategories = transformedCategories.filter((category: CategoryModel) => category.id !== currentCategory.id);
        }
        transformedCategories = transformedCategories.map(transformCategory);

        return transformedCategories;
    }

    static createState<T>(args?: Partial<ICategory>, observation?: any):T{
        const observations = [{functionName: 'updateState', value: observation}];
        return super.createState<ICategory>(
            Category,
            (state: RootState) => state.categoryReducer,
            args,
            observations
        );
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.categoryReducer);
    }

    static getRecursivelyConnectionsByCategory(connections: any[], categories: CategoryModel[], categoryId: number) {
        let result: any[] = [];
        const getSubCategoriesByCategory = (id: number) => {
            let ids: any[] = [id];
            const category = categories.find(c => c.id === id);
            if (category) {
                for (let i = 0; i < category?.subCategories?.length; i++) {
                    ids = [...ids, ...getSubCategoriesByCategory(category.subCategories[i])];
                }
            }
            return ids;
        }
        const categoryIds = getSubCategoriesByCategory(categoryId);
        return connections.filter(c => categoryIds.indexOf(c.categoryId) !== -1);
    }

    getText(data: IInput<ICategoryText, InputTextProps>):ReactElement{
        return super.getInputText<ICategoryText, InputTextProps>(data);
    }

    getTexts(data: IInput<ICategoryText, InputTextProps>[]):ReactNode[]{
        return super.getInputTexts<ICategoryText, InputTextProps>(data);
    }

    getSelect(data: IInput<ICategorySelect, InputSelectProps>):ReactElement{
        return super.getInputSelect<ICategorySelect, InputSelectProps>(data);
    }

    validateName(): boolean{
        let isNotValid = false;
        if(this.name === ''){
            isNotValid = true;
            this.validations['name'] = 'The name is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateName(this, this.name);
            if(!this.isFocused){
                document.getElementById('input_name').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }


    validateAdd() {
        this.isFocused = false;
        const isValidName = this.validateName();
        return isValidName;
    }

    @App.dispatch<CategoryModel>(getCategoryById, {mapping: (category: CategoryModel) => {return category.id}, hasNoValidation: true})
    getById(): boolean{
        return this.validateId(this.id);
    }

    @App.dispatch(addCategory, {
        mapping: (category: ICategory): CategoryModelCreate => {
            const data: CategoryModelCreate = {name: category.name, parentCategory: null}
            if(category.parentSelect){
                data.parentCategory = (+category.parentSelect.value);
            }
            return data;
        }, hasNoValidation: false})
    add(): boolean{
        return this.validateAdd();
    }

    @App.dispatch(updateCategory, {
        mapping: (category: ICategory): CategoryModelUpdate => {
            return {
                id: category.id,
                name: category.name,
                parentCategory: category.parentSelect ? (+category.parentSelect.value) : null,
            }}, hasNoValidation: false})
    update(): boolean{
        return this.validateId(this.id) && this.validateAdd();
    }

    @App.dispatch<CategoryModel>(deleteCategoryById, {mapping: (category: CategoryModel) => {return category.id}, hasNoValidation: true})
    deleteById(): boolean{
        return this.validateId(this.id);
    }
}
