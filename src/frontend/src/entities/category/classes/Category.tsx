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
import { CategoryModel } from "@entity/category/requests/models/CategoryModel";
import { capitalize } from "@application/utils/utils";
import { useAppDispatch } from "@application/utils/store";


export class Category extends HookStateClass implements ICategory{
    id: number;

    @App.inputType
    name: string;

    @App.inputType
    parentSelect: OptionProps;

    categories: CategoryModel[];

    parent: string;

    subcategories: CategoryModel[] | string[];

    constructor(category?: Partial<ICategory> | null) {
        // @ts-ignore
        super(category?.validations || {}, category?._readOnly, category?.wholeInstance);
        this.id = category?.id || 0;
        this.name = category?.name || '';
        this.parentSelect = category?.parentSelect || null;
        this.parent = category?.parent || null;
        if(!this.parentSelect && this.parent){
            this.parentSelect = {label: this.parent, value: this.parent};
        }
        // @ts-ignore
        this.dispatch = category?.dispatch ? category?.dispatch : useAppDispatch();
    }

    static getOptionsForCategorySelect(categories: CategoryModel[]) {
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
            
        const transformedCategories = categories
        .filter(category => category.parentCategory === null)
        .map(transformCategory);

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
        mapping: (category: ICategory): CategoryModel => {
            const data: CategoryModel = {name: category.name}
            if(category.parentSelect){
                data.parentCategory = category.parentSelect.value;
            }
            return data;
        }, hasNoValidation: false})
    add(): boolean{
        return this.validateAdd();
    }

    @App.dispatch(updateCategory, {
        mapping: (category: ICategory): CategoryModel => {
            return {
                name: category.name,
                id: category.id
            }}, hasNoValidation: false})
    update(): boolean{
        return this.validateId(this.id) && this.validateAdd();
    }

    @App.dispatch<CategoryModel>(deleteCategoryById, {mapping: (category: CategoryModel) => {return category.id}, hasNoValidation: true})
    deleteById(): boolean{
        return this.validateId(this.id);
    }
}
