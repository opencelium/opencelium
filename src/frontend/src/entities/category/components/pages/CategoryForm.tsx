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

import React, {FC, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {IForm} from "@application/interfaces/IForm";
import {Form} from "@application/classes/Form";
import FormSection from "@app_component/form/form_section/FormSection";
import FormComponent from "@app_component/form/form/Form";
import Button from "@app_component/base/button/Button";
import Tool from "@entity/schedule/classes/Tool";

import { Category } from "@entity/category/classes/Category";
import { ICategory } from "@entity/category/interfaces/ICategory";
import { capitalize } from "@application/utils/utils";

const CategoryForm: FC<IForm> = ({isAdd, isUpdate, isView}) => {
    const {
        addingCategory, currentCategory, updatingCategory,
        checkingCategoryName, isCurrentCategoryHasUniqueName, error,
        gettingCategory,
        categories
    } = Category.getReduxState();
    const {gettingAllTools, tools} = Tool.getReduxState();    
    const didMount = useRef(false);
    let navigate = useNavigate();
    let urlParams = useParams();
    const shouldFetchCategory = isUpdate || isView;
    const form = new Form({isView, isAdd, isUpdate});
    const formData = form.getFormData('Category');
    let categoryId = 0;
    if(shouldFetchCategory){
        categoryId = parseInt(urlParams.id);
    }
    

    const initialCategory = useMemo(() => {
        if(!currentCategory){
            return null;
        }
        return {
            ...currentCategory
        };
    }, [currentCategory]);

    const category = Category.createState<ICategory>({id: categoryId, _readOnly: isView}, isAdd ? null : initialCategory);
    useEffect(() => {
        if(shouldFetchCategory){
            category.getById()
        }
    },[]);

    useEffect(() => {
        if (didMount.current) {
            if(error === null && (addingCategory === API_REQUEST_STATE.FINISH || updatingCategory === API_REQUEST_STATE.FINISH)){
                navigate('/categories', { replace: false });
            }
        } else {
            didMount.current = true;
        }
    },[addingCategory, updatingCategory]);
    const NameInput = category.getText({
        propertyName: "name", props: {autoFocus: !isView, icon: 'title', label: 'Name', required: true, isLoading: checkingCategoryName === API_REQUEST_STATE.START, error: isCurrentCategoryHasUniqueName === TRIPLET_STATE.FALSE ? 'Must be unique' : ''}
    })
    const ParentCategory = category.getSelect({propertyName: 'parentSelect', props: {
        icon: 'category',
        label: 'Parent Category',
        options: Category.getOptionsForCategorySelect(categories),
        required: false,
        isLoading: gettingAllTools === API_REQUEST_STATE.START,
        categoryList: true
    }})

    let actions = [<Button
        key={'list_button'}
        label={formData.listButton.label}
        icon={formData.listButton.icon}
        href={'/categories'}
        autoFocus={isView}
    />];

    if(isAdd || isUpdate){
        let handleClick = isAdd ? () => category.add() : () => category.update();
        actions.unshift(<Button
            key={'action_button'}
            label={formData.actionButton.label}
            icon={formData.actionButton.icon}
            handleClick={handleClick}
            isLoading={addingCategory === API_REQUEST_STATE.START || updatingCategory === API_REQUEST_STATE.START}
        />);
    }
    
    const data = {
        title: [{name: 'Admin Panel', link: '/admin_cards'}, {name: formData.formTitle}],
        actions,
        formSections: [
            <FormSection label={{value: 'General Data'}}>
                {NameInput}
                {ParentCategory}
            </FormSection>
        ]
    }
    return(
        <FormComponent {...data} isLoading={shouldFetchCategory && gettingCategory === API_REQUEST_STATE.START}/>
    )
}

export default CategoryForm;
