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

import React from "react";
import ListCollection from "@application/classes/ListCollection";
import {ListProp} from "@application/interfaces/IListCollection";
import {AppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import {PermissionButton} from "@app_component/base/button/PermissionButton";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";
import { ICategory, CategoryProps } from "@entity/category/interfaces/ICategory";
import { Category } from "@entity/category/classes/Category";
import { deleteCategoriesById } from "@entity/category/redux_toolkit/action_creators/CategoryCreators";
import { CategoryPermissions } from "@entity/category/constants";

class Categories extends ListCollection<CategoryProps>{
    name: string = 'categories';
    entities: ICategory[];
    title = [{name: 'Admin Panel', link: '/admin_cards'}, {name: 'Categories'}];
    keyPropName: CategoryProps ='id';
    sortingProps: CategoryProps[] = ['name'];
    listProps: ListProp<CategoryProps>[] = [{propertyKey: 'name', width: '40%'}];
    gridProps = {title: 'name'};
    translations = {
        name: 'Name',
        type: 'Parent',
    };
    getTopActions = (viewType: ViewType, checkedIds: number[] = []) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                <PermissionButton autoFocus={!hasSearch} key={'add_button'} icon={'add'} href={'add'} label={'Add Category'} permission={CategoryPermissions.CREATE}/>
                {viewType === ViewType.LIST && this.entities.length !== 0 && <PermissionButton isDisabled={checkedIds.length === 0} hasConfirmation confirmationText={'Do you really want to delete?'}  key={'delete_button'} icon={'delete'} label={'Delete Selected'} handleClick={() => this.dispatch(deleteCategoriesById(checkedIds))} permission={CategoryPermissions.DELETE}/>}
            </React.Fragment>
        );
    };
    dispatch: AppDispatch = null;
    deletingEntitiesState: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    constructor(categories: any[], dispatch: AppDispatch, deletingEntitiesState?: API_REQUEST_STATE) {
        super();
        let categoryInstances = [];
        for(let i = 0; i < categories.length; i++){
            categoryInstances.push(new Category({...categories[i], dispatch}));
        }
        this.dispatch = dispatch;
        this.deletingEntitiesState = deletingEntitiesState;
        this.entities = [...categoryInstances];
    }

    search(category: ICategory, searchValue: string){
        searchValue = searchValue.toLowerCase();
        let checkName = category.name ? category.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        // @ts-ignore
        let checkType = category.type ? category.type.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkName || checkType;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'name':
                this.entities = this.entities.sort((a: ICategory, b: ICategory) => {
                    if(sortingType === SortType.asc){
                        return this.asc(a.name, b.name);
                    } else{
                        return this.desc(a.name, b.name);
                    }
                })
                break;
        }
    }
}

export default Categories;