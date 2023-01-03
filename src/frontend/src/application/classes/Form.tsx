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

import {FormDataButtonProps, FormDataProps, IForm} from "../interfaces/IForm";
import {capitalize} from "../utils/utils";

// class to work with forms
export class Form implements IForm{

    // view form (readonly)
    isView?: boolean;

    // add form
    isAdd?: boolean;

    // update form
    isUpdate?: boolean;

    constructor(form?: Partial<IForm>) {
        this.isView = form?.isView || false;
        this.isUpdate = form?.isUpdate || false;
        this.isAdd = form?.isAdd || false;
    }

    /**
     * read FormDataProps to understand what data it returns
     * @param entityName - name bases on form data
     */
    getFormData(entityName: string): FormDataProps{
        let formTitle = '';
        let actionButton: FormDataButtonProps = {icon: '', label: ''};
        let listButton: FormDataButtonProps = {icon: '', label: ''};
        if(this.isUpdate){
            formTitle = `Update ${capitalize(entityName)}`;
            actionButton.label = 'Update';
            actionButton.icon = 'update';
        }
        if(this.isAdd){
            formTitle = `Add ${capitalize(entityName)}`;
            actionButton.label = 'Add';
            actionButton.icon = 'add';
        }
        if(this.isView){
            formTitle = `View ${capitalize(entityName)}`;
            listButton.label = `${capitalize(entityName)}s`;
            listButton.icon = 'list_alt';
        } else{
            listButton.label = `Cancel`;
            listButton.icon = 'cancel';
        }
        return{
            formTitle,
            actionButton,
            listButton,
        }
    }

}