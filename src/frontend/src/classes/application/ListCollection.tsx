/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from "react";
import {IListCollection, ListCollectionCardProps, ListProp, MultipleTitleProps} from "@interface/application/IListCollection";
import {SortType} from "@organism/collection_view/interfaces";
import {ColorTheme} from "../../components/general/Theme";
import {TextSize} from "@atom/text/interfaces";
import {DeleteButtonStyled} from "@organism/collection_view/styles";
import {ComponentPermissionProps} from "@constants/permissions";
import {PermissionButton, PermissionTooltipButton} from "@atom/button/PermissionButton";
import {ViewType} from "@organism/collection_view/CollectionView";
import {AppDispatch} from "@store/store";
import {API_REQUEST_STATE} from "@interface/application/IApplication";

// parent class represents collection of entities
class ListCollection implements IListCollection{

    // to dispatch actions in collection (like delete by id)
    dispatch?: AppDispatch;

    // state of deleting entity
    deletingEntitiesState?: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    // state of uploading image
    uploadingImage?: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    // title of collection
    title?: string | MultipleTitleProps[] | React.ReactNode;

    // name of the property that represents key during collection rendering
    keyPropName: string;

    // props of list view
    listProps: ListProp[] = [];

    // props of grid view
    gridProps: ListCollectionCardProps;

    // name of the properties that should be sorted
    sortingProps: string[] = [];

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
    hasActions?: boolean;

    // on/off checkboxes of collection
    hasCheckboxes?: boolean;

    // on/off search input of collection
    hasSearch?: boolean;

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

    constructor(data?: IListCollection) {
        this.hasActions = data && data.hasOwnProperty('hasActions') ? data.hasActions : true;
        this.hasCheckboxes = data && data.hasOwnProperty('hasCheckboxes') ? data.hasCheckboxes : true;
        this.hasSearch = data && data.hasOwnProperty('hasSearch') ? data.hasSearch : true;
    }

    /**
     * search in collection
     * @param entity
     * @param searchValue
     */
    search(entity: any, searchValue: string): boolean{
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
     */
    getEntitiesByPage(searchValue: string, page: number, entitiesPerPage: number): any[]{
        let filteredEntities = this.entities.filter(visibleEntity => this.search(visibleEntity, searchValue));
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