/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import {IListCollection, ListCollectionCardProps, ListProp, MultipleTitleProps} from "../interfaces/IListCollection";
import {ColorTheme} from "@style/Theme";
import {AppDispatch} from "../utils/store";
import {API_REQUEST_STATE, ComponentPermissionProps} from "../interfaces/IApplication";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";
import {PermissionButton, PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {TextSize} from "@app_component/base/text/interfaces";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import { DeleteButtonStyled } from "@app_component/collection/collection_view/styles";

// parent class represents collection of entities
class ListCollection<EntityProps> implements IListCollection<EntityProps>{

    // to dispatch actions in collection (like delete by id)
    dispatch?: AppDispatch;

    // state of deleting entity
    deletingEntitiesState?: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    // state of uploading image
    uploadingImage?: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    // title of collection
    title?: string | MultipleTitleProps[] | React.ReactNode;

    // name of the property that represents key during collection rendering
    keyPropName: EntityProps;

    // props of list view
    listProps: ListProp<EntityProps>[] = [];

    // styles for list view
    listStyles: any = {};

    // component for raw in the list
    ListRawComponent: any = null;

    // props of grid view
    gridProps: ListCollectionCardProps;

    // name of the properties that should be sorted
    sortingProps: EntityProps[] = [];

    // translations of the listProps
    translations: any;

    // action to upload image
    uploadImage: any = false;

    // returns actions that located on the top of collection
    getTopActions?: (viewType?: ViewType, checkedIds?: number[] | string[]) => React.ReactNode = () => {return null;};

    // returns actions for grid view for each entity
    getGridActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        const hasDeleteButton = !this.isCurrentItem(entity);
        return (
            <React.Fragment>
                <PermissionButton href={`${entity.id}/view`} hasBackground={false} label={'View'} color={ColorTheme.Black} size={TextSize.Size_16} permission={componentPermission.READ}/>
                <PermissionButton href={`${entity.id}/update`} hasBackground={false} label={'Update'} color={ColorTheme.Black} size={TextSize.Size_16} permission={componentPermission.UPDATE}/>
                {hasDeleteButton && <DeleteButtonStyled><PermissionButton hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => entity.deleteById()} hasBackground={false} label={'Delete'} color={ColorTheme.Red} size={TextSize.Size_16} permission={componentPermission.DELETE}/></DeleteButtonStyled>}
            </React.Fragment>
        );
    };

    //returns actions for list view for each entity
    getListActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        const hasDeleteButton = !this.isCurrentItem(entity);
        return (
            <React.Fragment>
                <PermissionTooltipButton target={`view_entity_${entity.id.toString()}`} position={'top'} tooltip={'View'} href={`${entity.id}/view`} hasBackground={false} icon={'visibility'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.READ}/>
                <PermissionTooltipButton target={`update_entity_${entity.id.toString()}`} position={'top'} tooltip={'Update'} href={`${entity.id}/update`} hasBackground={false} icon={'edit'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.UPDATE}/>
                {hasDeleteButton && <PermissionTooltipButton target={`delete_entity_${entity.id.toString()}`} position={'top'} tooltip={'Delete'} hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => entity.deleteById()} hasBackground={false} icon={'delete'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.DELETE}/>}
            </React.Fragment>
        );
    };

    // all entities
    entities: any[] = [];

    // on/off actions of entity
    hasActions?: boolean = true;

    // on/off checkboxes of collection
    hasCheckboxes?: boolean = true;

    // on/off search input of collection
    hasSearch?: boolean = true;

    // filtered entities by search name
    filteredEntities?: any[] = [];

    // check if entity has link to navigate
    hasCardLink?: boolean = false;

    // check if entity's link is external
    isCardLinkExternal?: boolean = false;

    // currentItem (exceptions like auth user for users collection)
    currentItem?: any;

    // check if entity is a current item
    isCurrentItem?: (entity: any) => boolean = (entity) => {return false;};

    constructor(data?: IListCollection<EntityProps>) {
    }

    /**
     * search in collection
     * @param entity
     * @param searchValue
     */
    search(entity: any, searchValue: string): boolean{
        return true;
    }

    hasFilter?: boolean = false;
    getFilterComponents?: (filterData: any, setFilterData: (filterData: any) => void) => any;

    /**
     * filter in collection
     * @param entity
     * @param filterProps
     */
    filter(entity: any, filterProps: any): boolean{
        return true;
    }

    /**
     * sort collection
     * @param sortingProp - class property name
     * @param sortingType - check SortType
     */
    sort(sortingProp: string, sortingType: SortType): void{
    }

    /**
     * get filtered by search value and page entities
     * @param searchValue
     * @param page - page number
     * @param entitiesPerPage
     * @param filterData
     */
    getEntitiesByPage(searchValue: string, page: number, entitiesPerPage: number, filterData: any = null): any[]{
        let filteredEntities = this.entities.filter(visibleEntity => this.search(visibleEntity, searchValue));
        if(filterData !== null){
            filteredEntities = filteredEntities.filter(visibleEntity => this.filter(visibleEntity, filterData));
        }
        this.filteredEntities = filteredEntities;
        let newEntities = [];
        let startIndex = (page - 1) * entitiesPerPage;
        let stopIndex = startIndex + entitiesPerPage;
        if(stopIndex > filteredEntities.length){
            stopIndex = filteredEntities.length;
        }
        for(let i = startIndex; i < stopIndex; i++){
            newEntities.push(filteredEntities[i]);
        }
        return newEntities;
    }

    /**
     * ascending sort
     * @param a
     * @param b
     */
    asc(a: string | number, b: string | number): number{
        let result = 0
        if(a < b){
            result = -1;
        }
        if(a > b){
            result = 1;
        }
        return result;
    }

    /**
     * descending sort
     * @param a
     * @param b
     */
    desc(a: string | number, b: string | number): number{
        let result = 0
        if(a > b){
            result = -1;
        }
        if(a < b){
            result = 1;
        }
        return result;
    }
}

export default ListCollection;